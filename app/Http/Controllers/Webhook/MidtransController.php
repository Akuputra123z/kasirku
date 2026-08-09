<?php

namespace App\Http\Controllers\Webhook;

use App\Events\NewNotification;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessPpobOrderAfterPayment;
use App\Models\Order;
use App\Notifications\NewOrder;
use App\Services\BillingService;
use App\Services\MidtransService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MidtransController extends Controller
{
    public function notification(Request $request, MidtransService $midtrans, BillingService $billing)
    {
        $payload = $request->all();
        $orderId = $payload['order_id'] ?? null;

        if (! $orderId) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        if (! $midtrans->verifyWebhookSignature($payload) || ! $midtrans->verifyMerchant($payload)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        if (str_starts_with($orderId, 'SUB-')) {
            $statusResponse = $midtrans->getTransactionStatus($orderId);

            if (! $statusResponse) {
                return response()->json(['message' => 'Failed to get status'], 500);
            }

            $transactionStatus = $statusResponse['transaction_status'] ?? '';

            if ($transactionStatus === 'settlement' || ($transactionStatus === 'capture' && ($statusResponse['fraud_status'] ?? '') === 'accept')) {
                $billing->handlePaymentSuccess(
                    $orderId,
                    $statusResponse['transaction_id'] ?? null,
                    $statusResponse,
                );
            }

            return response()->json(['message' => 'OK']);
        }

        $order = $this->resolveOrder($orderId);

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $statusResponse = $midtrans->getTransactionStatus($orderId);

        if (! $statusResponse) {
            return response()->json(['message' => 'Failed to get status'], 500);
        }

        $transactionStatus = $statusResponse['transaction_status'] ?? '';
        $paymentType = $statusResponse['payment_type'] ?? '';
        $fraudStatus = $statusResponse['fraud_status'] ?? '';
        $transactionId = $statusResponse['transaction_id'] ?? null;

        $alreadyProcessed = false;

        try {
            DB::transaction(function () use (
                $order,
                $statusResponse,
                $transactionStatus,
                $paymentType,
                $fraudStatus,
                $transactionId,
                &$alreadyProcessed,
            ) {
                if ($transactionId && $order->payments()->where('midtrans_transaction_id', $transactionId)->exists()) {
                    // Notifikasi duplikat (Midtrans retry 10-50x): cukup sinkronkan status.
                    $alreadyProcessed = true;

                    return;
                }

                $order->payments()->create([
                    'midtrans_transaction_id' => $transactionId,
                    'payment_type' => $paymentType,
                    'bank' => $statusResponse['bank'] ?? null,
                    'va_number' => $statusResponse['va_numbers'][0]['va_number'] ?? null,
                    'gross_amount' => $statusResponse['gross_amount'] ?? $order->total,
                    'status' => $transactionStatus,
                    'raw_response' => $statusResponse,
                ]);

                $this->applyStatus($order, $transactionStatus, $fraudStatus, $paymentType);
            });
        } catch (QueryException $e) {
            // Unique index payments_midtrans_transaction_id_unique menangkap race
            // antar dua webhook bersamaan (MySQL REPEATABLE READ tidak menjamin
            // visibility antar-transaksi).
            if ($e->getCode() !== '23000') {
                throw $e;
            }

            $alreadyProcessed = true;
            $this->applyStatus($order, $transactionStatus, $fraudStatus, $paymentType);
        }

        return response()->json(['message' => $alreadyProcessed ? 'Already processed' : 'OK']);
    }

    protected function applyStatus(Order $order, string $transactionStatus, string $fraudStatus, string $paymentType): void
    {
        match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => $this->handleSuccess($order),
            $transactionStatus === 'settlement' => $this->handleSuccess($order),
            $transactionStatus === 'deny' || $transactionStatus === 'cancel' || $transactionStatus === 'expire' => $this->handleFailed($order),
            $transactionStatus === 'pending' => $order->update(['payment_status' => 'pending']),
            default => null,
        };

        if (in_array($transactionStatus, ['capture', 'settlement', 'deny', 'cancel', 'expire'])) {
            $order->update(['payment_method' => $paymentType]);
        }
    }

    /**
     * Webhook Midtrans untuk charge ulang memakai order_id ber-suffix
     * (mis. "{order_number}-Q-1030" untuk QRIS atau "-VA-" untuk VA),
     * sedangkan tabel orders hanya menyimpan order_number dasar.
     */
    protected function resolveOrder(string $orderId): ?Order
    {
        if ($order = Order::where('order_number', $orderId)->first()) {
            return $order;
        }

        foreach (['-Q-', '-VA-'] as $suffix) {
            if (str_contains($orderId, $suffix)) {
                $base = strstr($orderId, $suffix, true);

                if ($base && $order = Order::where('order_number', $base)->first()) {
                    return $order;
                }
            }
        }

        return null;
    }

    protected function handleSuccess(Order $order): void
    {
        if ($order->payment_status === 'paid' && $order->status === 'confirmed') {
            return;
        }

        $order->update([
            'payment_status' => 'paid',
            'status' => 'confirmed',
        ]);

        $customer = $order->user;
        if ($customer) {
            $customer->notify(new NewOrder($order, 'paid'));
            try {
                NewNotification::dispatch(
                    $customer->id,
                    [
                        'id' => (string) $customer->notifications()->latest()->first()?->id,
                        'type' => 'NewOrder',
                        'data' => [
                            'order_number' => $order->order_number,
                            'total' => $order->total,
                            'event' => 'paid',
                            'message' => "Pembayaran diterima: {$order->order_number}",
                        ],
                        'created_at' => 'Baru saja',
                    ],
                    $customer->unreadNotifications()->count(),
                );
            } catch (\Throwable $e) {
                // Broadcast gagal (Reverb tidak jalan), tidak perlu gagalkan request
            }
        }

        if ($order->isPpob()) {
            ProcessPpobOrderAfterPayment::dispatch($order);
        }
    }

    protected function handleFailed(Order $order): void
    {
        if ($order->payment_status === 'paid') {
            return;
        }

        // Kembalikan stok marketplace yang terkunci di checkout.
        $order->restoreStock();

        $order->update([
            'payment_status' => 'failed',
            'status' => 'cancelled',
        ]);

        $customer = $order->user;
        if ($customer) {
            $customer->notify(new NewOrder($order, 'cancelled'));
        }
    }
}
