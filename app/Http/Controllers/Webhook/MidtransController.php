<?php

namespace App\Http\Controllers\Webhook;

use App\Events\NewNotification;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessPpobOrderAfterPayment;
use App\Models\Order;
use App\Notifications\NewOrder;
use App\Services\BillingService;
use App\Services\MidtransService;
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

        $order = Order::where('order_number', $orderId)->first();

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

        DB::transaction(function () use ($order, $statusResponse, $transactionStatus, $paymentType, $fraudStatus) {
            $order->payments()->create([
                'midtrans_transaction_id' => $statusResponse['transaction_id'] ?? null,
                'payment_type' => $paymentType,
                'bank' => $statusResponse['bank'] ?? null,
                'va_number' => $statusResponse['va_numbers'][0]['va_number'] ?? null,
                'gross_amount' => $statusResponse['gross_amount'] ?? $order->total,
                'status' => $transactionStatus,
                'raw_response' => $statusResponse,
            ]);

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
        });

        return response()->json(['message' => 'OK']);
    }

    protected function handleSuccess(Order $order): void
    {
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
