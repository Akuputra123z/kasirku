<?php

namespace App\PrintConnectors;

use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\PrintConnector;

class CupsPrintConnector implements PrintConnector
{
    private string $buffer = '';

    public function __construct(
        private string $printerName,
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

        $this->preparePrinter();

        $tmpFile = tempnam(sys_get_temp_dir(), 'receipt_').'.bin';
        file_put_contents($tmpFile, $this->buffer);

        $activePrinter = $this->resolveActivePrinter();

        try {
            $cmd = sprintf(
                'lp -d %s -o raw %s 2>/dev/null',
                escapeshellarg($activePrinter),
                escapeshellarg($tmpFile),
            );

            exec($cmd, $output, $exitCode);

            if ($exitCode !== 0) {
                throw new \Exception("CUPS lp command failed with exit code {$exitCode}");
            }

            usleep(1_000_000);

            Log::info('Receipt sent via CUPS', [
                'printer' => $activePrinter,
                'size' => strlen($this->buffer),
            ]);
        } finally {
            @unlink($tmpFile);
        }
    }

    private function resolveActivePrinter(): string
    {
        exec('lpstat -p '.escapeshellarg($this->printerName).' 2>/dev/null', $out, $code);

        if ($code === 0 && ! empty($out)) {
            return $this->printerName;
        }

        $output = shell_exec('lpstat -p 2>/dev/null | grep -E "^printer " | head -5');
        if ($output) {
            preg_match('/^printer (\S+)/m', $output, $m);
            if (! empty($m[1])) {
                Log::info("CUPS printer {$this->printerName} not found, falling back to {$m[1]}");

                return $m[1];
            }
        }

        return $this->printerName;
    }

    private function preparePrinter(): void
    {
        exec('cancel -a '.escapeshellarg($this->printerName).' 2>/dev/null');
        usleep(200_000);

        exec('cupsenable '.escapeshellarg($this->printerName).' 2>/dev/null');
        usleep(500_000);
    }

    public function __destruct() {}
}
