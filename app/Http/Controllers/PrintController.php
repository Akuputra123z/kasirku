<?php

namespace App\Http\Controllers;

use App\Jobs\PrintReceiptJob;
use App\Models\Transaction;
use App\Traits\ReceiptPrinter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;

class PrintController extends Controller
{
    use ReceiptPrinter;

    /**
     * Print transaction receipt.
     */
    public function receipt(Request $request, Transaction $transaction): JsonResponse
    {
        Gate::authorize('manage-pos');

        $transaction->load('details', 'paymentMethod', 'user', 'customer');

        $defaultDriver = $this->getDefaultDriver();
        $driver = $request->input('driver', $defaultDriver);

        if (! in_array($driver, ['usb', 'bluetooth', 'file', 'network', 'windows'])) {
            $driver = $defaultDriver;
        }

        $rateLimitKey = 'print:'.$request->user()?->id.':'.$transaction->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 1)) {
            return response()->json([
                'success' => false,
                'message' => 'Cetak sedang diproses. Tunggu sebentar.',
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 10);

        // In SaaS, to avoid blockages on physical/network printer connections,
        // we use a background queue for all drivers except 'file' (which is extremely fast and local-only).
        // A sync parameter can be passed (?sync=true) to force synchronous printing.
        $isSync = $driver === 'file' || $request->boolean('sync') || config('queue.default') === 'sync';

        if (! $isSync) {
            try {
                PrintReceiptJob::dispatch($transaction->id, $driver, tenant_id());

                $message = match ($driver) {
                    'bluetooth' => 'Cetak Bluetooth sedang diproses di latar belakang.',
                    'usb' => 'Cetak USB sedang diproses di latar belakang.',
                    'network' => 'Cetak Jaringan sedang diproses di latar belakang.',
                    'windows' => 'Cetak Windows sedang diproses di latar belakang.',
                    default => 'Cetak sedang diproses di latar belakang.',
                };

                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'driver' => $driver,
                    'queued' => true,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to dispatch print job, falling back to synchronous execution: '.$e->getMessage());
                // Fall through to synchronous execution if dispatch fails
            }
        }

        // Synchronous printing (for file driver or when forced/fallback)
        try {
            $connector = $this->resolveConnector($driver);
            $this->buildAndPrint($connector, $transaction);

            $message = match ($driver) {
                'bluetooth' => 'Struk dikirim ke printer Bluetooth. Jika tidak keluar, cek koneksi printer.',
                'usb' => 'Struk berhasil dicetak',
                'file' => 'Struk tersimpan. Jalankan ./send-receipt-to-printer.sh untuk mencetak.',
                default => 'Struk berhasil dicetak',
            };

            return response()->json(['success' => true, 'message' => $message, 'driver' => $driver]);
        } catch (\Exception $e) {
            Log::warning("Print via {$driver} failed, falling back to file", [
                'error' => $e->getMessage(),
                'transaction' => $transaction->id,
            ]);

            try {
                $fileConfig = $this->getPrintConfig('file');
                $filePath = $fileConfig['path'] ?? storage_path('logs/receipts');

                if (! is_dir($filePath)) {
                    mkdir($filePath, 0755, true);
                }

                $path = $filePath.'/'.now()->timestamp.'_'.uniqid().'.bin';
                $connector = new FilePrintConnector($path);
                $this->buildAndPrint($connector, $transaction);

                $fallbackMsg = match ($driver) {
                    'bluetooth' => 'Cetak Bluetooth gagal, struk tersimpan sebagai file. Cek Bluetooth printer lalu jalankan ./send-receipt-to-printer.sh',
                    'usb' => 'Cetak USB gagal, struk tersimpan sebagai file. Pastikan printer terdaftar dengan benar (CUPS di macOS/Linux, SMB share di Windows).',
                    default => 'Cetak gagal, struk tersimpan sebagai file.',
                };

                return response()->json([
                    'success' => true,
                    'message' => $fallbackMsg,
                    'driver' => 'file',
                    'file' => $path,
                ]);
            } catch (\Exception $fallbackException) {
                Log::error('Print and file fallback both failed', [
                    'print_error' => $e->getMessage(),
                    'file_error' => $fallbackException->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Cetak gagal (driver: '.$driver.'). Cek log untuk detail.',
                ], 500);
            }
        }
    }

    /**
     * Generate and return raw ESC/POS binary data as base64.
     * Frontend can fetch this and send directly to printer via WebUSB / Web Bluetooth.
     */
    public function raw(Request $request, Transaction $transaction): JsonResponse
    {
        Gate::authorize('manage-pos');

        $rateLimitKey = 'print-raw:'.$request->user()?->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak permintaan. Tunggu 30 detik.',
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 30);

        $transaction->load('details', 'paymentMethod', 'user', 'customer');

        $tempPath = tempnam(sys_get_temp_dir(), 'escpos_');

        try {
            $connector = new FilePrintConnector($tempPath);
            $this->buildAndPrint($connector, $transaction);

            $rawData = base64_encode(file_get_contents($tempPath));

            return response()->json([
                'success' => true,
                'data' => $rawData,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate raw ESC/POS data', [
                'error' => $e->getMessage(),
                'transaction' => $transaction->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal generate data struk: '.$e->getMessage(),
            ], 500);
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * Test printer functionality.
     */
    public function test(): JsonResponse
    {
        try {
            $driver = $this->getDefaultDriver();
            $connector = $this->resolveConnector($driver);
            $printer = new Printer($connector);

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_EMPHASIZED);
            $printer->text("TEST PRINT\n");
            $printer->selectPrintMode(0);
            $printer->text("Jika Anda melihat ini, printer berfungsi.\n");
            $printer->feed(2);
            $printer->cut();
            $printer->pulse();
            $printer->close();

            return response()->json(['success' => true, 'message' => 'Test print successful']);
        } catch (\Exception $e) {
            Log::error('Test print failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json(['success' => false, 'message' => 'Test print failed: '.$e->getMessage()], 500);
        }
    }
}
