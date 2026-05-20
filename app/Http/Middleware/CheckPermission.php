<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;

class CheckPermission
{
    public function handle(Request $request, Closure $next, ...$permissions)
    {
        if (auth()->guest()) {
            throw UnauthorizedException::notLoggedIn();
        }

        $user = auth()->user();

        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                return $next($request);
            }
        }

        throw UnauthorizedException::forPermissions($permissions);
    }
}
