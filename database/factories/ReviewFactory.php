<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Review;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        $order = Order::create([
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
            'order_number' => 'ORD-'.str()->random(8),
            'status' => 'completed',
            'subtotal' => 50000,
            'shipping_cost' => 10000,
            'total' => 60000,
            'payment_status' => 'paid',
            'recipient_name' => $user->name,
            'recipient_phone' => '08123456789',
            'shipping_address' => 'Jl. Factory No. 1',
        ]);

        return [
            'order_id' => $order->id,
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
            'rating' => fake()->numberBetween(1, 5),
            'review' => fake()->optional(0.7)->sentence(),
        ];
    }
}
