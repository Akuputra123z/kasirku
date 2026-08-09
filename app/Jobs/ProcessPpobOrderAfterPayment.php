<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\DigiflazzService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessPpobOrderAfterPayment implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order)
    {
        //
    }

    public function handle(DigiflazzService $digiflazz): void
    {
        $mode = null;
        $refId = null;

        // Fase 1 (transaksi pendek): klaim order supaya job konkuren lain
        // tidak ikut topUp (mencegah double-credit ke penyedia).
        DB::transaction(function () use (&$mode, &$refId) {
            $order = Order::whereKey($this->order->id)->lockForUpdate()->first();

            if (! $order) {
                return;
            }

            // Re-run untuk order pending: cek status, JANGAN topUp ulang —
            // ref_id baru akan membuat transaksi baru di Digiflazz.
            if ($order->digiflazz_status === 'pending' && $order->digiflazz_ref_id) {
                $mode = 'check';
                $refId = $order->digiflazz_ref_id;

                return;
            }

            if ($order->digiflazz_status === 'processing') {
                return; // sudah diklaim job lain
            }

            if (! $order->isPendingDigiflazz()) {
                Log::warning('PPOB order not ready for processing', [
                    'order' => $order->order_number,
                    'payment_status' => $order->payment_status,
                    'digiflazz_status' => $order->digiflazz_status,
                ]);

                return;
            }

            $refId = $order->order_number.'-'.now()->timestamp;
            $mode = 'topup';

            $order->update([
                'digiflazz_ref_id' => $refId,
                'digiflazz_status' => 'processing',
                'digiflazz_message' => 'Memproses ke penyedia...',
            ]);
        });

        if (! $mode) {
            return;
        }

        // Fase 2 (di luar transaksi): panggil API penyedia.
        $result = $mode === 'check'
            ? $digiflazz->checkStatus($refId)
            : $digiflazz->topUp(
                customerNo: $this->order->customer_phone,
                buyerSkuCode: $this->order->ppob_buyer_sku_code,
                refId: $refId,
            );

        // Fase 3: simpan hasil.
        $order = Order::find($this->order->id);

        if (! $order) {
            return;
        }

        if (! $result) {
            $order->update([
                'digiflazz_status' => 'error',
                'digiflazz_message' => $mode === 'check'
                    ? 'Gagal memeriksa status transaksi'
                    : 'Gagal terhubung ke server Digiflazz',
            ]);

            Log::error('PPOB Digiflazz API call failed', [
                'order' => $order->order_number,
                'ref_id' => $refId,
                'mode' => $mode,
            ]);

            return;
        }

        $status = $result['status'] ?? 'Gagal';
        $rc = $result['rc'] ?? '99';
        $message = $result['message'] ?? 'Unknown';
        $sn = $result['sn'] ?? null;

        $digiflazzStatus = match (true) {
            $status === 'Sukses' && $rc === '00' => 'success',
            $status === 'Pending' || $rc === '17' => 'pending',
            default => 'failed',
        };

        $order->update([
            'digiflazz_status' => $digiflazzStatus,
            'digiflazz_message' => $message,
            'digiflazz_sn' => $sn,
            'status' => $digiflazzStatus === 'success' ? 'completed' : ($digiflazzStatus === 'pending' ? 'processing' : 'cancelled'),
        ]);

        Log::info('PPOB order processed', [
            'order' => $order->order_number,
            'ref_id' => $refId,
            'mode' => $mode,
            'status' => $digiflazzStatus,
            'message' => $message,
        ]);

        if ($digiflazzStatus === 'pending') {
            static::dispatch($order)->delay(now()->addMinutes(2));
        }
    }
}
