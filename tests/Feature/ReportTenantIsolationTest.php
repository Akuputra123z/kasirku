<?php

use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->tenant1 = Tenant::factory()->create();
    $this->tenant2 = Tenant::factory()->create();

    Permission::firstOrCreate(['name' => 'view-reports', 'guard_name' => 'web']);

    $this->user1 = User::factory()->storeOwner($this->tenant1)->create();
    $this->user1->givePermissionTo('view-reports');

    $this->user2 = User::factory()->storeOwner($this->tenant2)->create();
    $this->user2->givePermissionTo('view-reports');

    Order::create([
        'tenant_id' => $this->tenant1->id,
        'user_id' => $this->user1->id,
        'type' => 'marketplace',
        'order_number' => 'ORD-1001',
        'status' => 'delivered',
        'payment_status' => 'paid',
        'shipping_address' => 'Jl. Test No. 1',
        'recipient_name' => 'Buyer 1',
        'recipient_phone' => '0811',
        'subtotal' => 90000,
        'shipping_cost' => 10000,
        'total' => 100000,
    ]);

    Order::create([
        'tenant_id' => $this->tenant2->id,
        'user_id' => $this->user2->id,
        'type' => 'marketplace',
        'order_number' => 'ORD-2001',
        'status' => 'delivered',
        'payment_status' => 'paid',
        'shipping_address' => 'Jl. Test No. 2',
        'recipient_name' => 'Buyer 2',
        'recipient_phone' => '0822',
        'subtotal' => 500000,
        'shipping_cost' => 50000,
        'total' => 550000,
    ]);

    Order::create([
        'tenant_id' => $this->tenant2->id,
        'user_id' => $this->user2->id,
        'type' => 'ppob',
        'order_number' => 'PPOB-2002',
        'status' => 'success',
        'payment_status' => 'paid',
        'shipping_address' => 'Jl. Test No. 2',
        'recipient_name' => 'Buyer 2',
        'recipient_phone' => '0822',
        'subtotal' => 100000,
        'total' => 100000,
        'ppob_markup' => 5000,
    ]);
});

test('tenant 1 report only includes their own marketplace orders', function () {
    $response = $this->actingAs($this->user1)->get(route('reports.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/index')
        ->where('marketplaceSummary.total_orders', 1)
        ->where('marketplaceSummary.total_revenue', 100000)
        ->where('ppobSummary.total_orders', 0)
    );
});

test('tenant 2 report only includes their own marketplace and ppob orders', function () {
    $response = $this->actingAs($this->user2)->get(route('reports.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/index')
        ->where('marketplaceSummary.total_orders', 1)
        ->where('marketplaceSummary.total_revenue', 550000)
        ->where('ppobSummary.total_orders', 1)
        ->where('ppobSummary.total_margin', 5000)
    );
});
