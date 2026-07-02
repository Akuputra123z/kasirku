<?php

use App\Actions\Subscription\CheckExpiredSubscriptions;
use App\Actions\Subscription\SendRenewalReminders;
use App\Jobs\SyncDigiflazzPrices;
use App\Models\AuditLog;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('audit-log:prune {months=6}', function (int $months) {
    $cutoff = now()->subMonths($months);
    $deleted = AuditLog::where('created_at', '<', $cutoff)->delete();
    $this->info("Deleted {$deleted} audit log(s) older than {$months} months.");
})->purpose('Delete audit logs older than N months');

Artisan::command('digiflazz:sync', function () {
    $this->info('Syncing Digiflazz price list...');
    dispatch_sync(new SyncDigiflazzPrices);
    $this->info('Sync completed!');
})->purpose('Sync PPOB product prices from Digiflazz');

Schedule::command('audit-log:prune 6')->daily();
Schedule::job(new SyncDigiflazzPrices)->hourly();

Schedule::call(new CheckExpiredSubscriptions)->hourly();
Schedule::call(new SendRenewalReminders)->dailyAt('08:00');
