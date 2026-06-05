# Implementasi Barcode Feature — Lengkap

## Langkah 1: Form Request — Tambah validasi barcode

### StoreProductRequest.php
```php
// Tambah setelah 'cost_price' => ...
'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products')
    ->where(fn ($q) => $q->where('tenant_id', tenant_id()))],
```

### UpdateProductRequest.php
```php
// Tambah setelah 'cost_price' => ...
'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products')
    ->ignore($this->route('product'))
    ->where(fn ($q) => $q->where('tenant_id', tenant_id()))],
```

---

## Langkah 2: ProductController — search, auto-generate, cache bust

### Import BarcodeService
```php
use App\Services\BarcodeService;
```

### store() — auto-generate jika barcode kosong
```php
$product = Product::create($validated);

if (empty($validated['barcode'])) {
    $barcode = 'BRC-'.$product->tenant_id.'-'.$product->id;
    $product->update(['barcode' => $barcode]);
    BarcodeService::bust($barcode);
}

if (! empty($validated['variants'])) {
    $product->variants()->createMany($validated['variants']);
}
```

### update() — cache bust jika barcode berubah
```php
$oldBarcode = $product->getOriginal('barcode');

$product->update($validated);

if ($oldBarcode !== $product->barcode) {
    if ($oldBarcode) BarcodeService::bust($oldBarcode);
    if ($product->barcode) BarcodeService::bust($product->barcode);
}
```

### destroy() — cache bust
```php
if ($product->barcode) {
    BarcodeService::bust($product->barcode);
}

$product->delete();
```

### bulkDestroy() — cache bust untuk semua
```php
// Sebelum Product::whereIn('id', $idsToDelete)->delete();
$barcodesToBust = Product::whereIn('id', $idsToDelete)
    ->whereNotNull('barcode')
    ->pluck('barcode');

foreach ($barcodesToBust as $barcode) {
    BarcodeService::bust($barcode);
}

Product::whereIn('id', $idsToDelete)->delete();
```

### index() — tambah search by barcode
```php
->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
    ->orWhere('barcode', 'like', "%{$s}%")
    ->orWhere('description', 'like', "%{$s}%")
    ->orWhereHas('category', fn ($cq) => $cq->where('name', 'like', "%{$s}%"))
    ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', "%{$s}%"))
)
```

### import() — tambah barcode
```php
// Di Product::create(), tambah:
'barcode' => $rowData['barcode'] ?? null,
```

---

## Langkah 3: ProductTemplateExport — tambah kolom barcode

```php
public function headings(): array
{
    return [
        'name',
        'description',
        'price',
        'stock',
        'barcode',       // <-- baru
        'category',
        'brand',
        'status',
    ];
}

public function array(): array
{
    return [
        [
            'Teh Botol',
            'Minuman teh botol 350ml',
            5000,
            100,
            '8991234567890',  // <-- contoh barcode
            'Minuman Ringan',
            '',
            'active',
        ],
        [
            'Keripik Singkong',
            'Keripik singkong original 200gr',
            3500,
            50,
            '',
            'Makanan Ringan',
            '',
            'active',
        ],
    ];
}
```

---

## Langkah 4: Frontend Product Interface (index.tsx)

### Interface Product — tambah
```typescript
interface Product {
    // ... existing fields
    barcode?: string | null;
}
```

### useForm initial data — tambah
```typescript
barcode: '',
```

### openEditDialog — tambah
```typescript
barcode: product.barcode || '',
```

### Kolom tabel — tambah setelah kolom Harga Jual
```typescript
{
    accessorKey: 'barcode',
    header: 'Barcode',
    cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
            {row.original.barcode || '—'}
        </span>
    ),
},
```

### Input field di form — tambah di section "Harga & Inventaris"
```tsx
{/* Barcode */}
<div className="grid gap-2">
    <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
        Barcode
    </Label>
    <div className="flex gap-2">
        <Input
            value={data.barcode}
            onChange={(e) => setData('barcode', e.target.value)}
            placeholder="Scan atau ketik barcode..."
            className="h-12 flex-1 rounded-2xl border-neutral-200 font-mono text-[14px] dark:border-neutral-800"
        />
        <button
            type="button"
            onClick={() => {
                const gen = 'BRC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                setData('barcode', gen);
            }}
            className="h-12 shrink-0 rounded-2xl border border-neutral-200 bg-card px-4 text-[12px] font-bold text-muted-foreground hover:bg-accent dark:border-neutral-800"
        >
            Generate
        </button>
    </div>
</div>
```

---

## Langkah 5: Show Page (show.tsx) — tambah display barcode

### Interface Product — tambah
```typescript
barcode?: string | null;
```

### Di specs section — tambah card setelah Modal Awal
```tsx
<div className="space-y-1.5">
    <div className="flex items-center gap-1.5 text-neutral-500">
        <Tag className="size-4" />
        <span className="text-[12px] font-bold uppercase">
            Barcode
        </span>
    </div>
    <p className="font-mono text-lg font-bold">
        {product.barcode || '—'}
    </p>
</div>
```

---

## Langkah 6: POS Page — prepopulate barcodeCacheRef

Di `transactions/index.tsx`, setelah `const barcodeCacheRef = useRef(new Map<string, Product>());`:

```typescript
// Prepopulate cache dari initial products
useEffect(() => {
    for (const product of products) {
        // Gunakan name sebagai fallback lookup
        barcodeCacheRef.current.set(product.name.toLowerCase(), product);
    }
}, [products]);
```

Tapi ini kurang tepat karena key-nya harus barcode. Seharusnya:

```typescript
useEffect(() => {
    for (const product of products) {
        if ((product as any).barcode) {
            barcodeCacheRef.current.set((product as any).barcode, product);
        }
    }
}, [products]);
```

---

## Langkah 7: Jalankan verifikasi

```bash
vendor/bin/pint --format agent
npm run lint
npm run format
```
