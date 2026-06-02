<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Models\Transaction;
use App\Traits\ReceiptPrinter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;

class PrintReceiptJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, ReceiptPrinter, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 5;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $transactionId,
        public string $driver,
        public ?int $tenantId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // 1. Initialize Tenancy Context
        if ($this->tenantId) {
            $tenant = Tenant::find($this->tenantId);
            if ($tenant) {
                app()->instance('current.tenant', $tenant);
                config()->set('permission.cache.key', 'spatie.permission.cache.'.$tenant->id);
            }
        }

        // 2. Fetch Transaction with Relationships
        $transaction = Transaction::with(['details', 'paymentMethod', 'user', 'customer'])
            ->find($this->transactionId);

        if (! $transaction) {
            Log::error("PrintReceiptJob failed: Transaction {$this->transactionId} not found.");

            return;
        }

        Log::info("PrintReceiptJob started: Transaction {$transaction->transaction_code} printing using {$this->driver} driver.");

        // 3. Resolve Connector and Print
        try {
            $connector = $this->resolveConnector($this->driver);
            $this->buildAndPrint($connector, $transaction);
            Log::info("PrintReceiptJob success: Transaction {$transaction->transaction_code} printed using {$this->driver} driver.");
        } catch (\Exception $e) {
            Log::warning("PrintReceiptJob failed for {$this->driver}, falling back to file driver. Error: ".$e->getMessage());

            // Fallback to file print
            try {
                $fileConfig = $this->getPrintConfig('file');
                $filePath = $fileConfig['path'] ?? storage_path('logs/receipts');

                if (! is_dir($filePath)) {
                    mkdir($filePath, 0755, true);
                }

                $fallbackPath = $filePath.'/'.now()->timestamp.'_'.uniqid().'.bin';
                $connector = new FilePrintConnector($fallbackPath);

                $this->buildAndPrint($connector, $transaction);
                Log::info("PrintReceiptJob fallback success: Saved to file {$fallbackPath}");
            } catch (\Exception $fallbackException) {
                Log::error('PrintReceiptJob critical: Fallback printing failed too.', [
                    'original_error' => $e->getMessage(),
                    'fallback_error' => $fallbackException->getMessage(),
                ]);
                throw $fallbackException; // rethrow to fail the job and trigger retry
            }
        }
    }
}
