<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CentralRoleAndPermissionSeeder::class);

        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo-toko'],
            [
                'name' => 'Demo Toko Komputer',
                'address' => 'Jl. Raya No. 123',
                'phone' => '081234567890',
            ],
        );

        (new RoleAndPermissionSeeder)->run($tenant->id);

        User::firstOrCreate(
            ['email' => 'superadmin@mypos.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        )->assignRole('super-admin');

        $admin = User::firstOrCreate(
            ['email' => 'admin@demo-toko.com'],
            [
                'name' => 'Admin Toko',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $adminRole = Role::where('name', 'admin')
            ->where('tenant_id', $tenant->id)
            ->first();
        if ($adminRole) {
            $admin->assignRole($adminRole);
        }

        TenantUser::firstOrCreate([
            'user_id' => $admin->id,
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $kasir = User::firstOrCreate(
            ['email' => 'kasir@demo-toko.com'],
            [
                'name' => 'Kasir Toko',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $kasirRole = Role::where('name', 'kasir')
            ->where('tenant_id', $tenant->id)
            ->first();
        if ($kasirRole) {
            $kasir->assignRole($kasirRole);
        }

        TenantUser::firstOrCreate([
            'user_id' => $kasir->id,
            'tenant_id' => $tenant->id,
            'role' => 'staff',
        ]);

        (new CategorySeeder)->run($tenant->id);
        (new BrandSeeder)->run($tenant->id);

        if (app()->environment('local', 'testing')) {
            $this->call(DummyDataSeeder::class);
            $this->call(MarketplaceDummyDataSeeder::class);
        }
    }
}
