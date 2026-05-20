<?php

// app/Ai/Tools/GetTransactionSummaryTool.php

namespace App\Ai\Tools;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetTransactionSummaryTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil ringkasan transaksi dan pendapatan. Bisa filter berdasarkan periode: today (hari ini), week (minggu ini), month (bulan ini).';
    }

    public function handle(Request $request): Stringable|string
    {
        $period = $request['period'] ?? 'today';

        $query = Transaction::query();

        match ($period) {
            'today' => $query->whereDate('created_at', Carbon::today()),
            'week' => $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]),
            'month' => $query->whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year),
            default => $query->whereDate('created_at', Carbon::today()),
        };

        $summary = $query->selectRaw('
            COUNT(*) as total_transaksi,
            COALESCE(SUM(total_amount), 0) as total_pendapatan,
            COALESCE(AVG(total_amount), 0) as rata_rata_transaksi,
            COALESCE(SUM(discount_amount), 0) as total_diskon
        ')->first();

        $label = match ($period) {
            'today' => 'Hari Ini',
            'week' => 'Minggu Ini',
            'month' => 'Bulan Ini',
            default => 'Hari Ini',
        };

        return json_encode([
            'periode' => $label,
            'total_transaksi' => (int) $summary->total_transaksi,
            'total_pendapatan' => 'Rp '.number_format($summary->total_pendapatan, 0, ',', '.'),
            'rata_rata' => 'Rp '.number_format($summary->rata_rata_transaksi, 0, ',', '.'),
            'total_diskon' => 'Rp '.number_format($summary->total_diskon, 0, ',', '.'),
        ], JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'period' => $schema->string()
                ->nullable()
                ->enum(['today', 'week', 'month'])
                ->description('Periode laporan: today, week, atau month'),
        ];
    }
}
