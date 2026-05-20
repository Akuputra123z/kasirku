<?php

use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Permission::create(['name' => 'manage-tenants', 'guard_name' => 'web']);

    $this->superAdmin = User::factory()->create();
    $this->superAdmin->givePermissionTo('manage-tenants');

    $this->tenant = Tenant::factory()->create();
});

test('super admin can view tenant list', function () {
    $response = $this->actingAs($this->superAdmin)
        ->get(route('admin.tenants'));

    $response->assertOk();
});

test('super admin can enter a tenant store', function () {
    $response = $this->actingAs($this->superAdmin)
        ->get(route('admin.enter-store', $this->tenant->slug));

    $response->assertRedirect('/dashboard');
    expect(session('tenant_id'))->toBe($this->tenant->id);
    expect(session('central_admin_id'))->toBe($this->superAdmin->id);
});

test('super admin can leave a tenant store', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('admin.enter-store', $this->tenant->slug));

    $response = $this->get(route('admin.leave-store'));

    $response->assertRedirect('/admin/tenants');
    expect(session('tenant_id'))->toBeNull();
    expect(session('central_admin_id'))->toBeNull();
});

test('unauthenticated users cannot access tenant admin', function () {
    $response = $this->get(route('admin.tenants'));
    $response->assertRedirect(route('login'));
});

test('users without manage-tenants permission cannot access tenant admin', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('admin.tenants'));
    $response->assertForbidden();
});
