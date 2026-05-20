<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        $subtotal = fake()->numberBetween(50000, 500000);
        $discount = fake()->optional(0.3)->numberBetween(5000, 50000) ?? 0;
        $tax = (int) ($subtotal * 0.1);
        $total = $subtotal + $tax - $discount;
        $paid = $total + fake()->optional(0.5)->numberBetween(0, 50000) ?? 0;

        return [
            'transaction_code' => 'TRX-'.now()->format('Ymd').'-'.str_pad(fake()->unique()->numberBetween(1, 9999), 6, '0', STR_PAD_LEFT),
            'subtotal_amount' => $subtotal,
            'tax_amount' => $tax,
            'discount_amount' => $discount,
            'total_amount' => $total,
            'paid_amount' => $paid,
            'change_amount' => $paid - $total,
            'user_id' => User::factory(),
            'payment_method_id' => PaymentMethod::factory(),
            'shift_id' => Shift::factory(),
            'order_type' => fake()->randomElement(['dine_in', 'take_away', 'delivery']),
            'table_number' => fake()->optional(0.4)->randomDigitNotNull(),
            'status' => 'completed',
        ];
    }
}
