<?php

use App\Models\Cart;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Shift;
use App\Models\Subscription;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use App\Services\BarcodeService;
use App\Services\BillingService;
use Illuminate\Database\QueryException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->tenant = Tenant::factory()->create();
    $this->otherTenant = Tenant::factory()->create();

    foreach (['manage-pos', 'manage-purchases', 'manage-users', 'manage-shifts', 'manage-orders'] as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }

    $this->user = User::factory()->storeOwner($this->tenant)->create();
    $this->user->givePermissionTo(['manage-pos', 'manage-purchases', 'manage-users']);

    $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $this->category->id,
        'name' => 'Kopi Susu',
        'price' => 20000,
        'stock' => 50,
    ]);
    $this->paymentMethod = PaymentMethod::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->shift = Shift::factory()->active()->create([
        'user_id' => $this->user->id,
        'tenant_id' => $this->tenant->id,
        'starting_cash' => 100000,
    ]);
});

test('POS — harga dihitung dari backend, harga client diabaikan', function () {
    $response = $this->actingAs($this->user)->post(route('pos.store'), [
        'items' => [
            ['product_id' => $this->product->id, 'quantity' => 2, 'price' => 1],
        ],
        'subtotal_amount' => 2,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'total_amount' => 2,
        'paid_amount' => 50000,
        'payment_method_id' => $this->paymentMethod->id,
        'order_type' => 'direct',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('transaction_details', [
        'product_id' => $this->product->id,
        'price' => 20000,
        'quantity' => 2,
        'subtotal' => 40000,
    ]);
});

test('marketplace checkout menolak kuantitas melebihi stok', function () {
    $customer = Customer::factory()->create(['user_id' => $this->user->id]);
    $address = CustomerAddress::create([
        'customer_id' => $customer->id,
        'recipient_name' => 'Tester',
        'phone' => '08123456789',
        'address' => 'Jl. Contoh 1',
        'city' => 'Jakarta Selatan',
        'province' => 'DKI Jakarta',
        'postal_code' => '12140',
    ]);

    $this->product->update(['stock' => 2]);

    Cart::create([
        'user_id' => $this->user->id,
        'product_id' => $this->product->id,
        'quantity' => 99,
    ]);

    $response = $this->actingAs($this->user)->post(route('marketplace.checkout.process'), [
        'address_id' => $address->id,
    ]);

    $response->assertSessionHas('error');
    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseHas('products', ['id' => $this->product->id, 'stock' => 2]);
});

test('receive purchase order tidak menambah stok dua kali', function () {
    $supplier = Supplier::create(['tenant_id' => $this->tenant->id, 'name' => 'Supplier A']);
    $po = PurchaseOrder::create([
        'tenant_id' => $this->tenant->id,
        'supplier_id' => $supplier->id,
        'user_id' => $this->user->id,
        'po_number' => 'PO-TEST-'.uniqid(),
        'order_date' => now(),
        'total_amount' => 20000,
        'status' => 'pending',
    ]);
    $po->details()->create([
        'tenant_id' => $this->tenant->id,
        'product_id' => $this->product->id,
        'quantity' => 5,
        'unit_cost' => 4000,
        'subtotal' => 20000,
    ]);

    $this->actingAs($this->user)->post(route('purchase-orders.receive', $po))->assertRedirect();
    $this->actingAs($this->user)->post(route('purchase-orders.receive', $po))->assertRedirect();
    $this->actingAs($this->user)->post(route('purchase-orders.receive', $po))->assertRedirect();

    $this->assertDatabaseHas('products', ['id' => $this->product->id, 'stock' => 55]);
});

test('webhook midtrans dengan signature palsu ditolak', function () {
    $response = $this->postJson(route('webhook.midtrans'), [
        'order_id' => 'SUB-FAKE',
        'status_code' => 'paid',
        'gross_amount' => '100000.00',
        'signature_key' => 'signature-palsu',
        'merchant_id' => 'M0001',
    ]);

    $response->assertStatus(401);
});

test('switching tenant lewat query/cookie diabaikan untuk user yang sudah login', function () {
    $this->actingAs($this->user);

    $this->withCookie('tenant', $this->otherTenant->slug)
        ->get('/pos?_tenant='.$this->otherTenant->slug);

    $this->assertSame($this->tenant->id, app('current.tenant')->id);
});

test('role dengan nama reserved (super-admin) ditolak', function () {
    $response = $this->actingAs($this->user)->post(route('roles.store'), [
        'name' => 'super-admin',
        'permissions' => [],
    ]);

    $response->assertSessionHasErrors('name');
    $this->assertDatabaseMissing('roles', ['name' => 'super-admin', 'tenant_id' => $this->tenant->id]);
});

test('barcode duplikat dalam satu tenant ditolak di level database', function () {
    $barcodeService = app(BarcodeService::class);

    $this->product->update(['barcode' => 'BAR-12345']);

    $barcodeService->bustForProductId($this->product->id);
    $lookup = $barcodeService->lookup('BAR-12345');
    $this->assertNotNull($lookup);
    $this->assertSame($this->product->id, $lookup['id']);

    expect(fn () => Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $this->category->id,
        'name' => 'Produk Duplikat',
        'barcode' => 'BAR-12345',
        'stock' => 10,
    ]))->toThrow(QueryException::class);

    $this->assertDatabaseCount('products', 1);
});

