<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

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
            ['name' => 'Super Admin', 'password' => bcrypt('password'), 'email_verified_at' => now(), 'tenant_id' => null]
        )->assignRole('super-admin');

        $admin = User::firstOrCreate(
            ['email' => 'admin@demo-toko.com'],
            ['name' => 'Admin Toko', 'password' => bcrypt('password'), 'email_verified_at' => now(), 'tenant_id' => $tenant->id]
        );
        $admin->assignRole('admin');

        $kasir = User::firstOrCreate(
            ['email' => 'kasir@demo-toko.com'],
            ['name' => 'Kasir Toko', 'password' => bcrypt('password'), 'email_verified_at' => now(), 'tenant_id' => $tenant->id]
        );
        $kasir->assignRole('kasir');

        (new CategorySeeder)->run($tenant->id);
    }
}
