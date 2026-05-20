<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->query('_tenant_clear')) {
            $request->session()->forget('tenant_id');

            if (app()->bound('current.tenant')) {
                app()->forgetInstance('current.tenant');
            }
        }

        if ($tenant = $this->resolveTenant($request)) {
            app()->instance('current.tenant', $tenant);
            config()->set('permission.cache.key', 'spatie.permission.cache.'.$tenant->id);
        } else {
            config()->set('permission.cache.key', 'spatie.permission.cache');
        }

        return $next($request);
    }

    protected function resolveTenant(Request $request): ?Tenant
    {
        if ($sessionTenantId = $request->session()->get('tenant_id')) {
            return Tenant::find($sessionTenantId);
        }

        $host = $request->getHost();
        $parts = explode('.', $host);

        // Subdomain detection — only claim the tenant if it actually exists,
        // otherwise fall through to query param / cookie / header check.
        if (count($parts) > 2 && ! filter_var($host, FILTER_VALIDATE_IP)) {
            $slug = $parts[0];

            if ($tenant = Tenant::where('slug', $slug)->first()) {
                return $tenant;
            }
        }

        if ($slug = $request->query('tenant') ?: $request->cookie('tenant') ?: $request->header('X-Tenant')) {
            return Tenant::where('slug', $slug)->first();
        }

        return null;
    }
}
