<?php

// app/Ai/Tools/GetActiveShiftTool.php

namespace App\Ai\Tools;

use App\Models\Shift;
use App\Models\Transaction;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetActiveShiftTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil informasi shift kasir yang sedang aktif, termasuk total transaksi selama shift berlangsung.';
    }

    public function handle(Request $request): Stringable|string
    {
        $shift = Shift::with('user')
            ->whereNull('end_time')
            ->latest()
            ->first();

        if (! $shift) {
            return 'Tidak ada shift yang sedang aktif saat ini.';
        }

        $totalTransaksi = Transaction::where('shift_id', $shift->id)->count();
        $totalPendapatan = Transaction::where('shift_id', $shift->id)->sum('total_amount');

        return json_encode([
            'kasir' => $shift->user?->name ?? 'Unknown',
            'mulai_shift' => $shift->start_time,
            'modal_awal' => 'Rp '.number_format($shift->starting_cash, 0, ',', '.'),
            'total_transaksi' => $totalTransaksi,
            'total_pendapatan' => 'Rp '.number_format($totalPendapatan, 0, ',', '.'),
            'status' => 'Aktif',
        ], JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
