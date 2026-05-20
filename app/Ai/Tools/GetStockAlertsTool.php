<?php

namespace App\Ai\Tools;

use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetStockAlertsTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar produk dengan stok menipis atau habis. Bisa atur batas minimal stok.';
    }

    public function handle(Request $request): Stringable|string
    {
        $threshold = max((int) ($request['threshold'] ?? 5), 1);

        $products = Product::with('category')
            ->where('stock', '<=', $threshold)
            ->orderBy('stock')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'nama' => $p->name,
                'kategori' => $p->category?->name ?? '-',
                'stok' => $p->stock,
                'status' => $p->stock === 0 ? 'Habis' : ($p->stock <= $threshold ? 'Menipis' : 'Aman'),
            ]);

        if ($products->isEmpty()) {
            return 'Semua produk memiliki stok di atas batas minimal.';
        }

        return json_encode($products->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'threshold' => $schema->integer()->nullable()->min(1)->description('Batas minimal stok (default: 5)'),
        ];
    }
}
