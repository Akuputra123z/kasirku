<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(?string $tenantId = null): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view-dashboard',
            'manage-products',
            'manage-categories',
            'manage-brands',
            'manage-payment-methods',
            'manage-pos',
            'view-history',
            'manage-shifts',
            'view-reports',
            'export-reports',
            'view-chat',
            'manage-settings',
            'manage-users',
            'manage-vouchers',
            'manage-suppliers',
            'manage-purchases',
            'manage-stock',
            'manage-customers',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web', 'tenant_id' => $tenantId]);
        $admin->syncPermissions($permissions);

        $supervisor = Role::firstOrCreate(['name' => 'supervisor', 'guard_name' => 'web', 'tenant_id' => $tenantId]);
        $supervisor->syncPermissions([
            'view-dashboard',
            'view-history',
            'view-reports',
            'export-reports',
            'view-chat',
            'manage-vouchers',
            'manage-suppliers',
            'manage-customers',
        ]);

        $kasir = Role::firstOrCreate(['name' => 'kasir', 'guard_name' => 'web', 'tenant_id' => $tenantId]);
        $kasir->syncPermissions([
            'view-dashboard',
            'manage-pos',
            'manage-shifts',
            'view-chat',
        ]);
    }
}
