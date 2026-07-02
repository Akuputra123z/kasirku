<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function show(Order $order, MidtransService $midtrans)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        // Use midtrans_order_id (the actual ID sent to Midtrans) for status checks.
        // This may differ from order_number when pay() created a new Snap with a suffix.
        $midtransOrderId = $order->midtrans_order_id ?: $order->order_number;

        $qrisQrUrlFromStatus = null;

        if ($order->payment_status === 'unpaid' && $order->midtrans_transaction_id) {
            $statusResponse = $midtrans->getTransactionStatus($midtransOrderId);
            if ($statusResponse) {
                $transactionStatus = $statusResponse['transaction_status'] ?? '';
                $paymentType = $statusResponse['payment_type'] ?? null;
                $bank = $statusResponse['bank'] ?? ($statusResponse['va_numbers'][0]['bank'] ?? null);
                $vaNumber = $statusResponse['va_numbers'][0]['va_number'] ?? ($statusResponse['bill_key'] ?? ($statusResponse['payment_code'] ?? null));
                $transactionId = $statusResponse['transaction_id'] ?? $order->midtrans_transaction_id;

                if (in_array($transactionStatus, ['capture', 'settlement'])) {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'confirmed',
                        'midtrans_transaction_id' => $transactionId,
                    ]);
                }

                if (isset($statusResponse['actions'])) {
                    foreach ($statusResponse['actions'] as $action) {
                        if ($action['name'] === 'generate-qr-code') {
                            $qrisQrUrlFromStatus = $action['url'];
                            break;
                        }
                    }
                }

                $order->payments()->updateOrCreate(
                    ['midtrans_transaction_id' => $transactionId],
                    [
                        'payment_type' => $paymentType,
                        'bank' => $bank,
                        'va_number' => $vaNumber,
                        'gross_amount' => $statusResponse['gross_amount'] ?? $order->total,
                        'status' => $transactionStatus,
                        'raw_response' => $statusResponse,
                    ]
                );
            }
        }

        $order->load(['items', 'tenant:id,slug,name,logo,phone,address,city', 'payments', 'review']);

        $qrisQrUrl = session()->get('qris_qr_url') ?? $qrisQrUrlFromStatus;
        $qrisTransactionId = session()->get('qris_transaction_id');
        $vaNumber = session()->get('va_number');
        $vaBank = session()->get('va_bank');

        $pendingPayment = null;
        if ($qrisQrUrl) {
            $pendingPayment = [
                'type' => 'qris',
                'qr_url' => $qrisQrUrl,
                'transaction_id' => $qrisTransactionId,
            ];
        } elseif ($vaNumber) {
            $pendingPayment = [
                'type' => 'bank_transfer',
                'bank' => $vaBank,
                'va_number' => $vaNumber,
                'transaction_id' => session()->get('midtrans_transaction_id'),
            ];
        }

        return Inertia::render('marketplace/order-detail', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'subtotal' => $order->subtotal,
                'shipping_cost' => $order->shipping_cost,
                'total' => $order->total,
                'type' => $order->type,
                'ppob_category' => $order->ppob_category,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'midtrans_redirect_url' => $order->midtrans_redirect_url,
                'customer_phone' => $order->customer_phone,
                'ppob_buyer_sku_code' => $order->ppob_buyer_sku_code,
                'ppob_customer_name' => $order->ppob_customer_name,
                'digiflazz_status' => $order->digiflazz_status,
                'digiflazz_sn' => $order->digiflazz_sn,
                'digiflazz_message' => $order->digiflazz_message,
                'shipping_courier' => $order->shipping_courier,
                'shipping_service' => $order->shipping_service,
                'shipping_address' => $order->shipping_address,
                'recipient_name' => $order->recipient_name,
                'recipient_phone' => $order->recipient_phone,
                'notes' => $order->notes,
                'created_at' => $order->created_at->format('d M Y H:i'),
                'created_timestamp' => $order->created_at->timestamp,
                'items' => $order->items->map(fn ($i) => [
                    'id' => $i->id,
                    'product_name' => $i->product_name,
                    'variant_name' => $i->variant_name,
                    'quantity' => $i->quantity,
                    'price' => $i->price,
                    'subtotal' => $i->subtotal,
                ]),
                'store' => [
                    'name' => $order->tenant->name,
                    'slug' => $order->tenant->slug,
                    'phone' => $order->tenant->phone,
                    'address' => $order->tenant->address,
                    'city' => $order->tenant->city,
                ],
                'has_review' => $order->review()->exists(),
                'review' => $order->review ? [
                    'rating' => $order->review->rating,
                    'review' => $order->review->review,
                    'created_at' => $order->review->created_at->format('d M Y'),
                ] : null,
                'payments' => $order->payments->map(fn ($p) => [
                    'payment_type' => $p->payment_type,
                    'bank' => $p->bank,
                    'va_number' => $p->va_number,
                    'midtrans_transaction_id' => $p->midtrans_transaction_id,
                    'status' => $p->status,
                    'gross_amount' => $p->gross_amount,
                    'created_at' => $p->created_at->format('d M Y H:i'),
                ]),
            ],
            'clientKey' => config('midtrans.client_key'),
            'pendingPayment' => $pendingPayment,
        ]);
    }

    public function payment(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        $paymentMethods = [
            [
                'id' => 'qris',
                'name' => 'QRIS',
                'description' => 'Bayar pakai QRIS via aplikasi bank / e-wallet',
                'icon' => 'qris',
            ],
            [
                'id' => 'bca_va',
                'name' => 'BCA Virtual Account',
                'description' => 'Transfer ke nomor Virtual Account BCA',
                'icon' => 'bca',
            ],
            [
                'id' => 'bni_va',
                'name' => 'BNI Virtual Account',
                'description' => 'Transfer ke nomor Virtual Account BNI',
                'icon' => 'bni',
            ],
            [
                'id' => 'bri_va',
                'name' => 'BRI Virtual Account',
                'description' => 'Transfer ke nomor Virtual Account BRI',
                'icon' => 'bri',
            ],
            [
                'id' => 'mandiri_va',
                'name' => 'Mandiri Bill Payment',
                'description' => 'Bayar via Mandiri Bill Payment',
                'icon' => 'mandiri',
            ],
        ];

        return Inertia::render('marketplace/payment-selection', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => $order->total,
                'payment_status' => $order->payment_status,
            ],
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function pay(Request $request, Order $order, MidtransService $midtrans)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->payment_status !== 'unpaid') {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('info', 'Pesanan ini sudah dibayar.');
        }

        $this->syncPendingOrders($midtrans, Auth::id());

        $order->refresh();

        if ($order->payment_status === 'paid') {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('success', 'Pembayaran sudah dikonfirmasi.');
        }

        $paymentMethod = $request->input('payment_method', 'qris');

        if ($paymentMethod === 'qris') {
            $qrisOrderId = $order->order_number.'-Q-'.now()->format('His');
            $response = $midtrans->chargeQris($order, $qrisOrderId);

            if ($response && in_array($response['status_code'] ?? '', ['201', '200'])) {
                $transactionId = $response['transaction_id'] ?? null;
                $qrUrl = null;

                if (isset($response['actions'])) {
                    foreach ($response['actions'] as $action) {
                        if ($action['name'] === 'generate-qr-code') {
                            $qrUrl = $action['url'];
                            break;
                        }
                    }
                }

                $order->update([
                    'midtrans_order_id' => $qrisOrderId,
                    'midtrans_transaction_id' => $transactionId,
                ]);

                session()->flash('qris_qr_url', $qrUrl);
                session()->flash('qris_transaction_id', $transactionId);

                return redirect()->route('marketplace.orders.show', $order);
            }

            return redirect()->route('marketplace.orders.show', $order)
                ->with('error', 'Gagal membuat pembayaran QRIS. Silakan coba lagi.');
        }

        $bankMap = [
            'bca_va' => 'bca',
            'bni_va' => 'bni',
            'bri_va' => 'bri',
            'mandiri_va' => 'mandiri',
        ];

        $bank = $bankMap[$paymentMethod] ?? null;

        if (! $bank) {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('error', 'Metode pembayaran tidak valid.');
        }

        $vaOrderId = $order->order_number.'-VA-'.now()->format('His');
        $response = $midtrans->chargeBankTransfer($order, $bank, $vaOrderId);

        if ($response && in_array($response['status_code'] ?? '', ['201', '200'])) {
            $transactionId = $response['transaction_id'] ?? null;
            $vaNumber = $response['va_numbers'][0]['va_number'] ?? null;

            $order->update([
                'midtrans_order_id' => $vaOrderId,
                'midtrans_transaction_id' => $transactionId,
            ]);

            session()->flash('va_number', $vaNumber);
            session()->flash('va_bank', $bank);
            session()->flash('midtrans_transaction_id', $transactionId);

            return redirect()->route('marketplace.orders.show', $order);
        }

        return redirect()->route('marketplace.orders.show', $order)
            ->with('error', 'Gagal membuat pembayaran. Silakan coba lagi.');
    }

    public function cancel(Order $order, MidtransService $midtrans)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if (! in_array($order->payment_status, ['unpaid', 'pending'])) {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('error', 'Pesanan ini tidak bisa dibatalkan.');
        }

        $statusResponse = $midtrans->getTransactionStatus($order->order_number);
        if ($statusResponse) {
            $midtransOrderId = $statusResponse['order_id'] ?? $order->order_number;
            $midtrans->cancelTransaction($midtransOrderId);
        }

        $order->update([
            'status' => 'cancelled',
            'payment_status' => 'failed',
        ]);

        return redirect()->route('marketplace.orders.show', $order)
            ->with('success', 'Pesanan berhasil dibatalkan.');
    }

    private function syncPendingOrders(MidtransService $midtrans, int $userId): void
    {
        $pendingOrders = Order::where('user_id', $userId)
            ->where('payment_status', 'unpaid')
            ->whereNotNull('midtrans_transaction_id')
            ->get();

        foreach ($pendingOrders as $order) {
            // Use midtrans_order_id if set (may have -HHMMSS suffix from re-pay),
            // otherwise fall back to the original order_number.
            $midtransOrderId = $order->midtrans_order_id ?: $order->order_number;
            $statusResponse = $midtrans->getTransactionStatus($midtransOrderId);
            if (! $statusResponse) {
                continue;
            }

            $transactionStatus = $statusResponse['transaction_status'] ?? '';
            $transactionId = $statusResponse['transaction_id'] ?? $order->midtrans_transaction_id;
            $paymentType = $statusResponse['payment_type'] ?? null;
            $bank = $statusResponse['bank'] ?? ($statusResponse['va_numbers'][0]['bank'] ?? null);
            $vaNumber = $statusResponse['va_numbers'][0]['va_number'] ?? ($statusResponse['bill_key'] ?? ($statusResponse['payment_code'] ?? null));

            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                    'midtrans_transaction_id' => $transactionId,
                ]);
            }

            $order->payments()->updateOrCreate(
                ['midtrans_transaction_id' => $transactionId],
                [
                    'payment_type' => $paymentType,
                    'bank' => $bank,
                    'va_number' => $vaNumber,
                    'gross_amount' => $statusResponse['gross_amount'] ?? $order->total,
                    'status' => $transactionStatus,
                    'raw_response' => $statusResponse,
                ]
            );
        }
    }
}
