<?php

use App\Models\User;

test('customer register creates user and customer', function () {
    $response = $this->post(route('marketplace.register.store'), [
        'name' => 'Budi Customer',
        'email' => 'budi@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertRedirect('/customer/login');
    $response->assertSessionHas('status');

    $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
    $this->assertDatabaseHas('customers', [
        'email' => 'budi@example.com',
        'name' => 'Budi Customer',
    ]);
});

test('customer register fails validation without password confirmation', function () {
    $response = $this->post(route('marketplace.register.store'), [
        'name' => 'Budi Customer',
        'email' => 'budi@example.com',
        'password' => 'password123',
    ]);

    $response->assertSessionHasErrors('password');
});

test('customer register with existing store-owner email redirects to login', function () {
    $user = User::factory()->create([
        'email' => 'owner@example.com',
    ]);

    $response = $this->post(route('marketplace.register.store'), [
        'name' => 'Owner',
        'email' => 'owner@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertRedirect('/customer/login');
    $response->assertSessionHas('status');
    $this->assertDatabaseMissing('customers', ['email' => 'owner@example.com']);
});
