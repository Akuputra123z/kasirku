<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\PrintConnectors\BluetoothPrintConnector;
use App\PrintConnectors\CupsPrintConnector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\Printer;

class PrintController extends Controller
{
    public function receipt(Request $request, Transaction $transaction): JsonResponse
    {
        Gate::authorize('manage-pos');

        $transaction->load('details', 'paymentMethod', 'user', 'customer');

        $driver = $request->input('driver', config('printing.driver'));

        if (! in_array($driver, ['usb', 'bluetooth', 'file', 'network', 'windows'])) {
            $driver = config('printing.driver');
        }

        $rateLimitKey = 'print:'.$request->user()?->id.':'.$transaction->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 1)) {
            return response()->json([
                'success' => false,
                'message' => 'Cetak sedang diproses. Tunggu sebentar.',
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 10);

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
                $fileConfig = config('printing.connectors.file');
                $filePath = $fileConfig['path'];

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

    private function buildAndPrint($connector, Transaction $transaction): void
    {
        $printer = new Printer($connector);

        $width = config('printing.receipt.width', 32);
        $tenant = tenant();

        if ($tenant) {
            $storeName = $tenant->name ?: config('printing.receipt.store_name', 'TOKO');
            $storeAddress = $tenant->address;
            $storePhone = $tenant->phone;
            $footer = $tenant->settings['receipt_footer'] ?? config('printing.receipt.footer', 'TERIMA KASIH');
        } else {
            $storeName = config('printing.receipt.store_name', 'TOKO');
            $storeAddress = config('printing.receipt.store_address', '');
            $storePhone = config('printing.receipt.store_phone', '');
            $footer = config('printing.receipt.footer', 'TERIMA KASIH');
        }

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text($storeName."\n");
        $printer->setEmphasis(false);
        if ($storeAddress) {
            $printer->text($storeAddress."\n");
        }
        if ($storePhone) {
            $printer->text('Telp: '.$storePhone."\n");
        }
        $printer->feed();

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text(str_repeat('-', $width)."\n");
        $printer->text('No. Resi: '.$transaction->transaction_code."\n");
        $printer->text(str_repeat('-', $width)."\n");
        $printer->feed();

        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text('Tanggal: '.$transaction->created_at->timezone('Asia/Jakarta')->format('d/m/Y H:i')."\n");
        $printer->text('Kasir: '.($transaction->user?->name ?? 'Admin')."\n");
        $printer->text('Tipe: '.$this->orderTypeLabel($transaction->order_type)."\n");
        if ($transaction->paymentMethod) {
            $printer->text('Bayar: '.$transaction->paymentMethod->name."\n");
        }
        if ($transaction->customer) {
            $printer->text('Pelanggan: '.$transaction->customer->name."\n");
        }
        $printer->feed();

        $printer->text(str_repeat('-', $width)."\n");
        $header = str_pad('Item', 14)
            .str_pad('Qty', 4, ' ', STR_PAD_LEFT)
            .str_pad('Total', 14, ' ', STR_PAD_LEFT);
        $printer->text($header."\n");
        $printer->text(str_repeat('-', $width)."\n");

        foreach ($transaction->details as $detail) {
            $name = $detail->product_name ?? $detail->product?->name ?? 'Product';
            $subtotal = number_format($detail->price * $detail->quantity, 0, ',', '.');

            $firstName = mb_substr($name, 0, 12);
            $restName = mb_substr($name, 12);

            $line = str_pad($firstName, 14)
                .str_pad((string) $detail->quantity, 4, ' ', STR_PAD_LEFT)
                .str_pad($subtotal, 14, ' ', STR_PAD_LEFT);
            $printer->text($line."\n");

            while (mb_strlen($restName) > 0) {
                $chunk = mb_substr($restName, 0, 12);
                $restName = mb_substr($restName, 12);
                $printer->text(str_repeat(' ', 2).$chunk."\n");
            }
        }

        $printer->text(str_repeat('-', $width)."\n");

        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $labelW = 12;
        $valueW = $width - $labelW;

        $line = fn (string $label, string $value) => str_pad($label, $labelW).str_pad($value, $valueW, ' ', STR_PAD_LEFT)."\n";

        $printer->text($line('Subtotal', number_format($transaction->subtotal_amount, 0, ',', '.')));
        if ($transaction->discount_amount > 0) {
            $printer->text($line('Diskon', '-'.number_format($transaction->discount_amount, 0, ',', '.')));
        }
        if ($transaction->tax_amount > 0) {
            $printer->text($line('Pajak', '+'.number_format($transaction->tax_amount, 0, ',', '.')));
        }
        $printer->text(str_repeat('=', $width)."\n");
        $printer->selectPrintMode(Printer::MODE_EMPHASIZED);
        $printer->text($line('Total', number_format($transaction->total_amount, 0, ',', '.')));
        $printer->selectPrintMode(0);
        $printer->text(str_repeat('=', $width)."\n");

        $printer->text($line('Tunai', number_format($transaction->paid_amount, 0, ',', '.')));
        $printer->text($line('Kembali', number_format($transaction->change_amount, 0, ',', '.')));
        $printer->feed(2);

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_EMPHASIZED);
        $printer->text($footer."\n");
        $printer->selectPrintMode(0);
        $printer->text('Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan'."\n");

        $printer->feed(3);
        $printer->cut();
        $printer->close();
    }

    public function test(): JsonResponse
    {
        try {
            $connector = $this->resolveConnector(config('printing.driver'));
            $printer = new Printer($connector);

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_EMPHASIZED);
            $printer->text("TEST PRINT\n");
            $printer->selectPrintMode(0);
            $printer->text("Jika Anda melihat ini, printer berfungsi.\n");
            $printer->feed(2);
            $printer->cut();
            $printer->close();

            return response()->json(['success' => true, 'message' => 'Test print successful']);
        } catch (\Exception $e) {
            Log::error('Test print failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json(['success' => false, 'message' => 'Test print failed: '.$e->getMessage()], 500);
        }
    }

    private function resolveConnector(string $driver)
    {
        $config = config('printing.connectors.'.$driver);

        if (! $config) {
            throw new \InvalidArgumentException("Print driver '{$driver}' is not configured");
        }

        if ($driver === 'file') {
            $filePath = $config['path'];
            if (! is_dir($filePath)) {
                mkdir($filePath, 0755, true);
            }

            return new FilePrintConnector($filePath.'/'.now()->timestamp.'_'.uniqid().'.bin');
        }

        return match ($driver) {
            'network' => new NetworkPrintConnector($config['host'], $config['port']),
            'windows' => new WindowsPrintConnector($config['printer']),
            'usb' => $this->resolveUsbConnector($config),
            'bluetooth' => $this->bluetoothConnector($config),
            default => throw new \InvalidArgumentException("Unknown print driver: {$driver}"),
        };
    }

    private function resolveUsbConnector(array $config): CupsPrintConnector|WindowsPrintConnector
    {
        $osFamily = PHP_OS_FAMILY;

        if ($osFamily === 'Windows') {
            Log::info('Using WindowsPrintConnector for USB driver (Windows detected)');

            return new WindowsPrintConnector($config['printer']);
        }

        Log::info('Using CupsPrintConnector for USB driver ('.($osFamily ?: 'Unix').' detected)');

        return new CupsPrintConnector($config['printer']);
    }

    private function bluetoothConnector(array $config): BluetoothPrintConnector
    {
        return new BluetoothPrintConnector(
            $config['device'],
            $config['mac'] ?? null,
        );
    }

    private function orderTypeLabel(?string $type): string
    {
        return match ($type) {
            'service' => 'Service',
            'pre_order' => 'Pre-Order',
            default => 'Direct',
        };
    }
}
