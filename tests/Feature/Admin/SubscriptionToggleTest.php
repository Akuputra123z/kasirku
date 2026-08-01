<?php

use App\Models\AppSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Permission::create(['name' => 'manage-tenants', 'guard_name' => 'web']);

    $this->superAdmin = User::factory()->create();
    $this->superAdmin->givePermissionTo('manage-tenants');

    $this->tenant = Tenant::factory()->create();

    AppSetting::set('subscription_enabled', null);
});

test('super admin can disable the subscription feature globally', function () {
    $response = $this->actingAs($this->superAdmin)
        ->post(route('admin.subscription.toggle'), ['enabled' => false]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    expect((string) AppSetting::get('subscription_enabled'))->toBe('0');
    expect(app(SubscriptionService::class)->isEnabled())->toBeFalse();
    expect(app(SubscriptionService::class)->isPremium($this->tenant))->toBeTrue();
});

test('super admin can re-enable the subscription feature', function () {
    AppSetting::set('subscription_enabled', '0');

    $response = $this->actingAs($this->superAdmin)
        ->post(route('admin.subscription.toggle'), ['enabled' => true]);

    $response->assertSessionHasNoErrors();

    expect((string) AppSetting::get('subscription_enabled'))->toBe('1');
    expect(app(SubscriptionService::class)->isEnabled())->toBeTrue();
});

test('subscription service falls back to config when no runtime setting exists', function () {
    AppSetting::where('key', 'subscription_enabled')->delete();
    Cache::flush();

    expect(app(SubscriptionService::class)->isEnabled())
        ->toBe((bool) config('subscription.enabled'));
});

test('regular user cannot toggle the subscription feature', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('admin.subscription.toggle'), ['enabled' => false])
        ->assertForbidden();
});
