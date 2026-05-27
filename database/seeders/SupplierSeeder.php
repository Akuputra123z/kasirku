<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['name' => 'PT Komputer Indonesia', 'email' => 'sales@komputerindo.co.id', 'phone' => '021-12345678', 'pic_name' => 'Budi Santoso', 'pic_phone' => '081234567890'],
            ['name' => 'CV Teknologi Maju', 'email' => 'info@tekmaju.com', 'phone' => '021-87654321', 'pic_name' => 'Siti Rahmawati', 'pic_phone' => '087654321098'],
            ['name' => 'Toko Komputer Jaya Abadi', 'email' => 'order@kjaya.com', 'phone' => '024-11223344', 'pic_name' => 'Ahmad Fauzi', 'pic_phone' => '085678901234'],
            ['name' => 'PT Elektronik Prima', 'email' => 'sales@eprima.co.id', 'phone' => '031-55667788', 'pic_name' => 'Dewi Lestari', 'pic_phone' => '082345678901'],
            ['name' => 'Distributor Laptop Nusantara', 'email' => 'sales@dln.co.id', 'phone' => '061-99887766', 'pic_name' => 'Rudi Hermawan', 'pic_phone' => '089012345678'],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::firstOrCreate(
                ['name' => $supplier['name']],
                $supplier,
            );
        }
    }
}
