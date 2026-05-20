<?php

namespace App\Ai\Tools;

use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetProductVariantsTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil varian dan ekstra/tambahan dari suatu produk. Contoh varian: warna, kapasitas penyimpanan, ukuran. Contoh ekstra: garansi tambahan, sparepart, bundle.';
    }

    public function handle(Request $request): Stringable|string
    {
        $productId = $request['product_id'] ?? null;

        if (! $productId) {
            return 'Silakan berikan ID produk yang ingin dicek variannya.';
        }

        $product = Product::with(['variants', 'extras'])->find($productId);

        if (! $product) {
            return 'Produk dengan ID tersebut tidak ditemukan.';
        }

        $result = [
            'produk' => $product->name,
            'varian' => $product->variants->map(fn ($v) => [
                'nama' => $v->name,
                'tambahan_harga' => 'Rp '.number_format($v->additional_price, 0, ',', '.'),
            ]),
            'ekstra' => $product->extras->map(fn ($e) => [
                'nama' => $e->name,
                'harga' => 'Rp '.number_format($e->price, 0, ',', '.'),
            ]),
        ];

        return json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'product_id' => $schema->integer()->nullable()->description('ID produk yang ingin dilihat varian dan ekstranya'),
        ];
    }
}
