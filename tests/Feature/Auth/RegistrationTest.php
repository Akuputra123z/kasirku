<?php

use App\Models\Tenant;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('store registration creates tenant and returns redirect', function () {
    $response = $this->post(route('stores.register'), [
        'store_name' => 'Toko Test',
        'store_slug' => 'toko-test',
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
    expect(Tenant::where('slug', 'toko-test')->exists())->toBeTrue();
});

test('store registration rejects duplicate slug', function () {
    Tenant::create(['name' => 'Existing', 'slug' => 'existing']);

    $response = $this->post(route('stores.register'), [
        'store_name' => 'Toko Test',
        'store_slug' => 'existing',
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect($response->status())->toBe(302);
});

test('store registration validates required fields', function () {
    $response = $this->post(route('stores.register'), []);

    expect($response->status())->toBe(302);
});
