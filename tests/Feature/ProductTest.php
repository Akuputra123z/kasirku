<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->tenant = Tenant::factory()->create();

    Permission::firstOrCreate(['name' => 'manage-products', 'guard_name' => 'web']);

    $this->user = User::factory()->storeOwner($this->tenant)->create();
    $this->user->givePermissionTo('manage-products');

    $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->brand = Brand::create(['tenant_id' => $this->tenant->id, 'name' => 'Test Brand']);
});

test('product can be created without weight or online fields', function () {
    $response = $this->actingAs($this->user)->post(route('products.store'), [
        'name' => 'Kopi Susu Gula Aren',
        'description' => 'Deskripsi produk',
        'price' => 18000,
        'cost_price' => 12000,
        'stock' => 10,
        'category_id' => $this->category->id,
        'brand_id' => $this->brand->id,
        'barcode' => '',
        'status' => 'active',
        'visible_online' => false,
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('products', [
        'tenant_id' => $this->tenant->id,
        'name' => 'Kopi Susu Gula Aren',
        'weight' => 0,
    ]);
});

test('product can be created with variants that omit weight and stock', function () {
    $response = $this->actingAs($this->user)->post(route('products.store'), [
        'name' => 'Es Teh Manis',
        'price' => 5000,
        'stock' => 20,
        'category_id' => $this->category->id,
        'status' => 'active',
        'variants' => [
            ['name' => 'Small', 'additional_price' => 0, 'stock' => null, 'weight' => null, 'sku' => ''],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('product_variants', [
        'name' => 'Small',
        'weight' => 0,
        'stock' => 0,
    ]);
});

test('product image_url returns external url as-is and storage path for local files', function () {
    $external = Product::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Produk dengan Gambar Online',
        'price' => 10000,
        'stock' => 5,
        'image' => 'https://picsum.photos/seed/product-1/600/600',
    ]);

    expect($external->image_url)->toBe('https://picsum.photos/seed/product-1/600/600')
        ->and($external->image_url)->toStartWith('http');

    $local = Product::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Produk dengan Gambar Lokal',
        'price' => 10000,
        'stock' => 5,
        'image' => 'products/1/foto.jpg',
    ]);

    expect($local->image_url)->toBe('/storage/products/1/foto.jpg');

    $noImage = Product::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Produk Tanpa Gambar',
        'price' => 10000,
        'stock' => 5,
    ]);

    expect($noImage->image_url)->toBeNull();
});
