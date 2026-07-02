<?php

use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->tenant1 = Tenant::factory()->create();
    $this->tenant2 = Tenant::factory()->create();

    Permission::create(['name' => 'view-dashboard', 'guard_name' => 'web']);

    $this->userTenant1 = User::factory()->storeOwner($this->tenant1)->create();
    $this->userTenant1->givePermissionTo('view-dashboard');

    $this->userTenant2 = User::factory()->storeOwner($this->tenant2)->create();
    $this->userTenant2->givePermissionTo('view-dashboard');

    Transaction::create([
        'tenant_id' => $this->tenant1->id,
        'transaction_code' => 'TRX-001',
        'subtotal_amount' => 100000,
        'tax_amount' => 11000,
        'discount_amount' => 0,
        'total_amount' => 111000,
        'paid_amount' => 111000,
        'change_amount' => 0,
        'user_id' => $this->userTenant1->id,
        'status' => 'completed',
    ]);

    Transaction::create([
        'tenant_id' => $this->tenant2->id,
        'transaction_code' => 'TRX-002',
        'subtotal_amount' => 50000,
        'tax_amount' => 5500,
        'discount_amount' => 0,
        'total_amount' => 55500,
        'paid_amount' => 55500,
        'change_amount' => 0,
        'user_id' => $this->userTenant2->id,
        'status' => 'completed',
    ]);
});

test('tenant 1 only sees their own transactions on dashboard', function () {
    $response = $this->actingAs($this->userTenant1)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('stats.totalEarnings', 111000)
        ->where('stats.totalSales', 1)
    );
});

test('tenant 2 only sees their own transactions on dashboard', function () {
    $response = $this->actingAs($this->userTenant2)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('stats.totalEarnings', 55500)
        ->where('stats.totalSales', 1)
    );
});

test('tenant user has tenant prop in shared data', function () {
    $response = $this->actingAs($this->userTenant1)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('auth.user.id', $this->userTenant1->id)
        ->has('tenant')
        ->where('tenant.id', $this->tenant1->id)
    );
});
