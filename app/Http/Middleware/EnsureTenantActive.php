<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');

            if ($tenant->subscription_status !== 'active') {
                session()->flash('suspended_tenant', $tenant->name);

                return redirect()->route('suspended');
            }
        }

        return $next($request);
    }
}
