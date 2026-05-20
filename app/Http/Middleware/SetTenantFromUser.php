<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;

class SetTenantFromUser
{
    public function handle(Request $request, Closure $next)
    {
        if (! app()->bound('current.tenant') && $request->user()?->tenant_id) {
            $tenant = Tenant::find($request->user()->tenant_id);

            if ($tenant) {
                app()->instance('current.tenant', $tenant);
                config()->set('permission.cache.key', 'spatie.permission.cache.'.$tenant->id);
            }
        }

        return $next($request);
    }
}
