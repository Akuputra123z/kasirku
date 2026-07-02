<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use App\Models\MarketplaceCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $currentTenant = rescue(
            fn () => tenant() ?? ($request->user() ? $request->user()->activeTenantUser?->tenant : null),
            null,
            report: fn ($e) => Log::warning('Failed to resolve tenant: '.$e->getMessage()),
        );

        $sessionAvailable = $request->hasSession();

        return [
            'errors' => fn () => $this->resolveValidationErrors($request),
            'flash' => $sessionAvailable
                ? fn () => [
                    'success' => $request->session()->get('success'),
                    'message' => $request->session()->get('message'),
                    'error' => $request->session()->get('error'),
                    'import' => $request->session()->get('import'),
                    'transaction' => $request->session()->get('transaction'),
                    'suspended_tenant' => $request->session()->get('suspended_tenant'),
                ]
                : fn () => [],
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'permissions' => rescue(fn () => $request->user()?->getAllPermissions()->pluck('name') ?? [], [], report: fn ($e) => Log::warning('Failed to resolve permissions: '.$e->getMessage())),
                'roles' => rescue(fn () => $request->user()?->getRoleNames() ?? [], [], report: fn ($e) => Log::warning('Failed to resolve roles: '.$e->getMessage())),
            ],
            'cartCount' => rescue(
                fn () => $request->user()?->customer
                    ? Cart::where('user_id', $request->user()->id)->sum('quantity')
                    : 0,
                0,
                report: fn ($e) => Log::warning('Failed to resolve cart count: '.$e->getMessage()),
            ),
            'notifications' => $request->user()
                ? fn () => rescue(fn () => [
                    'unreadCount' => $request->user()->unreadNotifications()->count(),
                    'latest' => $request->user()->unreadNotifications()
                        ->orderBy('created_at', 'desc')
                        ->take(5)
                        ->get()
                        ->map(fn ($n) => [
                            'id' => $n->id,
                            'type' => class_basename($n->type),
                            'data' => $n->data,
                            'created_at' => $n->created_at->diffForHumans(),
                        ]),
                ], ['unreadCount' => 0, 'latest' => []], report: fn ($e) => Log::warning('Failed to resolve notifications: '.$e->getMessage()))
                : ['unreadCount' => 0, 'latest' => []],
            'tenant' => $currentTenant ? [
                'id' => $currentTenant->id,
                'name' => $currentTenant->name,
                'slug' => $currentTenant->slug,
                'address' => $currentTenant->address ?? '',
                'phone' => $currentTenant->phone ?? '',
                'logo' => $currentTenant->logo ?? null,
                'logo_url' => $currentTenant->logo ? Storage::disk('public')->url($currentTenant->logo) : null,
                'color_theme' => $currentTenant->color_theme ?? 'default',
                'subscription_tier' => $currentTenant->subscription_tier ?? 'free',
                'subscription_expires_at' => $currentTenant->subscription_expires_at?->format('d M Y'),
                'points_per_currency' => (int) ($currentTenant->settings['points_per_currency'] ?? 10000),
                'point_value' => (int) ($currentTenant->settings['point_value'] ?? 100),
                'min_redeem_points' => (int) ($currentTenant->settings['min_redeem_points'] ?? 100),
            ] : null,
            'marketplaceCategories' => fn () => rescue(
                fn () => MarketplaceCategory::with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
                    ->whereNull('parent_id')
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get(['id', 'name', 'slug', 'icon']),
                [],
                report: fn ($e) => Log::warning('Failed to resolve marketplace categories: '.$e->getMessage()),
            ),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'centralAdmin' => $sessionAvailable && $request->session()->get('central_admin_id') !== null,
        ];
    }
}
