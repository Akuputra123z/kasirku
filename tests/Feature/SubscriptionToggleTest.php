<?php

use App\Actions\Subscription\CheckExpiredSubscriptions;
use App\Actions\Subscription\SendRenewalReminders;
use App\Events\SubscriptionExpired;
use App\Events\SubscriptionExpiring;
use App\Models\AppSetting;
use App\Models\Tenant;
use App\Services\SubscriptionService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    // Normalisasi: mulai dari mode langganan AKTIF (AppSetting + cache dibersihkan).
    AppSetting::set('subscription_enabled', '1');
    Cache::forget('app_setting.subscription_enabled');

    $this->service = app(SubscriptionService::class);
    $this->tenant = Tenant::factory()->create();
});

function setSubscriptionMode(bool $enabled): void
{
    AppSetting::set('subscription_enabled', $enabled ? '1' : '0');
    Cache::forget('app_setting.subscription_enabled');
}

it('mode nonaktif membuat semua tenant seolah premium', function () {
    setSubscriptionMode(false);

    expect($this->service->isEnabled())->toBeFalse();
    expect($this->service->isPremium($this->tenant))->toBeTrue();
    expect($this->service->maxProducts($this->tenant))->toBe(PHP_INT_MAX);
    expect($this->service->maxStaff($this->tenant))->toBe(PHP_INT_MAX);
    expect($this->service->canExport($this->tenant))->toBeTrue();
    expect($this->service->canMarketplace($this->tenant))->toBeTrue();
});

it('mode aktif membatasi tenant free sesuai paket', function () {
    setSubscriptionMode(true);

    expect($this->service->isEnabled())->toBeTrue();
    expect($this->service->isPremium($this->tenant))->toBeFalse();
    expect($this->service->maxProducts($this->tenant))->toBe((int) config('subscription.limits.products'));
    expect($this->service->canExport($this->tenant))->toBeFalse();
    expect($this->service->canMarketplace($this->tenant))->toBeFalse();
});

it('mode aktif mengakui tenant premium yang masih berlaku', function () {
    setSubscriptionMode(true);

    $this->tenant->update([
        'subscription_tier' => 'premium',
        'subscription_expires_at' => now()->addDays(30),
    ]);

    Cache::forget("tenant.{$this->tenant->id}.is_premium");

    expect($this->service->isPremium($this->tenant))->toBeTrue();
});

it('parsing konfigurasi .env memahami nilai false string', function () {
    // Tanpa baris AppSetting, isEnabled() jatuh ke config.
    AppSetting::where('key', 'subscription_enabled')->delete();
    Cache::forget('app_setting.subscription_enabled');

    config(['subscription.enabled' => 'false']);
    Cache::forget('app_setting.subscription_enabled');

    expect($this->service->isEnabled())->toBeFalse();

    config(['subscription.enabled' => 'true']);

    expect($this->service->isEnabled())->toBeTrue();
});

it('CheckExpiredSubscriptions tidak melakukan suspend saat mode nonaktif', function () {
    Event::fake([SubscriptionExpired::class]);

    setSubscriptionMode(false);

    $this->tenant->update([
        'subscription_tier' => 'premium',
        'subscription_expires_at' => now()->subDays(30),
        'subscription_status' => 'active',
    ]);

    (new CheckExpiredSubscriptions)();

    $this->tenant->refresh();
    expect($this->tenant->subscription_tier)->toBe('premium');
    expect($this->tenant->subscription_status)->toBe('active');
});

it('CheckExpiredSubscriptions tetap suspend saat mode aktif', function () {
    setSubscriptionMode(true);

    $this->tenant->update([
        'subscription_tier' => 'premium',
        'subscription_expires_at' => now()->subDays(30),
        'subscription_status' => 'active',
    ]);

    (new CheckExpiredSubscriptions)();

    $this->tenant->refresh();
    expect($this->tenant->subscription_tier)->toBe('free');
    expect($this->tenant->subscription_status)->toBe('suspended');
});

it('SendRenewalReminders tidak mengirim saat mode nonaktif', function () {
    Event::fake([SubscriptionExpiring::class]);

    setSubscriptionMode(false);

    $this->tenant->update([
        'subscription_tier' => 'premium',
        'subscription_status' => 'active',
        'subscription_expires_at' => now()->addDays(7),
    ]);

    (new SendRenewalReminders)();

    Event::assertNotDispatched(SubscriptionExpiring::class);
});

it('SendRenewalReminders mengirim pengingat saat mode aktif', function () {
    Event::fake([SubscriptionExpiring::class]);

    setSubscriptionMode(true);

    $this->tenant->update([
        'subscription_tier' => 'premium',
        'subscription_status' => 'active',
        'subscription_expires_at' => now()->addDays(7),
    ]);

    (new SendRenewalReminders)();

    Event::assertDispatched(SubscriptionExpiring::class);
});
