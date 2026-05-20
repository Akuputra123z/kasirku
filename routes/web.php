<?php

use App\Http\Controllers\Admin\LoginController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\RegisterStoreController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::post('register/store', RegisterStoreController::class)->name('stores.register');

Route::name('admin.')->group(function () {
    Route::middleware(['guest', 'central.context'])->group(function () {
        Route::get('admin/login', [LoginController::class, 'create'])->name('login');
        Route::post('admin/login', [LoginController::class, 'store'])->middleware('throttle:login');
    });

    Route::middleware([
        'auth',
        'verified',
        'central.context',
        'permission:manage-tenants',
    ])->group(function () {
        Route::get('admin/tenants', [TenantController::class, 'index'])->name('tenants');
        Route::get('admin/enter-store/{slug}', [TenantController::class, 'enter'])->name('enter-store');
        Route::get('admin/leave-store', [TenantController::class, 'leave'])->name('leave-store');
    });
});
