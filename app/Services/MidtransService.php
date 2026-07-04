<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    protected ?string $serverKey;

    protected string $snapUrl;

    protected string $apiUrl;

    public function __construct()
    {
        $this->serverKey = config('midtrans.server_key');
        $isProduction = config('midtrans.is_production');
        $this->snapUrl = $isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
        $this->apiUrl = $isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    public function createSnapTransaction(Order $order, array $customerDetails, ?string $finishRedirectUrl = null, ?string $snapOrderId = null): ?array
    {
        $items = $this->buildItemDetails($order);
        $grossAmount = (int) round($order->total);

        $params = [
            'transaction_details' => [
                'order_id' => $snapOrderId ?? $order->order_number,
                'gross_amount' => $grossAmount,
            ],
            'expiry' => [
                'unit' => 'day',
                'duration' => 1,
            ],
            'item_details' => $items,
            'customer_details' => [
                'first_name' => mb_substr($customerDetails['name'] ?? $order->recipient_name, 0, 20),
                'email' => $customerDetails['email'] ?? $order->order_number.'@marketplace.local',
                'phone' => preg_replace('/[^\d+]/', '', $order->recipient_phone),
                'billing_address' => [
                    'address' => mb_substr($order->shipping_address, 0, 200),
                ],
                'shipping_address' => [
                    'first_name' => mb_substr($order->recipient_name, 0, 20),
                    'phone' => preg_replace('/[^\d+]/', '', $order->recipient_phone),
                    'address' => mb_substr($order->shipping_address, 0, 200),
                ],
            ],
            'enabled_payments' => [
                'credit_card', 'mandiri_clickpay', 'cimb_clicks',
                'bca_klikbca', 'bca_klikpay', 'bri_epay', 'echannel',
                'permata_va', 'bca_va', 'bni_va', 'bri_va',
                'other_va', 'gopay', 'shopeepay',
                'qris', 'akulaku', 'kredivo',
            ],
        ];

        if ($finishRedirectUrl) {
            $params['callbacks'] = [
                'finish' => $finishRedirectUrl,
            ];
        }

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->timeout(30)
            ->connectTimeout(10)
            ->retry(2, 1000)
            ->post($this->snapUrl.'/transactions', $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans Snap API error', [
            'order' => $order->order_number,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function createDirectSnapTransaction(string $orderId, int $amount, array $customerDetails, ?string $finishRedirectUrl = null): ?array
    {
        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'expiry' => [
                'unit' => 'day',
                'duration' => 1,
            ],
            'item_details' => [
                [
                    'id' => $orderId,
                    'price' => $amount,
                    'quantity' => 1,
                    'name' => 'Langganan Premium',
                ],
            ],
            'customer_details' => [
                'first_name' => mb_substr($customerDetails['first_name'] ?? '', 0, 20),
                'email' => $customerDetails['email'] ?? $orderId.'@marketplace.local',
                'phone' => $customerDetails['phone'] ?? '',
            ],
            'enabled_payments' => [
                'credit_card', 'mandiri_clickpay', 'cimb_clicks',
                'bca_klikbca', 'bca_klikpay', 'bri_epay', 'echannel',
                'permata_va', 'bca_va', 'bni_va', 'bri_va',
                'other_va', 'gopay', 'shopeepay',
                'qris', 'akulaku', 'kredivo',
            ],
        ];

        if ($finishRedirectUrl) {
            $params['callbacks'] = [
                'finish' => $finishRedirectUrl,
            ];
        }

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->timeout(30)
            ->connectTimeout(10)
            ->retry(2, 1000)
            ->post($this->snapUrl.'/transactions', $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans Snap API error (direct)', [
            'order_id' => $orderId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function getTransactionStatus(string $orderId): ?array
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Accept' => 'application/json'])
            ->timeout(15)
            ->connectTimeout(5)
            ->get($this->apiUrl.'/'.$orderId.'/status');

        if ($response->successful()) {
            return $response->json();
        }

        Log::warning('Midtrans status check failed', [
            'order_id' => $orderId,
            'status' => $response->status(),
        ]);

        return null;
    }

    public function cancelTransaction(string $orderId): bool
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->timeout(15)
            ->connectTimeout(5)
            ->post($this->apiUrl.'/'.$orderId.'/cancel');

        if ($response->successful()) {
            return true;
        }

        Log::warning('Midtrans cancel failed', [
            'order_id' => $orderId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return false;
    }

    public function chargeBankTransfer(Order $order, string $bank, ?string $orderId = null): ?array
    {
        $params = [
            'payment_type' => 'bank_transfer',
            'transaction_details' => [
                'order_id' => $orderId ?? $order->order_number,
                'gross_amount' => (int) round($order->total),
            ],
            'bank_transfer' => [
                'bank' => $bank,
            ],
            'item_details' => $this->buildItemDetails($order),
            'customer_details' => [
                'first_name' => mb_substr($order->recipient_name, 0, 20),
                'phone' => preg_replace('/[^\d+]/', '', $order->recipient_phone),
                'email' => $order->order_number.'@marketplace.local',
            ],
            'expiry' => [
                'unit' => 'day',
                'duration' => 1,
            ],
        ];

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->timeout(30)
            ->connectTimeout(10)
            ->retry(2, 1000)
            ->post($this->apiUrl.'/charge', $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans bank transfer charge error', [
            'order' => $order->order_number,
            'bank' => $bank,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function chargeQris(Order $order, ?string $orderId = null): ?array
    {
        $params = [
            'payment_type' => 'qris',
            'transaction_details' => [
                'order_id' => $orderId ?? $order->order_number,
                'gross_amount' => (int) round($order->total),
            ],
            'item_details' => $this->buildItemDetails($order),
            'customer_details' => [
                'first_name' => mb_substr($order->recipient_name, 0, 20),
                'phone' => preg_replace('/[^\d+]/', '', $order->recipient_phone),
                'email' => $order->order_number.'@marketplace.local',
            ],
            'expiry' => [
                'unit' => 'day',
                'duration' => 1,
            ],
        ];

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->timeout(30)
            ->connectTimeout(10)
            ->retry(2, 1000)
            ->post($this->apiUrl.'/charge', $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans QRIS charge error', [
            'order' => $order->order_number,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function chargeSubscriptionBankTransfer(string $orderId, int $amount, string $customerName, string $customerEmail, string $bank): ?array
    {
        $params = [
            'payment_type' => 'bank_transfer',
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'bank_transfer' => [
                'bank' => $bank,
            ],
            'item_details' => [
                [
                    'id' => $orderId,
                    'price' => $amount,
                    'quantity' => 1,
                    'name' => 'Langganan Premium',
                ],
            ],
            'customer_details' => [
                'first_name' => mb_substr($customerName, 0, 20),
                'email' => $customerEmail,
            ],
            'expiry' => [
                'unit' => 'day',
                'duration' => 1,
            ],
        ];

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->timeout(30)
            ->connectTimeout(10)
            ->retry(2, 1000)
            ->post($this->apiUrl.'/charge', $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans subscription VA charge error', [
            'order_id' => $orderId,
            'bank' => $bank,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function chargeSubscriptionQris(string $orderId, int $amount, string $customerName, string $customerEmail): ?array
    {
        $params = [
            'payment_type' => 'qris',
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'item_details' => [
                [
                    'id' => $orderId,
                    'price' => $amount,
                    'quantity' => 1,
                    'name' => 'Langganan Premium',
                ],
            ],
            'customer_details' => [
                'first_name' => mb_substr($customerName, 0, 20),
                'email' => $customerEmail,
            ],
            'expiry' => [
                'unit' => 'day',
                'duration' => 1,
            ],
        ];

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->timeout(30)
            ->connectTimeout(10)
            ->retry(2, 1000)
            ->post($this->apiUrl.'/charge', $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans subscription QRIS charge error', [
            'order_id' => $orderId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    private function buildItemDetails(Order $order): array
    {
        $items = $order->items->map(function ($item) {
            return [
                'id' => (string) ($item->product_id ?? 'item-'.$item->id),
                'price' => (int) round($item->price),
                'quantity' => max(1, (int) $item->quantity),
                'name' => $this->sanitizeItemName($item->product_name.($item->variant_name ? ' ('.$item->variant_name.')' : '')),
            ];
        })->toArray();

        $shippingCost = (int) round($order->shipping_cost);

        if ($shippingCost > 0) {
            $items[] = [
                'id' => 'shipping',
                'price' => $shippingCost,
                'quantity' => 1,
                'name' => 'Ongkos Kirim',
            ];
        }

        $itemsTotal = collect($items)->sum(fn ($i) => $i['price'] * $i['quantity']);
        $grossAmount = (int) round($order->total);

        if ($itemsTotal !== $grossAmount) {
            $items[] = [
                'id' => 'adjustment',
                'price' => $grossAmount - $itemsTotal,
                'quantity' => 1,
                'name' => 'Penyesuaian',
            ];
        }

        return $items;
    }

    protected function sanitizeItemName(string $name): string
    {
        $name = preg_replace('/[^\p{L}\p{N}\s\-_,.]/u', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);

        $name = trim($name);

        return mb_substr($name, 0, 50);
    }
}
