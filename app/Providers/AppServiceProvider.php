<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureErrorPages();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Gate::before(function ($user, $ability) {
            return $user->hasRole('super-admin') ? true : null;
        });

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    protected function configureErrorPages(): void
    {
        Inertia::handleExceptionsUsing(function ($response) {
            if (in_array($response->statusCode(), [403, 404, 500, 503])) {
                try {
                    return $response->render('errors/index', [
                        'status' => $response->statusCode(),
                    ])->withSharedData();
                } catch (\Throwable $e) {
                    return $response->render('errors/index', [
                        'status' => $response->statusCode(),
                    ]);
                }
            }
        });
    }
}
