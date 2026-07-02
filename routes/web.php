<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\LoginController;
use App\Http\Controllers\Admin\MarketplaceCategoryController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Marketplace\AuthController;
use App\Http\Controllers\Marketplace\CartController;
use App\Http\Controllers\Marketplace\ChatController as CustomerChatController;
use App\Http\Controllers\Marketplace\CheckoutController;
use App\Http\Controllers\Marketplace\CustomerController as MarketplaceCustomerController;
use App\Http\Controllers\Marketplace\MarketplaceController;
use App\Http\Controllers\Marketplace\OrderController as MarketplaceOrderController;
use App\Http\Controllers\Marketplace\PpobController;
use App\Http\Controllers\Marketplace\RajaOngkirController;
use App\Http\Controllers\Marketplace\ReviewController as MarketplaceReviewController;
use App\Http\Controllers\RegisterStoreController;
use App\Http\Controllers\Webhook\MidtransController;
use Illuminate\Support\Facades\Route;

// ─── Marketplace Routes (tenant context cleared) ───────────────────────

Route::middleware('marketplace.context')->group(function () {

    Route::controller(MarketplaceController::class)->group(function () {
        Route::get('/', 'landing')->name('home');
        Route::get('/all-products', 'allProducts')->name('marketplace.products');
        Route::get('/stores', 'stores')->name('marketplace.stores');
        Route::get('/store/{slug}', 'store')->name('marketplace.store');
        Route::get('/store/{slug}/products/{productSlug}', 'product')->name('marketplace.product');
    });

    Route::middleware('guest')->group(function () {
        Route::get('/customer/register', [AuthController::class, 'showRegister'])->name('marketplace.register');
        Route::get('/customer/login', [AuthController::class, 'showLogin'])->name('marketplace.login');
        Route::post('/customer/register', [AuthController::class, 'register'])->name('marketplace.register.store');
        Route::post('/customer/login', [AuthController::class, 'login'])->name('marketplace.login.store');
        Route::get('/customer/forgot-password', [AuthController::class, 'showForgotPassword'])->name('marketplace.forgot-password');
        Route::post('/customer/forgot-password', [AuthController::class, 'sendResetLink'])->name('marketplace.forgot-password.store');
        Route::get('/customer/reset-password/{token}', [AuthController::class, 'showResetPassword'])->name('marketplace.reset-password');
        Route::post('/customer/reset-password', [AuthController::class, 'resetPassword'])->name('marketplace.reset-password.store');
    });

    Route::middleware('auth')->group(function () {
        Route::get('/customer/dashboard', [MarketplaceCustomerController::class, 'dashboard'])->name('marketplace.customer.dashboard');
        Route::get('/customer/buka-toko', [MarketplaceCustomerController::class, 'showCreateStore'])->name('customer.buka-toko');
        Route::post('/customer/buka-toko', [MarketplaceCustomerController::class, 'createStore'])->name('customer.buka-toko.store');
        Route::post('/customer/address', [MarketplaceCustomerController::class, 'storeAddress'])->name('marketplace.customer.address.store');
        Route::put('/customer/address/{address}', [MarketplaceCustomerController::class, 'updateAddress'])->name('marketplace.customer.address.update');
        Route::delete('/customer/address/{address}', [MarketplaceCustomerController::class, 'destroyAddress'])->name('marketplace.customer.address.destroy');

        Route::put('/customer/profile', [MarketplaceCustomerController::class, 'updateProfile'])->name('marketplace.customer.profile.update');
        Route::put('/customer/password', [MarketplaceCustomerController::class, 'updatePassword'])->name('marketplace.customer.password.update');
        Route::post('/customer/avatar', [MarketplaceCustomerController::class, 'uploadAvatar'])->name('marketplace.customer.avatar.upload');

        Route::post('/customer/bank-account', [MarketplaceCustomerController::class, 'storeBankAccount'])->name('marketplace.customer.bank-account.store');
        Route::put('/customer/bank-account/{bankAccount}', [MarketplaceCustomerController::class, 'updateBankAccount'])->name('marketplace.customer.bank-account.update');
        Route::delete('/customer/bank-account/{bankAccount}', [MarketplaceCustomerController::class, 'destroyBankAccount'])->name('marketplace.customer.bank-account.destroy');

        Route::get('/cart', [CartController::class, 'index'])->name('marketplace.cart');
        Route::post('/cart/add', [CartController::class, 'add'])->name('marketplace.cart.add');
        Route::post('/cart/{cart}/update', [CartController::class, 'update'])->name('marketplace.cart.update');
        Route::delete('/cart/{cart}', [CartController::class, 'remove'])->name('marketplace.cart.remove');

        Route::get('/checkout', [CheckoutController::class, 'index'])->name('marketplace.checkout');
        Route::post('/checkout/process', [CheckoutController::class, 'process'])->name('marketplace.checkout.process');

        Route::get('/customer/orders', [MarketplaceCustomerController::class, 'dashboard'])->defaults('initialSection', 'transaksi')->name('marketplace.orders');
        Route::get('/customer/settings', [MarketplaceCustomerController::class, 'dashboard'])->defaults('initialSection', 'pengaturan')->name('marketplace.customer.settings');
        Route::get('/customer/orders/{order}/payment', [MarketplaceOrderController::class, 'payment'])->name('marketplace.orders.payment');
        Route::post('/customer/orders/{order}/pay', [MarketplaceOrderController::class, 'pay'])->name('marketplace.orders.pay');
        Route::post('/customer/orders/{order}/cancel', [MarketplaceOrderController::class, 'cancel'])->name('marketplace.orders.cancel');
        Route::get('/customer/orders/{order}', [MarketplaceOrderController::class, 'show'])->name('marketplace.orders.show');
        Route::get('/customer/orders/{order}/review', [MarketplaceReviewController::class, 'create'])->name('marketplace.reviews.create');
        Route::post('/customer/orders/{order}/review', [MarketplaceReviewController::class, 'store'])->name('marketplace.reviews.store');

        Route::post('/customer/complaints', [MarketplaceCustomerController::class, 'storeComplaint'])->name('marketplace.complaints.store');
        Route::delete('/customer/complaints/{complaint}', [MarketplaceCustomerController::class, 'cancelComplaint'])->name('marketplace.complaints.cancel');

        Route::get('/rajaongkir/provinces', [RajaOngkirController::class, 'provinces'])->name('marketplace.rajaongkir.provinces');
        Route::get('/rajaongkir/cities/{provinceId}', [RajaOngkirController::class, 'cities'])->name('marketplace.rajaongkir.cities');
        Route::get('/rajaongkir/districts/{cityId}', [RajaOngkirController::class, 'districts'])->name('marketplace.rajaongkir.districts');
        Route::post('/rajaongkir/cost', [RajaOngkirController::class, 'cost'])->name('marketplace.rajaongkir.cost');

        Route::get('/ppob', [PpobController::class, 'index'])->name('marketplace.ppob');
        Route::get('/ppob/{category}', [PpobController::class, 'products'])->name('marketplace.ppob.products');
        Route::post('/ppob/inquiry', [PpobController::class, 'inquiry'])->name('marketplace.ppob.inquiry');
        Route::post('/ppob/order', [PpobController::class, 'order'])->name('marketplace.ppob.order');
        Route::get('/ppob/orders/history', [PpobController::class, 'orders'])->name('marketplace.ppob.orders');

        Route::get('/customer/conversations', [CustomerChatController::class, 'index'])->name('marketplace.chat.index');
        Route::get('/customer/conversations/{conversation}', [CustomerChatController::class, 'show'])->name('marketplace.chat.show');
        Route::post('/customer/conversations/start/{tenant:slug}', [CustomerChatController::class, 'start'])->name('marketplace.chat.start');
        Route::post('/customer/conversations/{conversation}/messages', [CustomerChatController::class, 'sendMessage'])->name('marketplace.chat.send');

        Route::post('/customer/logout', [AuthController::class, 'logout'])->name('marketplace.logout');
    });
});

// ─── Midtrans Webhook ──────────────────────────────────────────────────────

Route::post('/webhook/midtrans', [MidtransController::class, 'notification'])->name('webhook.midtrans');

// ─── Old landing / auth routes ─────────────────────────────────────────────

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
        Route::get('admin/marketplace/categories', [MarketplaceCategoryController::class, 'index'])->name('marketplace-categories.index');
        Route::get('admin/marketplace/categories/create', [MarketplaceCategoryController::class, 'create'])->name('marketplace-categories.create');
        Route::post('admin/marketplace/categories', [MarketplaceCategoryController::class, 'store'])->name('marketplace-categories.store');
        Route::get('admin/marketplace/categories/{id}/edit', [MarketplaceCategoryController::class, 'edit'])->name('marketplace-categories.edit');
        Route::patch('admin/marketplace/categories/{id}', [MarketplaceCategoryController::class, 'update'])->name('marketplace-categories.update');
        Route::delete('admin/marketplace/categories/{id}', [MarketplaceCategoryController::class, 'destroy'])->name('marketplace-categories.destroy');
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
