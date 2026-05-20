<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Makanan', 'Minuman', 'Kopi', 'Non-Kopi', 'Snack',
                'Roti & Kue', 'Nasi', 'Mie', 'Minuman Botol', 'Lainnya',
            ]),
            'description' => fake()->sentence(),
        ];
    }
}
