<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::define('view-dashboard', fn ($user) => $user->can('view-dashboard'));
        Gate::define('manage-products', fn ($user) => $user->can('manage-products'));
        Gate::define('manage-categories', fn ($user) => $user->can('manage-categories'));
        Gate::define('manage-payment-methods', fn ($user) => $user->can('manage-payment-methods'));
        Gate::define('manage-pos', fn ($user) => $user->can('manage-pos'));
        Gate::define('view-history', fn ($user) => $user->can('view-history'));
        Gate::define('manage-shifts', fn ($user) => $user->can('manage-shifts'));
        Gate::define('view-reports', fn ($user) => $user->can('view-reports'));
        Gate::define('export-reports', fn ($user) => $user->can('export-reports'));
        Gate::define('manage-settings', fn ($user) => $user->can('manage-settings'));
        Gate::define('manage-users', fn ($user) => $user->can('manage-users'));
        Gate::define('manage-vouchers', fn ($user) => $user->can('manage-vouchers'));
        Gate::define('manage-purchases', fn ($user) => $user->can('manage-purchases'));
        Gate::define('manage-suppliers', fn ($user) => $user->can('manage-suppliers'));
        Gate::define('manage-stock', fn ($user) => $user->can('manage-stock'));
        Gate::define('manage-brands', fn ($user) => $user->can('manage-brands'));
    }
}
