<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Cash', 'QRIS', 'BCA', 'Mandiri', 'BRI', 'ShopeePay', 'GoPay', 'Dana']),
            'type' => fake()->randomElement(['Cash', 'E-Wallet', 'Bank']),
            'is_active' => true,
        ];
    }
}
