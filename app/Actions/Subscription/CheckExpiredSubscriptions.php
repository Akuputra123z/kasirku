<?php

namespace App\Actions\Subscription;

use App\Events\SubscriptionExpired;
use App\Models\Tenant;
use App\Services\SubscriptionService;
use Illuminate\Support\Facades\Cache;

class CheckExpiredSubscriptions
{
    public function __invoke(): void
    {
        // Saat fitur langganan dimatikan secara global, jangan suspend tenant
        // yang "kadaluarsa" — semua tenant tampak premium tanpa batasan.
        if (! app(SubscriptionService::class)->isEnabled()) {
            return;
        }

        $expired = Tenant::where('subscription_tier', 'premium')
            ->where('subscription_expires_at', '<', now())
            ->get();

        if ($expired->isEmpty()) {
            return;
        }

        $graceDays = (int) config('subscription.grace_days', 7);
        $cutoff = now()->subDays($graceDays);

        foreach ($expired as $tenant) {
            Cache::forget("tenant.{$tenant->id}.is_premium");

            // Melewati masa tenggang → akses benar-benar dicabut.
            if ($tenant->subscription_expires_at->lt($cutoff)) {
                $tenant->update([
                    'subscription_tier' => 'free',
                    'subscription_expires_at' => null,
                    'subscription_status' => 'suspended',
                ]);

                continue;
            }

            // Dalam masa tenggang: akses dipertahankan (status 'active'), namun
            // notifikasi kadaluarsa hanya dikirim SEKALI per hari — bukan setiap
            // run scheduler (mencegah spam notifikasi berulang).
            $tenant->update(['subscription_status' => 'active']);

            $cacheKey = "tenant.{$tenant->id}.expiry_notified.".now()->toDateString();

            if (Cache::add($cacheKey, true, now()->endOfDay())) {
                SubscriptionExpired::dispatch($tenant);
            }
        }
    }
}
