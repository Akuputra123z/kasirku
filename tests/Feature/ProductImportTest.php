<?php

use App\Models\AppSetting;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    // Aktifkan sistem langganan agar isPremium benar-benar mengecek tier
    // (tanpa ini AppSetting kosong => subscription dianggap disabled => semua premium).
    AppSetting::set('subscription_enabled', '1');

    $this->tenant = Tenant::factory()->create();

    Permission::firstOrCreate(['name' => 'manage-products', 'guard_name' => 'web']);

    $this->user = User::factory()->storeOwner($this->tenant)->create();
    $this->user->givePermissionTo('manage-products');

    $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->brand = Brand::create(['tenant_id' => $this->tenant->id, 'name' => 'Test Brand']);
});

function uploadCsv(string $content): UploadedFile
{
    return UploadedFile::fake()->createWithContent('products.csv', $content);
}

test('import membuat produk beserta kategori, brand, dan barcode otomatis', function () {
    $csv = "name,description,price,cost_price,stock,weight,barcode,category,brand,status\n"
        ."Kopi Susu,Deskripsi kopi,20000,15000,10,250,8991234567890,Minuman,Kopi Nusantara,active\n"
        ."Teh Anar,Minuman teh,5000,4000,20,350,,Minuman,,\n";

    $response = $this->actingAs($this->user)->post(route('products.import'), [
        'file' => uploadCsv($csv),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('products', [
        'tenant_id' => $this->tenant->id,
        'name' => 'Kopi Susu',
        'price' => 20000,
        'cost_price' => 15000,
        'stock' => 10,
        'weight' => 250,
        'barcode' => '8991234567890',
        'status' => 'active',
    ]);

    $teh = Product::where('tenant_id', $this->tenant->id)->where('name', 'Teh Anar')->first();
    $this->assertNotNull($teh->barcode);
    $this->assertStringStartsWith('BRC-', $teh->barcode);

    $this->assertDatabaseHas('categories', ['tenant_id' => $this->tenant->id, 'name' => 'Minuman']);
    $this->assertDatabaseHas('brands', ['tenant_id' => $this->tenant->id, 'name' => 'Kopi Nusantara']);

    $this->assertSame(2, Product::where('tenant_id', $this->tenant->id)->count());

    $response->assertSessionHas('import', fn ($imp) => $imp['imported'] === 2 && $imp['updated'] === 0);
});

test('re-import dengan barcode yang sama memperbarui, bukan menduplikasi', function () {
    Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $this->category->id,
        'name' => 'Kopi Susu',
        'price' => 20000,
        'stock' => 10,
        'barcode' => '8991234567890',
    ]);

    $csv = "name,description,price,cost_price,stock,weight,barcode,category,brand,status\n"
        ."Kopi Susu,Deskripsi baru,22000,12000,30,300,8991234567890,Minuman,Kopi,active\n";

    $response = $this->actingAs($this->user)->post(route('products.import'), [
        'file' => uploadCsv($csv),
    ]);

    $response->assertRedirect();

    $this->assertSame(1, Product::where('tenant_id', $this->tenant->id)->count());

    $product = Product::where('tenant_id', $this->tenant->id)->first();
    $this->assertSame(22000.0, (float) $product->price);
    $this->assertSame(30, $product->stock);
    $this->assertSame(300, $product->weight);
    $this->assertSame('8991234567890', $product->barcode);

    $response->assertSessionHas('import', fn ($imp) => $imp['imported'] === 0 && $imp['updated'] === 1);
});

test('re-import tanpa barcode mencocokkan berdasarkan nama', function () {
    Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $this->category->id,
        'name' => 'Kopi Susu',
        'price' => 20000,
        'barcode' => null,
    ]);

    $csv = "name,description,price,cost_price,stock,weight,barcode,category,brand,status\n"
        ."Kopi Susu,Pembaruan,25000,15000,100,100,,,,\n";

    $response = $this->actingAs($this->user)->post(route('products.import'), [
        'file' => uploadCsv($csv),
    ]);

    $response->assertRedirect();

    $this->assertSame(1, Product::where('tenant_id', $this->tenant->id)->count());
    $this->assertSame(25000.0, (float) Product::where('tenant_id', $this->tenant->id)->first()->price);

    $response->assertSessionHas('import', fn ($imp) => $imp['imported'] === 0 && $imp['updated'] === 1);
});

