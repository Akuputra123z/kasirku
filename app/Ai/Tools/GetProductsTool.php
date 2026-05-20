<?php

// app/Ai/Tools/GetProductsTool.php

namespace App\Ai\Tools;

use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetProductsTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar produk dari database. Bisa filter berdasarkan status (active/inactive) atau nama kategori.';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = Product::with('category');

        if (! empty($request['status'])) {
            $query->where('status', $request['status']);
        }

        if (! empty($request['category'])) {
            $query->whereHas('category', fn ($q) => $q->where('name', 'like', '%'.$request['category'].'%'));
        }

        $products = $query->latest()->limit(20)->get()->map(fn ($p) => [
            'nama' => $p->name,
            'harga' => 'Rp '.number_format($p->price, 0, ',', '.'),
            'stok' => $p->stock,
            'kategori' => $p->category?->name ?? '-',
            'status' => $p->status,
        ]);

        if ($products->isEmpty()) {
            return 'Tidak ada produk ditemukan.';
        }

        return json_encode($products->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->nullable()->enum(['active', 'inactive'])->description('Filter status produk'),
            'category' => $schema->string()->nullable()->description('Filter berdasarkan nama kategori'),
        ];
    }
}
