<?php

use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Permission::create(['name' => 'manage-tenants', 'guard_name' => 'web']);
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);

    $this->superAdmin = User::factory()->create();
    $this->superAdmin->assignRole('super-admin');
});

test('super admin is redirected to the admin panel after login', function () {
    $response = $this->post(route('login.store'), [
        'email' => $this->superAdmin->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($this->superAdmin);
    $response->assertRedirect(route('admin.tenants'));
});

test('super admin without a tenant is redirected to the admin panel instead of the customer dashboard', function () {
    $response = $this->actingAs($this->superAdmin)->get(route('dashboard'));

    $response->assertRedirect(route('admin.tenants'));
});

test('regular user without a tenant is still redirected to the customer dashboard', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertRedirect(route('marketplace.customer.dashboard'));
});

test('super admin can access the admin dashboard', function () {
    Tenant::factory()->count(3)->create();

    $response = $this->actingAs($this->superAdmin)->get(route('admin.dashboard'));

    $response->assertOk();
});
