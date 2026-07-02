<?php

namespace App\Http\Controllers;

use App\Exports\ProductTemplateExport;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\BarcodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductController extends Controller
{
    /**
     * Menampilkan daftar produk dengan relasi kategori.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manage-products');

        $search = $request->get('search');

        $products = Product::with(['category', 'brand', 'variants'])
            ->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('barcode', 'like', "%{$s}%")
                ->orWhere('description', 'like', "%{$s}%")
                ->orWhereHas('category', fn ($cq) => $cq->where('name', 'like', "%{$s}%"))
                ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', "%{$s}%"))
            )
            ->latest()
            ->paginate((int) $request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => Category::select('id', 'name')->get(),
            'brands' => Brand::select('id', 'name')->get(),
            'filters' => ['search' => $search, 'per_page' => (int) $request->get('per_page', 10)],
        ]);
    }

    /**
     * Menampilkan form pembuatan produk baru.
     */
    public function create(Request $request): Response
    {
        Gate::authorize('manage-products');

        return Inertia::render('products/create', [
            'categories' => Category::select('id', 'name')->get(),
            'brands' => Brand::select('id', 'name')->get(),
        ]);
    }

    /**
     * Menyimpan produk baru beserta upload gambar.
     */
    public function store(StoreProductRequest $request)
    {
        Gate::authorize('manage-products');

        $tenant = tenant();
        if ($tenant && $tenant->products()->count() >= $tenant->maxProducts()) {
            return Redirect::back()->with('error', 'Batas produk gratis ('.$tenant->maxProducts().') telah tercapai. Upgrade ke Premium untuk produk unlimited.');
        }

        $validated = $request->validated();

        if ($tenant && ! $tenant->canMarketplace()) {
            $validated['visible_online'] = false;
        }

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products/'.tenant_id(), 'public');
        }

        $product = Product::create($validated);

        if (empty($validated['barcode'])) {
            $barcode = 'BRC-'.$product->tenant_id.'-'.$product->id;
            $product->update(['barcode' => $barcode]);
            BarcodeService::bust($barcode);
        }

        if (! empty($validated['variants'])) {
            $product->variants()->createMany($validated['variants']);
        }

        return Redirect::back()->with('success', 'Product created successfully.');
    }

    /**
     * Memperbarui data produk dan mengelola penggantian file gambar.
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        Gate::authorize('manage-products');

        $validated = $request->validated();

        $tenant = tenant();
        if ($tenant && ! $tenant->canMarketplace()) {
            $validated['visible_online'] = false;
        }

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products/'.tenant_id(), 'public');
        } else {
            unset($validated['image']);
        }

        $oldBarcode = $product->getOriginal('barcode');

        $product->update($validated);

        if ($oldBarcode !== $product->barcode) {
            if ($oldBarcode) {
                BarcodeService::bust($oldBarcode);
            }
            if ($product->barcode) {
                BarcodeService::bust($product->barcode);
            }
        }

        if (isset($validated['variants'])) {
            $product->variants()->delete();
            $product->variants()->createMany($validated['variants']);
        }

        return Redirect::back()->with('success', 'Product updated successfully.');
    }

    /**
     * Menghapus produk dan file gambar terkait.
     */
    public function destroy(Product $product)
    {
        Gate::authorize('manage-products');

        if ($product->transactionDetails()->exists()) {
            return Redirect::back()->with('error', 'Cannot delete product with transaction history. Use "inactive" status instead.');
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        if ($product->barcode) {
            BarcodeService::bust($product->barcode);
        }

        $product->delete();

        return Redirect::back()->with('success', 'Product deleted successfully.');
    }

    /**
     * Menghapus banyak produk sekaligus.
     */
    public function bulkDestroy(Request $request)
    {
        Gate::authorize('manage-products');

        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return Redirect::back()->with('error', 'Tidak ada produk yang dipilih.');
        }

        // 1. Ambil produk beserta relasi transaksi sekaligus (Eager Loading)
        $products = Product::withExists('transactionDetails')
            ->whereIn('id', $ids)
            ->get();

        $idsToDelete = [];
        $imagesToDelete = [];
        $skipped = 0;

        // 2. Pilah data di dalam memori PHP (Sangat cepat, tanpa query berulang)
        foreach ($products as $product) {
            if ($product->transaction_details_exists) {
                $skipped++;

                continue;
            }

            $idsToDelete[] = $product->id;
            if ($product->image) {
                $imagesToDelete[] = $product->image;
            }
        }

        $deleted = count($idsToDelete);

        if ($deleted > 0) {
            // 3. Hapus cache barcode
            $barcodesToBust = Product::whereIn('id', $idsToDelete)
                ->whereNotNull('barcode')
                ->pluck('barcode');

            foreach ($barcodesToBust as $barcode) {
                BarcodeService::bust($barcode);
            }

            // 4. Hapus semua file gambar sekaligus dalam satu operasi penyimpanan
            if (! empty($imagesToDelete)) {
                Storage::disk('public')->delete($imagesToDelete);
            }

            // 5. Hapus semua data di database sekaligus hanya dengan SATU QUERY
            Product::whereIn('id', $idsToDelete)->delete();
        }

        // 5. Menyusun pesan respon
        $message = $deleted.' produk berhasil dihapus.';
        if ($skipped > 0) {
            $message .= ' '.$skipped.' produk dilewati karena memiliki riwayat transaksi.';
        }

        return Redirect::back()->with($deleted > 0 ? 'success' : 'error', $message);
    }

    /**
     * Menampilkan detail produk.
     */
    public function show(Product $product)
    {
        Gate::authorize('manage-products');

        $product->load(['category', 'brand', 'variants']);

        return Inertia::render('products/show', [
            'product' => $product,
        ]);
    }

    public function import(Request $request)
    {
        Gate::authorize('manage-products');

        $tenant = tenant();
        if ($tenant && $tenant->products()->count() >= $tenant->maxProducts()) {
            return Redirect::back()->with('error', 'Batas produk gratis ('.$tenant->maxProducts().') telah tercapai. Upgrade ke Premium untuk produk unlimited.');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $imported = 0;
        $errors = [];
        $rowNumber = 0;

        $rows = Excel::toArray(new class implements ToArray
        {
            public function array(array $array): void {}
        }, $request->file('file'));

        $rows = $rows[0] ?? [];

        if (empty($rows)) {
            session()->flash('import', [
                'imported' => 0,
                'errors' => ['File Excel kosong atau tidak valid.'],
            ]);

            return redirect()->back();
        }

        $headers = array_map('trim', array_map('strval', $rows[0]));

        foreach (array_slice($rows, 1) as $row) {
            $rowNumber++;
            $row = array_map('trim', array_map('strval', $row));

            if (count($headers) !== count($row)) {
                $errors[] = "Baris {$rowNumber}: Jumlah kolom tidak sesuai.";

                continue;
            }

            $rowData = array_combine($headers, $row);

            if (blank($rowData['name'] ?? null)) {
                $errors[] = "Baris {$rowNumber}: Nama produk wajib diisi.";

                continue;
            }

            if (! is_numeric($rowData['price'] ?? null) || (float) $rowData['price'] < 0) {
                $errors[] = "Baris {$rowNumber}: Harga harus berupa angka dan tidak boleh negatif.";

                continue;
            }

            // 🛠️ FIX 1: Otomatis bikin kategori baru kalau belum terdaftar
            $category = null;
            if (! blank($rowData['category'] ?? null)) {
                try {
                    $category = Category::firstOrCreate([
                        'tenant_id' => tenant_id(),
                        'name' => $rowData['category'],
                    ]);
                } catch (\Throwable $e) {
                    $errors[] = "Baris {$rowNumber}: Gagal membuat kategori '{$rowData['category']}'.";

                    continue;
                }
            }

            // 🛠️ FIX 2: Otomatis bikin brand baru juga kalau belum terdaftar (opsional tapi aman)
            $brand = null;
            if (! blank($rowData['brand'] ?? null)) {
                try {
                    $brand = Brand::firstOrCreate([
                        'tenant_id' => tenant_id(),
                        'name' => $rowData['brand'],
                    ]);
                } catch (\Throwable $e) {
                    $errors[] = "Baris {$rowNumber}: Gagal membuat brand '{$rowData['brand']}'.";

                    continue;
                }
            }

            $status = ! blank($rowData['status'] ?? null) ? strtolower($rowData['status']) : 'active';

            if (! in_array($status, ['active', 'inactive'])) {
                $errors[] = "Baris {$rowNumber}: Status harus 'active' atau 'inactive'.";

                continue;
            }

            $barcode = $rowData['barcode'] ?? null;

            if (! blank($barcode)) {
                $existing = Product::query()
                    ->where('tenant_id', tenant_id())
                    ->where('barcode', $barcode)
                    ->exists();

                if ($existing) {
                    $errors[] = "Baris {$rowNumber}: Barcode '{$barcode}' sudah digunakan.";

                    continue;
                }
            }

            try {
                $product = Product::create([
                    'name' => $rowData['name'],
                    'description' => $rowData['description'] ?? null,
                    'price' => (float) $rowData['price'],
                    'cost_price' => ! blank($rowData['cost_price'] ?? null) ? (float) $rowData['cost_price'] : null,
                    'stock' => (int) ($rowData['stock'] ?? 0),
                    'barcode' => $barcode,
                    'category_id' => $category?->id,
                    'brand_id' => $brand?->id,
                    'status' => $status,
                ]);

                if (blank($barcode)) {
                    $product->barcode = 'BRC-'.$product->tenant_id.'-'.$product->id;
                    $product->save();
                }

                BarcodeService::bust($product->barcode);

                $imported++;
            } catch (\Throwable $e) {
                $errors[] = "Baris {$rowNumber}: Gagal menyimpan produk '{$rowData['name']}' — {$e->getMessage()}";
            }
        }

        // 🛠️ FIX 3: Dibungkus ke dalam array 'flash' -> 'import' agar dibaca oleh React (Inertia)
        session()->flash('import', [
            'imported' => $imported,
            'errors' => $errors,
        ]);

        return redirect()->back();
    }

    public function downloadTemplate(): BinaryFileResponse
    {
        return Excel::download(new ProductTemplateExport, 'template-produk.xlsx');
    }
}
