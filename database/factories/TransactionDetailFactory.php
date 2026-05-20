<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionDetailFactory extends Factory
{
    protected $model = TransactionDetail::class;

    public function definition(): array
    {
        $qty = fake()->numberBetween(1, 5);
        $price = fake()->numberBetween(10000, 50000);

        return [
            'transaction_id' => Transaction::factory(),
            'product_id' => Product::factory(),
            'variant_name' => fake()->optional(0.5)->randomElement(['Small', 'Medium', 'Large', 'Hot', 'Cold']),
            'extras_selected' => fake()->optional(0.3)->randomElement([
                json_encode(['Extra Shot', 'Oatmilk']),
                json_encode(['Whipped Cream']),
                json_encode(['Boba Pearl', 'Grass Jelly']),
            ]),
            'quantity' => $qty,
            'price' => $price,
            'subtotal' => $qty * $price,
            'notes' => fake()->optional(0.2)->randomElement(['Less Sugar', 'No Ice', 'Extra Hot']),
        ];
    }

    public function forTransaction(int $transactionId, int $productId): static
    {
        return $this->state(fn () => [
            'transaction_id' => $transactionId,
            'product_id' => $productId,
        ]);
    }
}
