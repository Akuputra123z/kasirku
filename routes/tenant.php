<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\EmailVerificationOtpController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\Pos\BarcodeLabelController;
use App\Http\Controllers\Pos\BarcodeScanController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\StoreController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\SocialiteController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\Tenant\ChatController as TenantChatController;
use App\Http\Controllers\Tenant\MarketplaceCategoryController as TenantMarketplaceCategoryController;
use App\Http\Controllers\Tenant\NotificationController as TenantNotificationController;
use App\Http\Controllers\Tenant\OrderController;
use App\Http\Controllers\Tenant\ReviewController as TenantReviewController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['web', 'tenant.from-user'])->group(function () {
    // Google OAuth (outside auth middleware)
    Route::get('auth/google/redirect', [SocialiteController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('auth/google/register-redirect', [SocialiteController::class, 'registerRedirect'])->name('auth.google.register-redirect');
    Route::get('auth/google/callback', [SocialiteController::class, 'callback'])->name('auth.google.callback');
    Route::middleware(['auth'])->group(function () {
        Route::post('email/verify-otp', [EmailVerificationOtpController::class, 'verify'])->name('verification.verify-otp');
        Route::get('suspended', function () {
            return Inertia::render('suspended', [
                'tenantName' => session('suspended_tenant', 'Your store'),
            ]);
        })->name('suspended');
    });

    Route::middleware(['auth', 'verified', 'tenant.from-user', 'tenant.active'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::post('categories/import', [CategoryController::class, 'import'])->name('categories.import');
        Route::get('categories/import/template', [CategoryController::class, 'downloadTemplate'])->name('categories.import.template');
        Route::resource('categories', CategoryController::class);
        Route::post('brands/import', [BrandController::class, 'import'])->name('brands.import');
        Route::get('brands/import/template', [BrandController::class, 'downloadTemplate'])->name('brands.import.template');
        Route::resource('brands', BrandController::class);
        Route::post('products/bulk-delete', [ProductController::class, 'bulkDestroy'])->middleware('permission:manage-products')->name('products.bulkDestroy');
        Route::post('products/import', [ProductController::class, 'import'])->middleware('permission:manage-products')->name('products.import');
        Route::get('products/import/template', [ProductController::class, 'downloadTemplate'])->middleware('permission:manage-products')->name('products.import.template');
        Route::get('products/{product}/barcode-label', [BarcodeLabelController::class, '__invoke'])->middleware('permission:manage-products')->name('products.barcode-label');
        Route::get('products/barcode-labels', [BarcodeLabelController::class, 'bulk'])->middleware('permission:manage-products')->name('products.barcode-labels');
        Route::resource('products', ProductController::class)->middleware('permission:manage-products');

        Route::middleware('permission:manage-pos')->group(function () {
            Route::get('pos', [TransactionController::class, 'index'])->name('pos.index');
            Route::post('pos', [TransactionController::class, 'store'])->name('pos.store');
            Route::get('pos/scan/{barcode}', [BarcodeScanController::class, '__invoke'])->name('pos.scan');
        });
        Route::get('transactions/history', [TransactionController::class, 'history'])->name('transactions.history')->middleware('permission:view-history');
        Route::resource('payment-methods', PaymentMethodController::class)->middleware('permission:manage-payment-methods');
        Route::middleware('permission:manage-customers')->group(function () {
            Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
            Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::patch('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
            Route::post('customers/point-config', [CustomerController::class, 'updatePointConfig'])->name('customers.point-config');
        });
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index')->middleware('permission:view-reports');
        Route::get('reports/pdf', [ReportController::class, 'exportPdf'])->name('reports.pdf')->middleware('permission:export-reports');
        Route::get('reports/excel', [ReportController::class, 'exportExcel'])->name('reports.excel')->middleware('permission:export-reports');

        Route::get('shifts', [ShiftController::class, 'index'])->name('shifts.index');
        Route::post('shifts/start', [ShiftController::class, 'start'])->name('shifts.start');
        Route::post('shifts/{shift}/close', [ShiftController::class, 'close'])->name('shifts.close');

        Route::get('vouchers', [VoucherController::class, 'index'])->name('vouchers.index')->middleware('permission:manage-vouchers');
        Route::post('vouchers', [VoucherController::class, 'store'])->name('vouchers.store')->middleware('permission:manage-vouchers');
        Route::patch('vouchers/{voucher}', [VoucherController::class, 'update'])->name('vouchers.update')->middleware('permission:manage-vouchers');
        Route::delete('vouchers/{voucher}', [VoucherController::class, 'destroy'])->name('vouchers.destroy')->middleware('permission:manage-vouchers');
        Route::post('vouchers/validate', [VoucherController::class, 'validateCode'])->name('vouchers.validate')->middleware('permission:manage-vouchers');

        Route::resource('suppliers', SupplierController::class)->middleware('permission:manage-suppliers');
        Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index')->middleware('permission:manage-purchases');
        Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store')->middleware('permission:manage-purchases');
        Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->name('purchase-orders.receive')->middleware('permission:manage-purchases');
        Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->name('purchase-orders.destroy')->middleware('permission:manage-purchases');
        Route::get('stock-movements', [StockMovementController::class, 'index'])->name('stock-movements.index')->middleware('permission:manage-stock');
        Route::post('stock-movements', [StockMovementController::class, 'store'])->name('stock-movements.store')->middleware('permission:manage-stock');

        Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:manage-users');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:manage-users');
        Route::patch('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:manage-users');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:manage-users');

        Route::post('print/receipt/{transaction}', [PrintController::class, 'receipt'])->name('print.receipt');
        Route::post('print/receipt/{transaction}/raw', [PrintController::class, 'raw'])->name('print.raw');
        Route::post('print/test', [PrintController::class, 'test'])->name('print.test');

        Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('permission:manage-users');
        Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('permission:manage-users');
        Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('permission:manage-users');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('permission:manage-users');

        Route::get('settings/store', [StoreController::class, 'edit'])->name('settings.store');
        Route::patch('settings/store', [StoreController::class, 'update'])->name('settings.store.update');

        // ─── Online Orders ───────────────────────────────────────────────
        Route::get('online-orders', [OrderController::class, 'index'])->name('online-orders.index');
        Route::get('online-orders/{order}', fn () => redirect()->route('online-orders.index'))->name('online-orders.show');
        Route::patch('online-orders/{order}', [OrderController::class, 'update'])->name('online-orders.update');

        // ─── Marketplace Categories (read-only) ──────────────────────────
        Route::get('marketplace-categories', [TenantMarketplaceCategoryController::class, 'index'])->name('marketplace-categories');

        // ─── Reviews ─────────────────────────────────────────────────────
        Route::get('reviews', [TenantReviewController::class, 'index'])->name('tenant.reviews.index');

        // ─── Notifications ───────────────────────────────────────────────
        Route::get('notifications/unread', [TenantNotificationController::class, 'unread'])->name('tenant.notifications.unread');
        Route::post('notifications/{notification}/read', [TenantNotificationController::class, 'read'])->name('tenant.notifications.read');
        Route::post('notifications/read-all', [TenantNotificationController::class, 'readAll'])->name('tenant.notifications.read-all');

        // ─── Store Chat ──────────────────────────────────────────────────
        Route::get('conversations', [TenantChatController::class, 'index'])->name('tenant.chat.index');
        Route::get('conversations/{conversation}', [TenantChatController::class, 'show'])->name('tenant.chat.show');
        Route::post('conversations/{conversation}/messages', [TenantChatController::class, 'sendMessage'])->name('tenant.chat.send');
        Route::get('conversations/{conversation}/poll', [TenantChatController::class, 'poll'])->name('tenant.chat.poll');

        // ─── Billing ─────────────────────────────────────────────────────
        Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
        Route::post('billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
        Route::post('billing/{subscription}/charge', [BillingController::class, 'charge'])->name('billing.charge');
        Route::post('billing/{subscription}/cancel', [BillingController::class, 'cancel'])->name('billing.cancel');
        Route::get('billing/success', [BillingController::class, 'success'])->name('billing.success');
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
