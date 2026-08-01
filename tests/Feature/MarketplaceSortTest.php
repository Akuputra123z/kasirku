<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);

    $this->cheap = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $this->category->id,
        'name' => 'Kopi Murah',
        'price' => 10000,
        'online_price' => 15000,
        'visible_online' => true,
        'status' => 'active',
    ]);

    $this->medium = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $this->category->id,
        'name' => 'Teh Manis',
        'price' => 25000,
        'online_price' => null,
        'visible_online' => true,
        'status' => 'active',
    ]);

    $this->expensive = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $this->category->id,
        'name' => 'Croissant Premium',
        'price' => 50000,
        'online_price' => 45000,
        'visible_online' => true,
        'status' => 'active',
    ]);
});

test('marketplace sorts by effective price ascending using online_price or price', function () {
    $response = $this->get(route('marketplace.products', ['sort' => 'price_low']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('marketplace/products')
        ->where('products.data.0.name', 'Kopi Murah')
        ->where('products.data.0.display_price', 15000)
        ->where('products.data.1.name', 'Teh Manis')
        ->where('products.data.1.display_price', 25000)
        ->where('products.data.2.name', 'Croissant Premium')
        ->where('products.data.2.display_price', 45000)
    );
});

test('marketplace sorts by effective price descending', function () {
    $response = $this->get(route('marketplace.products', ['sort' => 'price_high']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('marketplace/products')
        ->where('products.data.0.name', 'Croissant Premium')
        ->where('products.data.1.name', 'Teh Manis')
        ->where('products.data.2.name', 'Kopi Murah')
    );
});

test('marketplace filters by price range using effective price', function () {
    $response = $this->get(route('marketplace.products', ['price_min' => 20000, 'price_max' => 40000]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('marketplace/products')
        ->where('products.total', 1)
        ->where('products.data.0.name', 'Teh Manis')
    );
});
