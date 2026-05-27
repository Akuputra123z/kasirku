<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = tenant()?->id;

        (new RoleAndPermissionSeeder)->run($tenantId);
        (new CategorySeeder)->run($tenantId);
        (new BrandSeeder)->run($tenantId);
        (new CustomerSeeder)->run();
        (new VoucherSeeder)->run();
        (new PaymentMethodSeeder)->run();
        (new SupplierSeeder)->run();
    }
}
