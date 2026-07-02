<?php

namespace App\Actions\Subscription;

use App\Events\SubscriptionExpired;
use App\Models\Tenant;

class SendRenewalReminders
{
    public function __invoke(): void
    {
        foreach ([7, 3, 1] as $days) {
            Tenant::where('subscription_tier', 'premium')
                ->whereDate('subscription_expires_at', now()->addDays($days)->toDateString())
                ->get()
                ->each(fn ($t) => SubscriptionExpired::dispatch($t));
        }
    }
}
