<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        Customer::firstOrCreate(
            ['email' => 'budi@example.com'],
            ['name' => 'Budi Santoso', 'phone' => '08123456789', 'address' => 'Jl. Merdeka No. 1', 'loyalty_points' => 500]
        );
        Customer::firstOrCreate(
            ['email' => 'siti@example.com'],
            ['name' => 'Siti Rahayu', 'phone' => '08123456788', 'address' => 'Jl. Sudirman No. 2', 'loyalty_points' => 250]
        );
        Customer::firstOrCreate(
            ['email' => 'agus@example.com'],
            ['name' => 'Agus Wijaya', 'phone' => '08123456787', 'address' => 'Jl. Ahmad Yani No. 3', 'loyalty_points' => 100]
        );
    }
}
