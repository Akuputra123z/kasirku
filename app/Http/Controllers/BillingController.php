<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Services\BillingService;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BillingController extends Controller
{
    public function __construct(
        private BillingService $billing,
        private MidtransService $midtrans,
    ) {}

    public function index()
    {
        $tenant = tenant();

        $now = now();

        $pendingSubscription = $tenant?->subscriptions()
            ->where('status', 'pending')
            ->latest()
            ->first();

        if ($pendingSubscription?->midtrans_order_id && $pendingSubscription->payment_method) {
            $statusResponse = $this->midtrans->getTransactionStatus($pendingSubscription->midtrans_order_id);

            if ($statusResponse) {
                $transactionStatus = $statusResponse['transaction_status'] ?? '';

                if ($transactionStatus === 'settlement' || ($transactionStatus === 'capture' && ($statusResponse['fraud_status'] ?? '') === 'accept')) {
                    $this->billing->handlePaymentSuccess(
                        $pendingSubscription->midtrans_order_id,
                        $statusResponse['transaction_id'] ?? null,
                        $statusResponse,
                    );

                    return redirect()->route('billing.success');
                }
            }
        }

        $isPremium = $tenant && $tenant->subscription_tier === 'premium'
            && $tenant->subscription_expires_at
            && $tenant->subscription_expires_at->isFuture();

        $expiresAt = $tenant?->subscription_expires_at;

        $daysLeft = $expiresAt ? $now->diffInDays($expiresAt, false) : 0;

        $subscriptions = $tenant?->subscriptions()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'package' => $s->package,
                'amount' => $s->amount,
                'status' => $s->status,
                'payment_method' => $s->payment_method,
                'payment_payload' => $s->payment_payload,
                'midtrans_transaction_id' => $s->midtrans_transaction_id,
                'started_at' => $s->started_at?->format('d M Y'),
                'expires_at' => $s->expires_at?->format('d M Y'),
                'created_at' => $s->created_at->format('d M Y'),
                'paid_at' => $s->status === 'paid' ? $s->updated_at->format('d M Y H:i') : null,
            ]);

        $pendingSubscription = $pendingSubscription ?: $tenant?->subscriptions()
            ->where('status', 'pending')
            ->latest()
            ->first();

        $currentPackage = $tenant?->subscriptions()
            ->where('status', 'paid')
            ->whereNotNull('started_at')
            ->latest('started_at')
            ->value('package');

        $trialDays = config('subscription.trial_days');

        $isTrial = $isPremium && $subscriptions->filter(fn ($s) => $s['status'] === 'paid' || $s['status'] === 'pending')->isEmpty();

        return Inertia::render('settings/billing', [
            'isPremium' => $isPremium,
            'isTrial' => $isTrial,
            'currentPackage' => $currentPackage,
            'expiresAt' => $expiresAt?->format('d M Y'),
            'daysLeft' => (int) $daysLeft,
            'subscriptions' => $subscriptions ?? [],
            'pendingSubscription' => $pendingSubscription ? [
                'id' => $pendingSubscription->id,
                'package' => $pendingSubscription->package,
                'amount' => $pendingSubscription->amount,
                'payment_method' => $pendingSubscription->payment_method,
                'payment_payload' => $pendingSubscription->payment_payload,
            ] : null,
            'pricing' => [
                'monthly' => config('subscription.pricing.monthly'),
                'yearly' => config('subscription.pricing.yearly'),
            ],
            'clientKey' => config('midtrans.client_key'),
        ]);
    }

    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'package' => 'required|in:monthly,yearly',
        ]);

        $tenant = tenant();

        if (! $tenant) {
            return back()->with('error', 'Tenant tidak ditemukan');
        }

        $subscription = $this->billing->initiatePayment($tenant, $validated['package']);

        if (! $subscription) {
            return back()->with('error', 'Gagal membuat pembayaran. Coba lagi.');
        }

        return response()->json([
            'id' => $subscription->id,
            'package' => $subscription->package,
            'amount' => $subscription->amount,
        ]);
    }

    public function charge(Request $request, Subscription $subscription)
    {
        $tenant = tenant();

        if (! $tenant || $subscription->tenant_id !== $tenant->id) {
            abort(403);
        }

        if ($subscription->status !== 'pending') {
            return back()->with('error', 'Pembayaran sudah diproses.');
        }

        $validated = $request->validate([
            'payment_method' => 'required|in:qris,bca_va,bni_va,bri_va,mandiri_va',
        ]);

        $result = $this->billing->chargePendingPayment($subscription, $validated['payment_method']);

        if (! $result) {
            return back()->with('error', 'Gagal memproses pembayaran. Coba lagi.');
        }

        return response()->json($result);
    }

    public function cancel(Subscription $subscription)
    {
        $tenant = tenant();

        if (! $tenant || $subscription->tenant_id !== $tenant->id) {
            abort(403);
        }

        if ($subscription->status !== 'pending') {
            return back()->with('error', 'Tidak bisa dibatalkan.');
        }

        try {
            app(MidtransService::class)->cancelTransaction($subscription->midtrans_order_id);
        } catch (\Throwable $e) {
            logger()->warning('Midtrans cancel threw exception', [
                'order_id' => $subscription->midtrans_order_id,
                'error' => $e->getMessage(),
            ]);
        }

        $subscription->update(['status' => 'cancelled']);

        return response()->json(['ok' => true]);
    }

    public function success()
    {
        $tenant = tenant();

        $subscription = $tenant?->subscriptions()
            ->where('status', 'paid')
            ->latest()
            ->first();

        $invoice = $subscription ? [
            'number' => 'INV-'.strtoupper($subscription->package).'-'.str_pad((string) $subscription->id, 6, '0', STR_PAD_LEFT),
            'package' => $subscription->package,
            'amount' => (int) $subscription->amount,
            'payment_method' => $subscription->payment_method,
            'started_at' => $subscription->started_at?->format('d M Y'),
            'expires_at' => $subscription->expires_at?->format('d M Y'),
            'paid_at' => $subscription->updated_at->format('d M Y H:i'),
            'transaction_id' => $subscription->midtrans_transaction_id,
            'payment_payload' => $subscription->payment_payload,
        ] : null;

        return Inertia::render('settings/billing-success', [
            'invoice' => $invoice,
            'storeName' => $tenant?->name,
            'storeAddress' => $tenant?->address,
            'storeCity' => $tenant?->city,
            'storeProvince' => $tenant?->province,
        ]);
    }
}
