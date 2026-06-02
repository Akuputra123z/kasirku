<?php

namespace App\Traits;

use App\Models\Transaction;
use App\PrintConnectors\BluetoothPrintConnector;
use App\PrintConnectors\CupsPrintConnector;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\Printer;

trait ReceiptPrinter
{
    /**
     * Get printing config for a specific driver.
     */
    protected function getPrintConfig(string $driver): array
    {
        $tenant = tenant();
        if ($tenant && isset($tenant->settings['printing']['connectors'][$driver])) {
            return $tenant->settings['printing']['connectors'][$driver];
        }

        return config('printing.connectors.'.$driver) ?: [];
    }

    /**
     * Get default print driver.
     */
    protected function getDefaultDriver(): string
    {
        $tenant = tenant();
        if ($tenant && isset($tenant->settings['printing']['driver'])) {
            return $tenant->settings['printing']['driver'];
        }

        return config('printing.driver', 'file');
    }

    /**
     * Resolve print connector based on the driver.
     */
    protected function resolveConnector(string $driver)
    {
        $config = $this->getPrintConfig($driver);

        if ($driver === 'file') {
            $filePath = $config['path'] ?? storage_path('logs/receipts');
            if (! is_dir($filePath)) {
                mkdir($filePath, 0755, true);
            }

            return new FilePrintConnector($filePath.'/'.now()->timestamp.'_'.uniqid().'.bin');
        }

        return match ($driver) {
            'network' => new NetworkPrintConnector($config['host'] ?? '127.0.0.1', $config['port'] ?? 9100),
            'windows' => new WindowsPrintConnector($config['printer'] ?? ''),
            'usb' => $this->resolveUsbConnector($config),
            'bluetooth' => $this->bluetoothConnector($config),
            default => throw new \InvalidArgumentException("Unknown print driver: {$driver}"),
        };
    }

    /**
     * Resolve USB printer connector based on OS.
     */
    protected function resolveUsbConnector(array $config): CupsPrintConnector|WindowsPrintConnector
    {
        $osFamily = PHP_OS_FAMILY;

        if ($osFamily === 'Windows') {
            Log::info('Using WindowsPrintConnector for USB driver (Windows detected)');

            return new WindowsPrintConnector($config['printer'] ?? '');
        }

        Log::info('Using CupsPrintConnector for USB driver ('.($osFamily ?: 'Unix').' detected)');

        return new CupsPrintConnector($config['printer'] ?? '');
    }

    /**
     * Resolve Bluetooth connector.
     */
    protected function bluetoothConnector(array $config): BluetoothPrintConnector
    {
        return new BluetoothPrintConnector(
            $config['device'] ?? '',
            $config['mac'] ?? null,
        );
    }

    /**
     * Format and print the receipt.
     */
    protected function buildAndPrint($connector, Transaction $transaction): void
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

    /**
     * Map order type to label.
     */
    protected function orderTypeLabel(?string $type): string
    {
        return match ($type) {
            'service' => 'Service',
            'pre_order' => 'Pre-Order',
            default => 'Direct',
        };
    }
}
