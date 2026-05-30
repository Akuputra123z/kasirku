<?php

namespace App\PrintConnectors;

use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\PrintConnector;
use Symfony\Component\Process\Process;

class BluetoothPrintConnector implements PrintConnector
{
    private string $buffer = '';

    private const TIMEOUT = 30;

    private const LOCK_FILE = '/tmp/rpp02n_print.lock';

    public function __construct(
        private string $device,
        private ?string $mac = null,
    ) {}

    public function write($data): void
    {
        $this->buffer .= $data;
    }

    public function read($len): string
    {
        return '';
    }

    public function finalize(): void
    {
        if ($this->buffer === '') {
            return;
        }

        $receiptsDir = storage_path('logs/receipts');
        if (! is_dir($receiptsDir)) {
            mkdir($receiptsDir, 0755, true);
        }

        $filename = $receiptsDir.'/'.now()->timestamp.'_'.uniqid().'.bin';
        file_put_contents($filename, $this->buffer);

        $scriptPath = base_path('send-receipt.py');

        if (! file_exists($scriptPath)) {
            Log::warning('Bluetooth send script not found, receipt saved to file', [
                'file' => $filename,
                'size' => strlen($this->buffer),
            ]);

            return;
        }

        $process = new Process([
            'python3',
            $scriptPath,
            $filename,
        ]);
        $process->setTimeout(self::TIMEOUT);
        $process->setEnv([
            'PRINT_DEVICE' => $this->device,
            'PRINT_LOCK_FILE' => self::LOCK_FILE,
        ]);

        try {
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException(
                    'Python script failed: '.$process->getErrorOutput()
                );
            }

            Log::info('Receipt sent via Bluetooth Python helper', [
                'file' => $filename,
                'size' => strlen($this->buffer),
                'exit_code' => $process->getExitCode(),
                'output' => $process->getOutput(),
            ]);
        } catch (\Exception $e) {
            Log::error('Bluetooth print failed, receipt saved to file', [
                'file' => $filename,
                'error' => $e->getMessage(),
                'device' => $this->device,
            ]);

            throw new \RuntimeException(
                'Cetak Bluetooth gagal. Struk tersimpan sebagai file. '.$e->getMessage()
            );
        }
    }

    public function __destruct() {}
}
