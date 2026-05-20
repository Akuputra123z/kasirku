<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Americano', 'Latte', 'Cappuccino', 'Espresso', 'Mocha',
                'Matcha Latte', 'Red Velvet Latte', 'Choco Hazelnut',
                'Kopi Hitam', 'Kopi Susu', 'Teh Tarik', 'Milkshake Coklat',
                'Milkshake Stroberi', 'Jus Jeruk', 'Jus Alpukat',
                'Nasi Goreng', 'Mie Goreng', 'Kentang Goreng',
                'Pisang Goreng', 'Roti Bakar', 'Croissant', 'Cheesecake',
            ]),
            'description' => fake()->sentence(),
            'price' => fake()->randomElement([15000, 18000, 20000, 25000, 30000, 35000, 40000, 50000]),
            'stock' => fake()->numberBetween(0, 100),
            'category_id' => Category::factory(),
            'status' => fake()->randomElement(['active', 'active', 'active', 'inactive']),
        ];
    }
}
