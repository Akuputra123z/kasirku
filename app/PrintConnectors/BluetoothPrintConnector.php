<?php

namespace App\PrintConnectors;

use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\PrintConnector;

class BluetoothPrintConnector implements PrintConnector
{
    private string $buffer = '';

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

        $filename = $receiptsDir.'/'.now()->timestamp.'.bin';
        file_put_contents($filename, $this->buffer);

        $scriptPath = base_path('send-receipt.py');

        $cmd = sprintf(
            'python3 %s %s',
            escapeshellarg($scriptPath),
            escapeshellarg($filename),
        );

        $output = [];
        $returnVar = 0;
        exec($cmd, $output, $returnVar);

        Log::info('Receipt sent via Python Bluetooth helper', [
            'file' => $filename,
            'size' => strlen($this->buffer),
            'return_code' => $returnVar,
        ]);
    }

    public function __destruct() {}
}
