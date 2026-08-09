<?php

use Spatie\Permission\Models\Permission;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $this->tenant = Tenant::factory()->create();
    Permission::firstOrCreate(['name' => 'manage-customers', 'guard_name' => 'web']);
    $this->user = User::factory()->storeOwner($this->tenant)->create();
    $this->user->givePermissionTo('manage-customers');
});

it('customers index renders', function () {
    $response = $this->actingAs($this->user)->get(route('customers.index'));
    $response->assertStatus(200);
});
