<?php

namespace App\Services;

use App\Events\SubscriptionPaid;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class BillingService
{
    public function __construct(
        private MidtransService $midtrans,
        private SubscriptionService $subscription,
    ) {}

    public function initiatePayment(Tenant $tenant, string $package): Subscription
    {
        $price = config("subscription.pricing.{$package}");

        if (! $price) {
            throw new \InvalidArgumentException("Invalid package: {$package}");
        }

        $this->cancelPendingTransactions($tenant, $package);

        $orderId = 'SUB-'.strtoupper(bin2hex(random_bytes(8)));

        return $tenant->subscriptions()->create([
            'package' => $package,
            'amount' => $price,
            'midtrans_order_id' => $orderId,
            'status' => 'pending',
        ]);
    }

    public function chargePendingPayment(Subscription $subscription, string $paymentMethod): ?array
    {
        $email = $subscription->tenant->users()->value('email') ?? $subscription->tenant->name.'@tenant.local';

        $bank = match ($paymentMethod) {
            'bca_va' => 'bca',
            'bni_va' => 'bni',
            'bri_va' => 'bri',
            'mandiri_va' => 'mandiri',
            default => $paymentMethod,
        };

        $response = match ($paymentMethod) {
            'qris' => $this->midtrans->chargeSubscriptionQris(
                orderId: $subscription->midtrans_order_id,
                amount: (int) $subscription->amount,
                customerName: $subscription->tenant->name,
                customerEmail: $email,
            ),
            default => $this->midtrans->chargeSubscriptionBankTransfer(
                orderId: $subscription->midtrans_order_id,
                amount: (int) $subscription->amount,
                customerName: $subscription->tenant->name,
                customerEmail: $email,
                bank: $bank,
            ),
        };

        if (! $response) {
            return null;
        }

        $payload = match ($paymentMethod) {
            'qris' => [
                'qr_url' => collect($response['actions'] ?? [])->firstWhere('name', 'generate-qr-code')['url'] ?? null,
                'transaction_id' => $response['transaction_id'] ?? null,
            ],
            default => [
                'va_number' => $response['va_numbers'][0]['va_number'] ?? null,
                'bank' => $response['va_numbers'][0]['bank'] ?? $bank,
                'transaction_id' => $response['transaction_id'] ?? null,
            ],
        };

        $subscription->update([
            'payment_method' => $paymentMethod,
            'payment_payload' => $payload,
            'midtrans_transaction_id' => $response['transaction_id'] ?? null,
        ]);

        return $payload;
    }

    public function handlePaymentSuccess(string $orderId, ?string $midtransTransactionId = null, ?array $statusResponse = null): void
    {
        $subscription = Subscription::where('midtrans_order_id', $orderId)->firstOrFail();

        $currentExpiry = $subscription->tenant->subscription_expires_at;
        $base = $currentExpiry?->isFuture() ? $currentExpiry->copy() : now();
        $expiresAt = match ($subscription->package) {
            'monthly' => $base->addMonth(),
            'yearly' => $base->addYear(),
        };

        DB::transaction(function () use ($subscription, $expiresAt, $midtransTransactionId, $statusResponse) {
            $update = [
                'status' => 'paid',
                'started_at' => now(),
                'expires_at' => $expiresAt,
            ];

            if ($midtransTransactionId) {
                $update['midtrans_transaction_id'] = $midtransTransactionId;
            }

            if ($statusResponse) {
                $update['payment_payload'] = $statusResponse;
            }

            $subscription->update($update);

            $subscription->tenant->update([
                'subscription_tier' => 'premium',
                'subscription_expires_at' => $expiresAt,
            ]);
        });

        $this->subscription->clearCache($subscription->tenant);

        SubscriptionPaid::dispatch($subscription);
    }

    private function cancelPendingTransactions(Tenant $tenant, ?string $package = null): void
    {
        $query = $tenant->subscriptions()->where('status', 'pending');

        if ($package) {
            $query->where('package', $package);
        }

        $query->each(function (Subscription $subscription) {
            if ($subscription->midtrans_order_id) {
                $this->midtrans->cancelTransaction($subscription->midtrans_order_id);
            }

            $subscription->update(['status' => 'cancelled']);
        });
    }

    public function applyTrial(Tenant $tenant): void
    {
        $trialDays = config('subscription.trial_days');

        if ($trialDays < 1) {
            return;
        }

        $expiresAt = now()->addDays($trialDays);

        $tenant->update([
            'subscription_tier' => 'premium',
            'subscription_expires_at' => $expiresAt,
        ]);

        $this->subscription->clearCache($tenant);
    }
}
