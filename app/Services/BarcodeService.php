<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class BarcodeService
{
    private const CACHE_TTL = 3600;

    private const CACHE_PREFIX = 'barcode:';

    public function lookup(string $barcode): ?array
    {
        $tenantId = tenant_id();
        $cacheKey = self::CACHE_PREFIX.$tenantId.':'.$barcode;

        $cached = Cache::store('file')->get($cacheKey);
        if ($cached !== null) {
            // Stok TIDAK pernah di-cache — selalu dibaca fresh supaya hasil
            // scan stok tidak basi setelah penjualan/penyesuaian.
            $cached['stock'] = (int) (Product::where('id', $cached['id'])->value('stock') ?? 0);

            return $cached;
        }

        // Hanya perbolehkan bila tepat satu produk aktif memegang barcode
        // tersebut — duplikat = tolak, jangan pilih sembarangan.
        $product = Product::query()
            ->where('barcode', $barcode)
            ->where('status', 'active')
            ->with([
                'category:id,name',
                'variants:id,product_id,name,additional_price',
            ])
            ->get(['id', 'name', 'price', 'stock', 'image', 'category_id']);

        if ($product->count() !== 1) {
            return null;
        }

        $data = $product->first()->toArray();

        Cache::store('file')->put($cacheKey, $data, self::CACHE_TTL);

        return $data;
    }

    public static function bust(string $barcode): void
    {
        if ($tenantId = tenant_id()) {
            Cache::store('file')->forget(self::CACHE_PREFIX.$tenantId.':'.$barcode);
        }
    }

    public static function bustForProductId(int $productId): void
    {
        $barcode = Product::where('id', $productId)->value('barcode');

        if ($barcode) {
            self::bust((string) $barcode);
        }
    }
}
