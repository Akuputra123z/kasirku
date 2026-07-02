<?php

namespace App\Actions\Subscription;

use App\Events\SubscriptionExpired;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

class CheckExpiredSubscriptions
{
    public function __invoke(): void
    {
        $expiredIds = Tenant::where('subscription_tier', 'premium')
            ->where('subscription_expires_at', '<', now())
            ->pluck('id');

        if ($expiredIds->isEmpty()) {
            return;
        }

        $graceDays = config('subscription.grace_days');

        $cutoff = now()->subDays($graceDays);

        $toDowngrade = Tenant::whereIn('id', $expiredIds)
            ->where('subscription_expires_at', '<', $cutoff)
            ->update([
                'subscription_tier' => 'free',
                'subscription_expires_at' => null,
            ]);

        Tenant::whereIn('id', $expiredIds)
            ->where('subscription_expires_at', '>=', $cutoff)
            ->get()
            ->each(fn ($t) => SubscriptionExpired::dispatch($t));

        foreach ($expiredIds as $id) {
            Cache::forget("tenant.{$id}.is_premium");
        }
    }
}