it('tidak melewati batas produk saat impor', function () {
    config(['subscription.limits.products' => 2]);

    $csv = "name,description,price,cost_price,stock,weight,barcode,category,brand,status\n"
        ."Produk A,,1000,500,1,10,,,,\n"
        ."Produk B,,2000,1000,1,10,,,,\n"
        ."Produk C,,3000,1500,1,10,,,,\n";

    $response = $this->actingAs($this->user)->post(route('products.import'), [
        'file' => uploadCsv($csv),
    ]);

    $response->assertRedirect();

    $this->assertSame(2, Product::where('tenant_id', $this->tenant->id)->count());
    $response->assertSessionHas('import', fn ($imp) => $imp['imported'] === 2 && count($imp['errors']) === 1);
});

it('barcode di tenant lain tidak bentrok', function () {
    $otherTenant = Tenant::factory()->create();
    Product::factory()->create([
        'tenant_id' => $otherTenant->id,
        'category_id' => Category::factory()->create(['tenant_id' => $otherTenant->id])->id,
        'name' => 'Produk Tenant Lain',
        'barcode' => '8990000000001',
    ]);

    $csv = "name,description,price,cost_price,stock,weight,barcode,category,brand,status\n"
        ."Es Kopi,,1000,100,1,100,8990000000001,,,\n";

    $this->actingAs($this->user)->post(route('products.import'), [
        'file' => uploadCsv($csv),
    ])->assertRedirect();

    $this->assertDatabaseHas('products', [
        'tenant_id' => $this->tenant->id,
        'name' => 'Es Kopi',
        'barcode' => '8990000000001',
    ]);
});

it('baris yang tidak valid dilewati dan dicatat sebagai error', function () {
    $csv = "name,description,price,cost_price,stock,weight,barcode,category,brand,status\n"
        ."Produk Invalid,,bukan-angka,0,1,1,,,,\n";

    $response = $this->actingAs($this->user)->post(route('products.import'), [
        'file' => uploadCsv($csv),
    ]);

    $response->assertRedirect();

    $this->assertSame(0, Product::where('tenant_id', $this->tenant->id)->count());
    $response->assertSessionHas('import', fn ($imp) => $imp['imported'] === 0 && count($imp['errors']) === 1);
});

it('import brand tidak terblokir oleh brand bernama sama di tenant lain', function () {
    Permission::firstOrCreate(['name' => 'manage-brands', 'guard_name' => 'web']);

    $otherTenant = Tenant::factory()->create();
    Brand::create(['tenant_id' => $otherTenant->id, 'name' => 'Sama']);

    $user = User::factory()->storeOwner($this->tenant)->create();
    $user->givePermissionTo('manage-brands');

    $csv = "name,description\nSama,Deskripsi\n";

    $this->actingAs($user)->post(route('brands.import'), [
        'file' => UploadedFile::fake()->createWithContent('brands.csv', $csv),
    ])->assertRedirect();

    $this->assertDatabaseHas('brands', ['tenant_id' => $this->tenant->id, 'name' => 'Sama']);
});

it('import kategori tidak terblokir oleh kategori bernama sama di tenant lain', function () {
    Permission::firstOrCreate(['name' => 'manage-categories', 'guard_name' => 'web']);

    $otherTenant = Tenant::factory()->create();
    Category::create(['tenant_id' => $otherTenant->id, 'name' => 'Sama']);

    $user = User::factory()->storeOwner($this->tenant)->create();
    $user->givePermissionTo('manage-categories');

    $csv = "name,description\nSama,Deskripsi\n";

    $this->actingAs($user)->post(route('categories.import'), [
        'file' => UploadedFile::fake()->createWithContent('categories.csv', $csv),
    ])->assertRedirect();

    $this->assertDatabaseHas('categories', ['tenant_id' => $this->tenant->id, 'name' => 'Sama']);
});
