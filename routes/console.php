<?php

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

Schedule::command('audit-log:prune 6')->daily();
