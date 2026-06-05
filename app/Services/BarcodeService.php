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
            return $cached;
        }

        $product = Product::query()
            ->where('barcode', $barcode)
            ->where('status', 'active')
            ->with([
                'category:id,name',
                'variants:id,product_id,name,additional_price',
            ])
            ->first([
                'id',
                'name',
                'price',
                'stock',
                'image',
                'category_id',
            ]);

        if (! $product) {
            return null;
        }

        $data = $product->toArray();

        Cache::store('file')->put($cacheKey, $data, self::CACHE_TTL);

        return $data;
    }

    public static function bust(string $barcode): void
    {
        if ($tenantId = tenant_id()) {
            Cache::store('file')->forget(self::CACHE_PREFIX.$tenantId.':'.$barcode);
        }
    }
}
