<?php

use App\Models\Category;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Shift;
use App\Models\StoreCustomer;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Voucher;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->tenant = Tenant::factory()->create();

    Permission::firstOrCreate(['name' => 'manage-pos', 'guard_name' => 'web']);

    $this->user = User::factory()->storeOwner($this->tenant)->create();
    $this->user->givePermissionTo('manage-pos');

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

    $this->customer = Customer::factory()->posCustomer()->create();
    StoreCustomer::create([
        'customer_id' => $this->customer->id,
        'tenant_id' => $this->tenant->id,
        'loyalty_points' => 0,
    ]);

    $this->voucher = Voucher::create([
        'tenant_id' => $this->tenant->id,
        'code' => 'HEMAT10',
        'name' => 'Potongan 10rb',
        'type' => 'fixed',
        'value' => 10000,
        'min_order_amount' => 0,
        'max_uses' => 10,
        'used_count' => 0,
        'valid_from' => now()->subDay(),
        'valid_until' => now()->addDay(),
        'is_active' => true,
    ]);
});

test('transaction with voucher attaches tenant_id and redeemed_at on the pivot', function () {
    $response = $this->actingAs($this->user)->post(route('pos.store'), [
        'items' => [
            ['product_id' => $this->product->id, 'quantity' => 2, 'price' => 20000],
        ],
        'tax_amount' => 0,
        'discount_amount' => 0,
        'paid_amount' => 50000,
        'payment_method_id' => $this->paymentMethod->id,
        'order_type' => 'direct',
        'customer_id' => $this->customer->id,
        'voucher_id' => $this->voucher->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('customer_voucher', [
        'customer_id' => $this->customer->id,
        'voucher_id' => $this->voucher->id,
        'tenant_id' => $this->tenant->id,
    ]);

    $this->assertDatabaseMissing('customer_voucher', [
        'customer_id' => $this->customer->id,
        'voucher_id' => $this->voucher->id,
        'redeemed_at' => null,
    ]);

    $this->assertSame(1, $this->voucher->fresh()->used_count);

    $pivot = $this->customer->vouchers()->where('vouchers.id', $this->voucher->id)->first();
    expect($pivot)->not->toBeNull()
        ->and($pivot->pivot->tenant_id)->toBe($this->tenant->id)
        ->and($pivot->pivot->redeemed_at)->not->toBeNull();
});

test('expired voucher cannot be redeemed in a transaction', function () {
    $this->voucher->update(['valid_until' => now()->subDay()]);

    $response = $this->actingAs($this->user)->post(route('pos.store'), [
        'items' => [
            ['product_id' => $this->product->id, 'quantity' => 1, 'price' => 20000],
        ],
        'tax_amount' => 0,
        'discount_amount' => 0,
        'paid_amount' => 20000,
        'payment_method_id' => $this->paymentMethod->id,
        'order_type' => 'direct',
        'customer_id' => $this->customer->id,
        'voucher_id' => $this->voucher->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');

    $this->assertDatabaseMissing('customer_voucher', [
        'customer_id' => $this->customer->id,
        'voucher_id' => $this->voucher->id,
    ]);
});
