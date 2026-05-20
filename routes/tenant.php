<?php

declare(strict_types=1);

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\StoreController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web'])->group(function () {
    Route::middleware(['auth', 'verified', 'tenant.from-user'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::post('categories/import', [CategoryController::class, 'import'])->name('categories.import');
        Route::get('categories/import/template', [CategoryController::class, 'downloadTemplate'])->name('categories.import.template');
        Route::resource('categories', CategoryController::class);
        Route::post('products/bulk-delete', [ProductController::class, 'bulkDestroy'])->middleware('permission:manage-products');
        Route::post('products/import', [ProductController::class, 'import'])->middleware('permission:manage-products')->name('products.import');
        Route::get('products/import/template', [ProductController::class, 'downloadTemplate'])->middleware('permission:manage-products')->name('products.import.template');
        Route::resource('products', ProductController::class)->middleware('permission:manage-products');

        Route::get('pos', [TransactionController::class, 'index'])->name('pos.index');
        Route::post('pos', [TransactionController::class, 'store'])->name('pos.store');
        Route::get('transactions/history', [TransactionController::class, 'history'])->name('transactions.history');
        Route::resource('payment-methods', PaymentMethodController::class)->middleware('permission:manage-payment-methods');
        Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::patch('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index')->middleware('permission:view-reports');
        Route::get('reports/pdf', [ReportController::class, 'exportPdf'])->name('reports.pdf')->middleware('permission:export-reports');
        Route::get('reports/excel', [ReportController::class, 'exportExcel'])->name('reports.excel')->middleware('permission:export-reports');

        Route::get('chat', [ChatController::class, 'index'])->name('chat.index');
        Route::post('chat/send', [ChatController::class, 'send'])->name('chat.send');
        Route::get('chat/stream', [ChatController::class, 'stream'])->name('chat.stream');

        Route::get('shifts', [ShiftController::class, 'index'])->name('shifts.index');
        Route::post('shifts/start', [ShiftController::class, 'start'])->name('shifts.start');
        Route::post('shifts/{shift}/close', [ShiftController::class, 'close'])->name('shifts.close');

        Route::get('vouchers', [VoucherController::class, 'index'])->name('vouchers.index')->middleware('permission:manage-vouchers');
        Route::post('vouchers', [VoucherController::class, 'store'])->name('vouchers.store')->middleware('permission:manage-vouchers');
        Route::patch('vouchers/{voucher}', [VoucherController::class, 'update'])->name('vouchers.update')->middleware('permission:manage-vouchers');
        Route::delete('vouchers/{voucher}', [VoucherController::class, 'destroy'])->name('vouchers.destroy')->middleware('permission:manage-vouchers');
        Route::post('vouchers/validate', [VoucherController::class, 'validateCode'])->name('vouchers.validate')->middleware('permission:manage-vouchers');

        Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:manage-users');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:manage-users');
        Route::patch('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:manage-users');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:manage-users');

        Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('permission:manage-users');
        Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('permission:manage-users');
        Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('permission:manage-users');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('permission:manage-users');

        Route::get('settings/store', [StoreController::class, 'edit'])->name('settings.store');
        Route::patch('settings/store', [StoreController::class, 'update'])->name('settings.store.update');
    });
});

Route::middleware(['web', 'auth', 'tenant.from-user'])->group(function () {
    Route::redirect('settings', '/settings/profile');
    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');
    Route::put('settings/password', [SecurityController::class, 'update'])->name('user-password.update');
    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
    Route::inertia('settings/themes', 'settings/themes')->name('themes.edit');
});
