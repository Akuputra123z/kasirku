<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(?string $tenantId = null): void
    {
        $brands = [
            ['name' => 'ASUS', 'description' => 'Laptop, motherboard, GPU, dan komponen PC.'],
            ['name' => 'ACER', 'description' => 'Laptop dan monitor.'],
            ['name' => 'Lenovo', 'description' => 'Laptop, PC desktop, dan server.'],
            ['name' => 'HP', 'description' => 'Laptop, printer, dan scanner.'],
            ['name' => 'Dell', 'description' => 'Laptop dan PC workstation.'],
            ['name' => 'Apple', 'description' => 'MacBook, iMac, dan aksesoris.'],
            ['name' => 'Samsung', 'description' => 'Monitor, SSD, dan RAM.'],
            ['name' => 'Logitech', 'description' => 'Keyboard, mouse, dan webcam.'],
            ['name' => 'Canon', 'description' => 'Printer, scanner, dan tinta.'],
            ['name' => 'Epson', 'description' => 'Printer, scanner, dan tinta.'],
            ['name' => 'Kingston', 'description' => 'RAM dan SSD.'],
            ['name' => 'Western Digital', 'description' => 'HDD dan SSD eksternal.'],
            ['name' => 'Seagate', 'description' => 'HDD internal dan eksternal.'],
            ['name' => 'Intel', 'description' => 'Processor dan SSD.'],
            ['name' => 'AMD', 'description' => 'Processor dan GPU.'],
            ['name' => 'NVIDIA', 'description' => 'GPU dan chip grafis.'],
            ['name' => 'MSI', 'description' => 'Motherboard, laptop, dan GPU.'],
            ['name' => 'Gigabyte', 'description' => 'Motherboard, GPU, dan aksesoris.'],
            ['name' => 'Corsair', 'description' => 'RAM, PSU, dan casing.'],
            ['name' => 'Brother', 'description' => 'Printer dan mesin jahit.'],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(
                ['name' => $brand['name'], 'tenant_id' => $tenantId],
                ['description' => $brand['description'], 'tenant_id' => $tenantId]
            );
        }
    }
}
