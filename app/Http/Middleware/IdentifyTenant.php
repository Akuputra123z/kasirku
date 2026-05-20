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

        // Skip subdomain detection for IP addresses (e.g. 127.0.0.1, ::1)
        if (count($parts) > 2 && ! filter_var($host, FILTER_VALIDATE_IP)) {
            $slug = $parts[0];

            return Tenant::where('slug', $slug)->first();
        }

        if ($slug = $request->query('tenant') ?: $request->cookie('tenant') ?: $request->header('X-Tenant')) {
            return Tenant::where('slug', $slug)->first();
        }

        return null;
    }
}
