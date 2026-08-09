<?php

namespace App\Actions\Subscription;

use App\Events\SubscriptionExpiring;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

class SendRenewalReminders
{
    public function __invoke(): void
    {
        foreach ([7, 3, 1] as $days) {
            Tenant::where('subscription_tier', 'premium')
                ->where('subscription_status', 'active')
                ->whereDate('subscription_expires_at', now()->addDays($days)->toDateString())
                ->get()
                ->each(function (Tenant $tenant) use ($days) {
                    // Kirim pengingat hanya sekali per hari per tenant.
                    $cacheKey = "tenant.{$tenant->id}.renewal_reminded.{$days}.".now()->toDateString();

                    if (Cache::add($cacheKey, true, now()->endOfDay())) {
                        SubscriptionExpiring::dispatch($tenant);
                    }
                });
        }
    }
}
