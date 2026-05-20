<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        Voucher::firstOrCreate(
            ['code' => 'BELANJA10'],
            [
                'name' => 'Diskon 10%',
                'type' => 'percentage',
                'value' => 10,
                'min_order_amount' => 50000,
                'max_discount' => 50000,
                'max_uses' => 100,
                'used_count' => 0,
                'valid_from' => now(),
                'valid_until' => now()->addMonths(3),
                'is_active' => true,
            ]
        );

        Voucher::firstOrCreate(
            ['code' => 'HEMAT20'],
            [
                'name' => 'Diskon Rp 20.000',
                'type' => 'fixed',
                'value' => 20000,
                'min_order_amount' => 100000,
                'max_discount' => null,
                'max_uses' => 50,
                'used_count' => 0,
                'valid_from' => now(),
                'valid_until' => now()->addMonths(1),
                'is_active' => true,
            ]
        );

        Voucher::firstOrCreate(
            ['code' => 'GRATISONGKIR'],
            [
                'name' => 'Gratis Ongkir Rp 15.000',
                'type' => 'fixed',
                'value' => 15000,
                'min_order_amount' => 75000,
                'max_discount' => null,
                'max_uses' => null,
                'used_count' => 0,
                'valid_from' => null,
                'valid_until' => null,
                'is_active' => true,
            ]
        );
    }
}
