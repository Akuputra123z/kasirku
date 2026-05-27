<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Illuminate\Http\Request;
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
        $currentTenant = tenant() ?? ($request->user()?->tenant_id ? Tenant::find($request->user()->tenant_id) : null);

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
                'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name') : [],
                'roles' => $request->user() ? $request->user()->getRoleNames() : [],
            ],
            'tenant' => $currentTenant ? [
                'id' => $currentTenant->id,
                'name' => $currentTenant->name,
                'slug' => $currentTenant->slug,
                'address' => $currentTenant->address ?? '',
                'phone' => $currentTenant->phone ?? '',
                'logo' => $currentTenant->logo ?? null,
                'logo_url' => $currentTenant->logo ? Storage::disk('public')->url($currentTenant->logo) : null,
                'color_theme' => $currentTenant->color_theme ?? 'default',
                'points_per_currency' => (int) ($currentTenant->settings['points_per_currency'] ?? 10000),
                'point_value' => (int) ($currentTenant->settings['point_value'] ?? 100),
                'min_redeem_points' => (int) ($currentTenant->settings['min_redeem_points'] ?? 100),
            ] : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'centralAdmin' => $sessionAvailable && $request->session()->get('central_admin_id') !== null,
        ];
    }
}
