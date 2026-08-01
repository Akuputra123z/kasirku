<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

class SubscriptionService
{
    /**
     * Fitur langganan aktif/nonaktif global.
     * Override runtime dari AppSetting, fallback ke config (.env).
     */
    public function isEnabled(): bool
    {
        return filter_var(
            AppSetting::get('subscription_enabled', config('subscription.enabled')),
            FILTER_VALIDATE_BOOL
        );
    }

    public function isPremium(Tenant $tenant): bool
    {
        if (! $this->isEnabled()) {
            return true;
        }

        return Cache::remember(
            "tenant.{$tenant->id}.is_premium",
            3600,
            fn () => $tenant->subscription_tier === 'premium'
                && $tenant->subscription_expires_at
                && $tenant->subscription_expires_at->isFuture(),
        );
    }

    public function maxProducts(Tenant $tenant): int
    {
        return $this->isPremium($tenant) ? PHP_INT_MAX : config('subscription.limits.products');
    }

    public function maxStaff(Tenant $tenant): int
    {
        return $this->isPremium($tenant) ? PHP_INT_MAX : config('subscription.limits.staff');
    }

    public function canExport(Tenant $tenant): bool
    {
        return $this->isPremium($tenant);
    }

    public function canMarketplace(Tenant $tenant): bool
    {
        return $this->isPremium($tenant);
    }

    public function clearCache(Tenant $tenant): void
    {
        Cache::forget("tenant.{$tenant->id}.is_premium");
    }
}