test('POS diblokir (redirect ke halaman suspended) saat tenant non-aktif', function () {
    $this->tenant->update(['subscription_status' => 'suspended']);

    $this->actingAs($this->user)
        ->get(route('pos.index'))
        ->assertRedirect(route('suspended'));
});

test('POS dapat diakses saat tenant aktif', function () {
    $this->actingAs($this->user)
        ->get(route('pos.index'))
        ->assertOk();
});

test('checkout marketplace dari toko suspended ditolak', function () {
    $customer = Customer::factory()->create(['user_id' => $this->user->id]);
    $address = CustomerAddress::create([
        'customer_id' => $customer->id,
        'recipient_name' => 'Tester',
        'phone' => '08123456789',
        'address' => 'Jl. Contoh 1',
        'city' => 'Jakarta Selatan',
        'province' => 'DKI Jakarta',
        'postal_code' => '12140',
    ]);

    Cart::create([
        'user_id' => $this->user->id,
        'product_id' => $this->product->id,
        'quantity' => 1,
    ]);

    $this->tenant->update(['subscription_status' => 'suspended']);

    $response = $this->actingAs($this->user)->post(route('marketplace.checkout.process'), [
        'address_id' => $address->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');
    $this->assertStringContainsString('tidak aktif', (string) session('error'));
    $this->assertDatabaseCount('orders', 0);
});

test('BillingService anti-replay — settlement yang sama tidak memperpanjang langganan dua kali', function () {
    $orderId = 'MID-'.uniqid();
    $subscription = Subscription::create([
        'tenant_id' => $this->tenant->id,
        'package' => 'monthly',
        'amount' => 100000,
        'midtrans_order_id' => $orderId,
        'status' => 'pending',
    ]);

    $billing = app(BillingService::class);
    $billing->handlePaymentSuccess($orderId, 'TXN-REPLAY-1');

    $subscription->refresh();
    $this->assertSame('paid', $subscription->status);
    $firstExpiry = $subscription->expires_at->toDateTimeString();

    // Midtrans me-retry notifikasi berkali-kali — harus idempoten.
    $billing->handlePaymentSuccess($orderId, 'TXN-REPLAY-1');

    $subscription->refresh();
    $this->assertSame('paid', $subscription->status);
    $this->assertSame($firstExpiry, $subscription->expires_at->toDateTimeString());
});

test('kasir tanpa manage-orders tidak bisa buka Online Orders', function () {
    $this->actingAs($this->user)->get(route('online-orders.index'))->assertForbidden();

    $this->user->givePermissionTo('manage-orders');

    $this->actingAs($this->user)->get(route('online-orders.index'))->assertOk();
});

test('chat & ulasan store butuh permission manage-orders', function () {
    $this->actingAs($this->user)->get(route('tenant.chat.index'))->assertForbidden();
    $this->actingAs($this->user)->get(route('tenant.reviews.index'))->assertForbidden();

    $this->user->givePermissionTo('manage-orders');

    $this->actingAs($this->user)->get(route('tenant.chat.index'))->assertOk();
});

test('shift hanya untuk pemegang manage-shifts', function () {
    $this->user->givePermissionTo('manage-shifts');

    $this->actingAs($this->user)->get(route('shifts.index'))->assertOk();
});

test('report dibulatkan ke sen — float drift tidak bocor ke UI', function () {
    $permission = Permission::firstOrCreate(['name' => 'view-reports', 'guard_name' => 'web']);
    $this->user->givePermissionTo($permission);

    foreach ([0.1, 0.2] as $total) {
        Transaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'shift_id' => $this->shift->id,
            'payment_method_id' => $this->paymentMethod->id,
            'total_amount' => $total,
            'subtotal_amount' => $total,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'paid_amount' => $total,
            'change_amount' => 0,
            'user_id' => $this->user->id,
            'created_at' => now(),
        ]);
    }

    $response = $this->actingAs($this->user)->get(route('reports.index'));
    $response->assertOk();

    $props = $response->viewData('page')['props'];
    $this->assertSame(0.3, (float) $props['mergedSummary']['total_pos']);
});
