<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Tunai', 'type' => 'cash'],
            ['name' => 'Transfer Bank (BCA)', 'type' => 'transfer'],
            ['name' => 'Transfer Bank (Mandiri)', 'type' => 'transfer'],
            ['name' => 'Transfer Bank (BRI)', 'type' => 'transfer'],
            ['name' => 'QRIS (GoPay / OVO / Dana)', 'type' => 'qris'],
            ['name' => 'Debit / Kartu Kredit', 'type' => 'debit'],
        ];

        foreach ($methods as $method) {
            PaymentMethod::firstOrCreate(
                ['name' => $method['name']],
                ['type' => $method['type'], 'is_active' => true],
            );
        }
    }
}
