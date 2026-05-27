<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AuditLogController;
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
        Route::get('admin/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('admin/tenants', [TenantController::class, 'index'])->name('tenants');
        Route::post('admin/tenants/bulk-action', [TenantController::class, 'bulkAction'])->name('tenants.bulk-action');
        Route::get('admin/tenants/{tenant}/edit', [TenantController::class, 'edit'])->name('tenants.edit');
        Route::patch('admin/tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
        Route::post('admin/tenants/{tenant}/toggle-status', [TenantController::class, 'toggleStatus'])->name('tenants.toggle-status');
        Route::post('admin/tenants/{tenant}/reset', [TenantController::class, 'reset'])->name('tenants.reset');
        Route::get('admin/enter-store/{slug}', [TenantController::class, 'enter'])->name('enter-store');
        Route::get('admin/leave-store', [TenantController::class, 'leave'])->name('leave-store');
        Route::get('admin/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs');
    });
});

// Fallback untuk serving uploaded files ketika symlink public/storage tidak ada
// (hosting sering disable exec()/symlink() sehingga php artisan storage:link gagal)
Route::get('storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/'.$path);

    if (! file_exists($fullPath)) {
        abort(404);
    }

    return response()->file($fullPath);
})->where('path', '[a-zA-Z0-9_/.-]+');
