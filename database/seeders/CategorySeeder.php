<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(?string $tenantId = null): void
    {
        $categories = [
            ['name' => 'Laptop & Notebook', 'description' => 'Unit laptop baru dan second dari berbagai brand (HP, ASUS, Lenovo, Acer, dll).'],
            ['name' => 'PC Rakitan & Desktop', 'description' => 'Komputer PC untuk kebutuhan Kantor, Sekolah, Gaming, dan Editing.'],
            ['name' => 'Printer & Scanner', 'description' => 'Unit printer inkjet, laserjet, dot matrix, dan thermal.'],
            ['name' => 'Monitor', 'description' => 'Layar monitor PC dari berbagai ukuran dan spesifikasi.'],
            ['name' => 'Conference & Audio System', 'description' => 'Perangkat sound system, central unit, dan microphone rapat (TOA, dll).'],
            ['name' => 'Processor & Motherboard', 'description' => 'Komponen inti PC (Intel/AMD) beserta mainboard pendukungnya.'],
            ['name' => 'RAM & Storage (SSD/HDD)', 'description' => 'Komponen upgrade memori dan media penyimpanan data komputer.'],
            ['name' => 'Keyboard & Mouse', 'description' => 'Aksesori input, termasuk part keyboard laptop pengganti.'],
            ['name' => 'Baterai & Charger Laptop', 'description' => 'Sparepart daya, adaptor, dan pengisian daya laptop.'],
            ['name' => 'Tinta & Catridge Printer', 'description' => 'Bahan habis pakai (consumables) untuk kebutuhan cetak printer.'],
            ['name' => 'Kabel & Konektor', 'description' => 'Kabel LAN, HDMI, VGA, Roll Cable, hingga perkabelan audio.'],
            ['name' => 'Jasa Servis Laptop & PC', 'description' => 'Perbaikan mainboard, engsel, instalasi OS, pembersihan thermal paste, dan ganti part.'],
            ['name' => 'Jasa Servis Printer', 'description' => 'Perbaikan mekanik printer, reset bios, ganti head, dan pasang sistem infus.'],
            ['name' => 'Jasa Instalasi Jaringan & Audio', 'description' => 'Pemasangan jaringan LAN/Wi-Fi serta setup conference audio system.'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['name' => $cat['name'], 'tenant_id' => $tenantId],
                ['description' => $cat['description'], 'tenant_id' => $tenantId]
            );
        }
    }
}
