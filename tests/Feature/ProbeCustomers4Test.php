<?php

use App\Models\Customer;
use App\Models\StoreCustomer;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $this->tenant = Tenant::factory()->create();
    Permission::firstOrCreate(['name' => 'manage-customers', 'guard_name' => 'web']);
    $this->user = User::factory()->storeOwner($this->tenant)->create();
    $this->user->givePermissionTo('manage-customers');
});

it('dump inertia shape', function () {
    $customer = Customer::factory()->create(['name' => 'Budi']);
    StoreCustomer::create(['customer_id' => $customer->id, 'tenant_id' => $this->tenant->id, 'loyalty_points' => 250]);

    $response = $this->actingAs($this->user)
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '1')
        ->get(route('customers.index'));

    $json = json_decode($response->getContent(), true);
    fwrite(STDERR, "\nKEYS: ".json_encode(array_keys($json))."\n");
    fwrite(STDERR, "PROPS: ".json_encode(array_keys($json['props'] ?? []))."\n");
    fwrite(STDERR, "CUST0: ".json_encode($json['props']['customers']['data'][0] ?? 'NONE')."\n");
    $this->assertTrue(true);
});
