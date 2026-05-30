<?php

use App\Models\Tenant;
use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('store registration creates tenant and returns redirect', function () {
    $response = $this->postJson(route('stores.register'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertOk();
    $response->assertJsonStructure([
        'status',
        'message',
        'redirect',
    ]);

    expect($response->json('status'))->toBe('success');
    expect(Tenant::where('name', 'Toko Test User')->exists())->toBeTrue();
});

test('store registration rejects duplicate email', function () {
    User::factory()->create(['email' => 'test@example.com']);

    $response = $this->postJson(route('stores.register'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertStatus(422);
});

test('store registration validates required fields', function () {
    $response = $this->postJson(route('stores.register'), []);

    $response->assertStatus(422);
});
