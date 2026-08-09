<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Tambahkan permission manage-orders (menu Online Orders, Chat store,
     * Ulasan) dan berikan ke role admin & supervisor SEMUA tenant yang
     * sudah ada — seeder hanya menjangkau tenant baru.
     */
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permission = Permission::firstOrCreate(['name' => 'manage-orders', 'guard_name' => 'web']);

        Role::where('guard_name', 'web')
            ->whereIn('name', ['admin', 'supervisor'])
            ->get()
            ->each(fn (Role $role) => $role->givePermissionTo($permission));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permission = Permission::findByName('manage-orders', 'web');

        Role::where('guard_name', 'web')
            ->whereIn('name', ['admin', 'supervisor'])
            ->get()
            ->each(fn (Role $role) => $role->revokePermissionTo($permission));

        $permission?->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
