<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureMarketplaceContext
{
    public function handle(Request $request, Closure $next)
    {
        session()->forget('tenant_id');
        app()->forgetInstance('current.tenant');

        return $next($request);
    }
}
