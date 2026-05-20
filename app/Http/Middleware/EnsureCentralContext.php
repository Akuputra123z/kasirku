<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureCentralContext
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->session()->has('central_admin_id')) {
            $request->session()->forget('tenant_id');
            $request->session()->forget('central_admin_id');
        }

        if (app()->bound('current.tenant')) {
            app()->forgetInstance('current.tenant');
        }

        config()->set('permission.cache.key', 'spatie.permission.cache');

        return $next($request);
    }
}
