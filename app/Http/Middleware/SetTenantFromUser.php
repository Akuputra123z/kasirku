<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantUser;
use Closure;
use Illuminate\Http\Request;

class SetTenantFromUser
{
    public function handle(Request $request, Closure $next)
    {
        if (! app()->bound('current.tenant') && $request->user()) {
            $tenantUser = TenantUser::where('user_id', $request->user()->id)
                ->where('is_active', true)
                ->first();

            if ($tenantUser) {
                $tenant = Tenant::find($tenantUser->tenant_id);
                if ($tenant) {
                    app()->instance('current.tenant', $tenant);
                    config()->set('permission.cache.key', 'spatie.permission.cache.'.$tenant->id);
                }
            }
        }

        return $next($request);
    }
}
