<?php

namespace App\Services;

use App\Models\PpobProduct;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DigiflazzService
{
    protected string $username;

    protected string $secretKey;

    protected string $baseUrl;

    public function __construct()
    {
        $this->username = config('digiflazz.username');
        $this->secretKey = config('digiflazz.secret_key');
        $this->baseUrl = config('digiflazz.base_url');
    }

    public function getPriceList(): ?array
    {
        $sign = md5($this->username.$this->secretKey.'pricelist');

        $response = Http::timeout(30)
            ->connectTimeout(10)
            ->post($this->baseUrl.'/v1/price-list', [
                'username' => $this->username,
                'sign' => $sign,
            ]);

        if ($response->successful()) {
            $data = $response->json('data');

            if (is_array($data) && array_is_list($data)) {
                return $data;
            }

            Log::warning('Digiflazz price-list response with no data', ['response' => $data]);

            return null;
        }

        Log::error('Digiflazz price-list error', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function syncPriceList(): array
    {
        $products = $this->getPriceList();
        $synced = 0;
        $errors = 0;

        if (! $products || ! isset($products[0])) {
            Log::warning('Digiflazz sync: no valid product list', ['response' => $products]);

            return ['synced' => 0, 'errors' => 1];
        }

        foreach ($products as $item) {
            try {
                if (! isset($item['seller_product_status']) || ! $item['seller_product_status']) {
                    continue;
                }

                $markup = $this->getMarkupForCategory($item['category']);
                $sellerPrice = (int) $item['price'];
                $buyerPrice = $this->calculateBuyerPrice($sellerPrice, $markup);

                PpobProduct::updateOrCreate(
                    ['buyer_sku_code' => $item['buyer_sku_code']],
                    [
                        'product_name' => $item['product_name'],
                        'category' => $item['category'],
                        'brand' => $item['brand'],
                        'type' => $item['type'] ?? 'topup',
                        'seller_price' => $sellerPrice,
                        'buyer_price' => $buyerPrice,
                        'markup_type' => $markup['type'],
                        'markup_value' => $markup['value'],
                        'unlimited_stock' => $item['unlimited_stock'],
                        'stock' => $item['stock'],
                        'multi' => $item['multi'],
                        'start_cut_off' => $item['start_cut_off'] ?? null,
                        'end_cut_off' => $item['end_cut_off'] ?? null,
                        'description' => $item['desc'] ?? null,
                        'is_active' => $item['buyer_product_status'] && $item['seller_product_status'],
                        'synced_at' => now(),
                    ]
                );

                $synced++;
            } catch (\Exception $e) {
                Log::warning('Digiflazz sync product error', [
                    'sku' => $item['buyer_sku_code'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        PpobProduct::where('synced_at', '<', now()->subHours(2))
            ->orWhereNull('synced_at')
            ->update(['is_active' => false]);

        return ['synced' => $synced, 'errors' => $errors];
    }

    public function inquiry(string $customerNo, string $category): ?array
    {
        $skuCode = $this->getInquirySkuCode($category);

        if (strtolower($category) === 'pln') {
            $sign = md5($this->username.$this->secretKey.$customerNo);

            $response = Http::timeout(30)
                ->connectTimeout(10)
                ->post($this->baseUrl.'/v1/inquiry-pln', [
                    'username' => $this->username,
                    'customer_no' => $customerNo,
                    'sign' => $sign,
                ]);

            if ($response->successful()) {
                $data = $response->json('data');

                if (isset($data['status']) && $data['status'] === 'Sukses') {
                    return $data;
                }

                Log::warning('Digiflazz inquiry-pln not successful', [
                    'customer_no' => $customerNo,
                    'response' => $data,
                ]);

                return $data;
            }

            Log::error('Digiflazz inquiry-pln error', [
                'customer_no' => $customerNo,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $refId = 'CEK-'.now()->timestamp.'-'.rand(1000, 9999);
        $sign = md5($this->username.$this->secretKey.$refId);

        $response = Http::timeout(30)
            ->connectTimeout(10)
            ->post($this->baseUrl.'/v1/transaction', [
                'username' => $this->username,
                'buyer_sku_code' => $skuCode,
                'customer_no' => $customerNo,
                'ref_id' => $refId,
                'sign' => $sign,
                'commands' => 'inq-pasca',
            ]);

        if ($response->successful()) {
            return $response->json('data');
        }

        Log::error('Digiflazz inquiry error', [
            'customer_no' => $customerNo,
            'category' => $category,
            'sku' => $skuCode,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function topUp(string $customerNo, string $buyerSkuCode, string $refId): ?array
    {
        $sign = md5($this->username.$this->secretKey.$refId);

        $response = Http::timeout(30)
            ->connectTimeout(10)
            ->retry(2, 1000)
            ->post($this->baseUrl.'/v1/transaction', [
                'username' => $this->username,
                'customer_no' => $customerNo,
                'buyer_sku_code' => $buyerSkuCode,
                'ref_id' => $refId,
                'sign' => $sign,
            ]);

        if ($response->successful()) {
            return $response->json('data');
        }

        Log::error('Digiflazz transaction error', [
            'customer_no' => $customerNo,
            'sku' => $buyerSkuCode,
            'ref_id' => $refId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function checkStatus(string $refId): ?array
    {
        $sign = md5($this->username.$this->secretKey.$refId);

        $response = Http::timeout(15)
            ->connectTimeout(5)
            ->post($this->baseUrl.'/v1/check-status', [
                'username' => $this->username,
                'ref_id' => $refId,
                'sign' => $sign,
            ]);

        if ($response->successful()) {
            return $response->json('data');
        }

        Log::warning('Digiflazz check-status error', [
            'ref_id' => $refId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function getCategories(): array
    {
        return PpobProduct::where('is_active', true)
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();
    }

    public function getBrands(string $category): array
    {
        return PpobProduct::where('is_active', true)
            ->where('category', $category)
            ->select('brand')
            ->distinct()
            ->orderBy('brand')
            ->pluck('brand')
            ->toArray();
    }

    protected function calculateBuyerPrice(int $sellerPrice, array $markup): int
    {
        if ($markup['type'] === 'fixed') {
            $price = $sellerPrice + (int) $markup['value'];
        } else {
            $price = $sellerPrice + (int) round($sellerPrice * $markup['value'] / 100);
        }

        return (int) (ceil($price / 100) * 100);
    }

    protected function getInquirySkuCode(string $category): string
    {
        return match (strtolower($category)) {
            'pln' => 'PLN',
            'bpjs' => 'BPJS',
            'pdam' => 'PDAM',
            'telkom' => 'TELKOM',
            'pbb' => 'PBB',
            'gas' => 'GAS',
            default => 'PLN',
        };
    }

    protected function getMarkupForCategory(string $category): array
    {
        $markups = config('digiflazz.markup', []);

        foreach ($markups as $cat => $markup) {
            if (strtolower($cat) === strtolower($category)) {
                return $markup;
            }
        }

        return config('digiflazz.default_markup', ['type' => 'percentage', 'value' => 2]);
    }
}
