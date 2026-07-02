<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\DigiflazzService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
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
        if (! $this->order->isPendingDigiflazz()) {
            Log::warning('PPOB order not ready for processing', [
                'order' => $this->order->order_number,
                'payment_status' => $this->order->payment_status,
                'digiflazz_status' => $this->order->digiflazz_status,
            ]);

            return;
        }

        $refId = $this->order->order_number.'-'.now()->timestamp;
        $this->order->update(['digiflazz_ref_id' => $refId]);

        $result = $digiflazz->topUp(
            customerNo: $this->order->customer_phone,
            buyerSkuCode: $this->order->ppob_buyer_sku_code,
            refId: $refId
        );

        if (! $result) {
            $this->order->update([
                'digiflazz_status' => 'error',
                'digiflazz_message' => 'Gagal terhubung ke server Digiflazz',
            ]);

            Log::error('PPOB Digiflazz API call failed', [
                'order' => $this->order->order_number,
                'ref_id' => $refId,
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

        $this->order->update([
            'digiflazz_status' => $digiflazzStatus,
            'digiflazz_message' => $message,
            'digiflazz_sn' => $sn,
            'status' => $digiflazzStatus === 'success' ? 'completed' : ($digiflazzStatus === 'pending' ? 'processing' : 'cancelled'),
        ]);

        Log::info('PPOB order processed', [
            'order' => $this->order->order_number,
            'ref_id' => $refId,
            'status' => $digiflazzStatus,
            'message' => $message,
        ]);

        if ($digiflazzStatus === 'pending') {
            static::dispatch($this->order)->delay(now()->addMinutes(2));
        }
    }
}
