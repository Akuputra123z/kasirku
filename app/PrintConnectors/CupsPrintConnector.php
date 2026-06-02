<?php

namespace App\PrintConnectors;

use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\PrintConnector;
use Symfony\Component\Process\Process;

class CupsPrintConnector implements PrintConnector
{
    private string $buffer = '';

    private const TIMEOUT = 15;

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

        if (! $this->isCupsAvailable()) {
            throw new \RuntimeException(
                'CUPS (lp/lpstat) tidak tersedia di server ini. Gunakan driver "file" sebagai gantinya.'
            );
        }

        $activePrinter = $this->resolveActivePrinter();

        $this->preparePrinter($activePrinter);

        $tmpFile = tempnam(sys_get_temp_dir(), 'receipt_').'.bin';
        file_put_contents($tmpFile, $this->buffer);

        try {
            $process = new Process([
                'lp',
                '-d',
                $activePrinter,
                '-o',
                'raw',
                $tmpFile,
            ]);
            $process->setTimeout(self::TIMEOUT);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException(
                    'CUPS lp command failed: '.$process->getErrorOutput()
                );
            }

            usleep(500_000);

            Log::info('Receipt sent via CUPS', [
                'printer' => $activePrinter,
                'size' => strlen($this->buffer),
            ]);
        } catch (\Exception $e) {
            Log::error('CUPS print failed', [
                'printer' => $activePrinter,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            @unlink($tmpFile);
        }
    }

    private function isCupsAvailable(): bool
    {
        $process = new Process(['which', 'lp']);
        $process->setTimeout(5);
        $process->run();

        return $process->isSuccessful() && trim($process->getOutput()) !== '';
    }

    private function resolveActivePrinter(): string
    {
        $process = new Process(['lpstat', '-p', $this->printerName]);
        $process->setTimeout(5);
        $process->run();

        if ($process->isSuccessful() && trim($process->getOutput()) !== '') {
            return $this->printerName;
        }

        $listProcess = new Process(['sh', '-c', 'lpstat -p 2>/dev/null | grep -E "^printer " | head -5']);
        $listProcess->setTimeout(5);
        $listProcess->run();

        if ($listProcess->isSuccessful()) {
            $output = $listProcess->getOutput();
            if (preg_match('/^printer (\S+)/m', $output, $m)) {
                Log::info("CUPS printer {$this->printerName} not found, falling back to {$m[1]}");

                return $m[1];
            }
        }

        return $this->printerName;
    }

    private function preparePrinter(string $printer): void
    {
        // Do not blindly cancel all print jobs (cancel -a) as it deletes valid queued receipts
        // from other users/transactions. We only run cupsenable to ensure the printer is online.
        $enableProcess = new Process(['cupsenable', $printer]);
        $enableProcess->setTimeout(5);
        $enableProcess->run();

        usleep(200_000);
    }

    public function __destruct() {}
}
