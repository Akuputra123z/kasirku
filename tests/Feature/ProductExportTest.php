<?php

use App\Exports\ProductExport;
use App\Models\AppSetting;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    // Aktifkan sistem langganan agar isPremium benar-benar mengecek tier.
    AppSetting::set('subscription_enabled', '1');

    $this->tenant = Tenant::factory()->create();

    Permission::firstOrCreate(['name' => 'manage-products', 'guard_name' => 'web']);

    $this->user = User::factory()->storeOwner($this->tenant)->create();
    $this->user->givePermissionTo('manage-products');
});

it('export produk: premium dapat download, non-premium & tanpa permission ditolak', function () {
    // Catatan: antar-request di proses test yang sama, binding 'current.tenant'
    // tidak otomatis direset (artefak container test) — reset manual.
    $resetTenant = fn () => app()->forgetInstance('current.tenant');

    // 1) Tenant free (non-premium) → ditolak, redirect dengan pesan error.
    $freeTenant = Tenant::factory()->create();
    $freeUser = User::factory()->storeOwner($freeTenant)->create();
    $freeUser->givePermissionTo('manage-products');

    $freeResponse = $this->actingAs($freeUser)->get(route('products.export'));

    $freeResponse->assertRedirect();
    $freeResponse->assertSessionHas('error');

    // 2) Tenant premium → unduhan file excel (writer asli sangat boros memori,
    //    tidak boleh berjalan di dalam proses test — jadi di-fake).
    $resetTenant();

    Excel::fake();
    Excel::matchByRegex();

    $this->tenant->update([
        'subscription_tier' => 'premium',
        'subscription_expires_at' => now()->addDays(30),
    ]);

    Cache::forget("tenant.{$this->tenant->id}.is_premium");

    Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => Category::factory()->create(['tenant_id' => $this->tenant->id])->id,
        'name' => 'Kopi Susu',
        'barcode' => '8991234567890',
    ]);

    $response = $this->actingAs($this->user)->get(route('products.export'));

    $response->assertOk();
    Excel::assertDownloaded('/produk-\d{14}\.xlsx/', fn ($export) => $export instanceof ProductExport);
});
