<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->randomElement(['Small', 'Medium', 'Large', 'Extra Large', 'Hot', 'Cold', 'Regular', 'Jumbo']),
            'additional_price' => fake()->randomElement([0, 3000, 5000, 7000, 10000]),
        ];
    }

    public function forProduct(int $productId): static
    {
        return $this->state(fn () => ['product_id' => $productId]);
    }
}
