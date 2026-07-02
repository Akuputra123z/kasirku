<?php

use App\Models\Order;
use App\Models\Review;
use App\Models\Tenant;
use App\Models\User;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create();

    $this->order = Order::create([
        'user_id' => $this->user->id,
        'tenant_id' => $this->tenant->id,
        'order_number' => 'ORD-'.str()->random(8),
        'status' => 'completed',
        'subtotal' => 50000,
        'shipping_cost' => 10000,
        'total' => 60000,
        'payment_status' => 'paid',
        'recipient_name' => $this->user->name,
        'recipient_phone' => '08123456789',
        'shipping_address' => 'Jl. Test No. 1',
    ]);
});

// ─── Customer: Create Review Form ──────────────────────────────────────────

test('customer can view review form for completed order', function () {
    $this->actingAs($this->user)
        ->get(route('marketplace.reviews.create', $this->order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('marketplace/review-create')
            ->where('order.id', $this->order->id)
        );
});

test('customer cannot review non-completed order', function () {
    $this->order->update(['status' => 'shipped']);

    $this->actingAs($this->user)
        ->get(route('marketplace.reviews.create', $this->order))
        ->assertForbidden();
});

test('customer cannot review order twice', function () {
    Review::factory()->create(['order_id' => $this->order->id, 'user_id' => $this->user->id, 'tenant_id' => $this->tenant->id]);

    $this->actingAs($this->user)
        ->get(route('marketplace.reviews.create', $this->order))
        ->assertForbidden();
});

test('customer cannot review another user order', function () {
    $otherUser = User::factory()->create();

    $this->actingAs($otherUser)
        ->get(route('marketplace.reviews.create', $this->order))
        ->assertForbidden();
});

// ─── Customer: Submit Review ───────────────────────────────────────────────

test('customer can submit review', function () {
    $this->actingAs($this->user)
        ->post(route('marketplace.reviews.store', $this->order), [
            'rating' => 5,
            'review' => 'Produk bagus!',
        ])
        ->assertRedirect(route('marketplace.orders.show', $this->order));

    $this->assertDatabaseHas('reviews', [
        'order_id' => $this->order->id,
        'user_id' => $this->user->id,
        'rating' => 5,
        'review' => 'Produk bagus!',
    ]);
});

test('customer can submit review without text', function () {
    $this->actingAs($this->user)
        ->post(route('marketplace.reviews.store', $this->order), [
            'rating' => 4,
            'review' => null,
        ])
        ->assertRedirect(route('marketplace.orders.show', $this->order));

    $this->assertDatabaseHas('reviews', [
        'order_id' => $this->order->id,
        'rating' => 4,
        'review' => null,
    ]);
});

test('review requires valid rating', function () {
    $this->actingAs($this->user)
        ->post(route('marketplace.reviews.store', $this->order), [
            'rating' => 6,
        ])
        ->assertSessionHasErrors('rating');
});

test('customer cannot submit review for non-completed order', function () {
    $this->order->update(['status' => 'pending']);

    $this->actingAs($this->user)
        ->post(route('marketplace.reviews.store', $this->order), [
            'rating' => 3,
        ])
        ->assertForbidden();
});

// ─── Tenant: View Reviews ─────────────────────────────────────────────────

test('store can view their reviews', function () {
    $tenantUser = User::factory()->storeOwner($this->tenant)->create();
    $customer = User::factory()->create();
    $order2 = Order::create([
        'user_id' => $customer->id,
        'tenant_id' => $this->tenant->id,
        'order_number' => 'ORD-REV-1',
        'status' => 'completed',
        'subtotal' => 50000,
        'shipping_cost' => 10000,
        'total' => 60000,
        'payment_status' => 'paid',
        'recipient_name' => $customer->name,
        'recipient_phone' => '08123456789',
        'shipping_address' => 'Jl. Review No. 1',
    ]);
    $review = Review::create([
        'order_id' => $order2->id,
        'user_id' => $customer->id,
        'tenant_id' => $this->tenant->id,
        'rating' => 5,
        'review' => 'Bagus!',
    ]);

    // Verify relationships work
    expect($review->user)->not->toBeNull();
    expect($review->user->name)->toBe($customer->name);
    expect($review->order)->not->toBeNull();
    expect($review->order->order_number)->toBe($order2->order_number);

    $response = $this->actingAs($tenantUser)
        ->get(route('tenant.reviews.index'));

    $response->assertOk();
});

// ─── Model & Relationships ─────────────────────────────────────────────────

test('review belongs to order', function () {
    $review = Review::factory()->create(['order_id' => $this->order->id]);

    expect($review->order->id)->toBe($this->order->id);
});

test('review belongs to user', function () {
    $review = Review::factory()->create(['user_id' => $this->user->id]);

    expect($review->user->id)->toBe($this->user->id);
});

test('review belongs to tenant', function () {
    $review = Review::factory()->create(['tenant_id' => $this->tenant->id]);

    expect($review->tenant->id)->toBe($this->tenant->id);
});

test('order has one review', function () {
    $review = Review::factory()->create(['order_id' => $this->order->id]);

    expect($this->order->review->id)->toBe($review->id);
});
