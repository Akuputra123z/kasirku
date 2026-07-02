<?php

namespace App\Jobs;

use App\Services\DigiflazzService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncDigiflazzPrices implements ShouldQueue
{
    use Queueable;

    public function handle(DigiflazzService $digiflazz): void
    {
        Log::info('Starting Digiflazz price sync');

        $result = $digiflazz->syncPriceList();

        Log::info('Digiflazz price sync completed', $result);
    }
}
