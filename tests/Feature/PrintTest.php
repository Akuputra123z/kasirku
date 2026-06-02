<?php

use App\Jobs\PrintReceiptJob;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->tenant = Tenant::factory()->create();

    Permission::firstOrCreate(['name' => 'manage-pos', 'guard_name' => 'web']);

    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->user->givePermissionTo('manage-pos');

    $this->transaction = Transaction::create([
        'tenant_id' => $this->tenant->id,
        'transaction_code' => 'TRX-999',
        'subtotal_amount' => 100000,
        'tax_amount' => 10000,
        'discount_amount' => 0,
        'total_amount' => 110000,
        'paid_amount' => 120000,
        'change_amount' => 10000,
        'user_id' => $this->user->id,
        'status' => 'completed',
    ]);
});

test('user with manage-pos can print receipt synchronously with file driver', function () {
    $response = $this->actingAs($this->user)
        ->post(route('print.receipt', $this->transaction->id), [
            'driver' => 'file',
        ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'driver' => 'file',
    ]);
});

test('user with manage-pos dispatches PrintReceiptJob for physical/usb driver', function () {
    Queue::fake();
    config()->set('queue.default', 'database');

    $response = $this->actingAs($this->user)
        ->post(route('print.receipt', $this->transaction->id), [
            'driver' => 'usb',
        ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'driver' => 'usb',
        'queued' => true,
    ]);

    Queue::assertPushed(PrintReceiptJob::class, function ($job) {
        return $job->transactionId === $this->transaction->id && $job->driver === 'usb';
    });
});

test('tenant printer settings can be updated through store settings controller', function () {
    Permission::firstOrCreate(['name' => 'manage-tenants', 'guard_name' => 'web']);
    $this->user->givePermissionTo('manage-tenants');

    // Simulate switching/entering store session context
    session(['tenant_id' => $this->tenant->id]);

    $response = $this->actingAs($this->user)
        ->patch(route('settings.store.update'), [
            'name' => 'Toko Updated',
            'address' => 'Jalan Baru No. 1',
            'phone' => '08123456789',
            'print_driver' => 'bluetooth',
            'print_bluetooth_device' => '/dev/cu.RPP02N',
            'print_bluetooth_mac' => 'AA:BB:CC:DD:EE:FF',
            'receipt_footer' => 'THANK YOU',
        ]);

    $response->assertRedirect(route('settings.store'));

    $this->tenant->refresh();
    expect($this->tenant->name)->toBe('Toko Updated');
    expect($this->tenant->settings['printing']['driver'])->toBe('bluetooth');
    expect($this->tenant->settings['printing']['connectors']['bluetooth']['device'])->toBe('/dev/cu.RPP02N');
    expect($this->tenant->settings['printing']['connectors']['bluetooth']['mac'])->toBe('AA:BB:CC:DD:EE:FF');
});
