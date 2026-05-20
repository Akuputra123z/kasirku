<?php

namespace Database\Factories;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-30 days', '-1 days');
        $end = (clone $start)->modify('+'.rand(4, 10).' hours');

        return [
            'user_id' => User::factory(),
            'start_time' => $start,
            'end_time' => $end,
            'starting_cash' => fake()->randomElement([200000, 300000, 500000, 1000000]),
            'expected_cash' => fake()->randomElement([500000, 800000, 1200000, 2000000]),
            'actual_cash' => fake()->randomElement([500000, 800000, 1200000, 2000000]),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'end_time' => null,
            'expected_cash' => null,
            'actual_cash' => null,
            'notes' => null,
        ]);
    }
}
