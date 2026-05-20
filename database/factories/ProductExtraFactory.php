<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductExtra;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductExtraFactory extends Factory
{
    protected $model = ProductExtra::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->randomElement([
                'Extra Shot', 'Oatmilk', 'Soy Milk', 'Caramel Syrup',
                'Vanilla Syrup', 'Hazelnut Syrup', 'Whipped Cream',
                'Ice Cream', 'Boba Pearl', 'Grass Jelly',
            ]),
            'price' => fake()->randomElement([3000, 5000, 7000, 8000, 10000, 12000]),
        ];
    }

    public function forProduct(int $productId): static
    {
        return $this->state(fn () => ['product_id' => $productId]);
    }
}
