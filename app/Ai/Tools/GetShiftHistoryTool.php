<?php

namespace App\Ai\Tools;

use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetShiftHistoryTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil riwayat shift kasir. Bisa filter berdasarkan tanggal, kasir, atau status (aktif/selesai).';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = Shift::with('user');

        if (! empty($request['date'])) {
            $query->whereDate('start_time', Carbon::parse($request['date']));
        }

        if (! empty($request['user_id'])) {
            $query->where('user_id', $request['user_id']);
        }

        if (! empty($request['status'])) {
            if ($request['status'] === 'aktif') {
                $query->whereNull('end_time');
            } elseif ($request['status'] === 'selesai') {
                $query->whereNotNull('end_time');
            }
        }

        $shifts = $query->latest()->limit(20)->get()->map(fn ($s) => [
            'id' => $s->id,
            'kasir' => $s->user?->name ?? '-',
            'mulai' => $s->start_time->format('d M Y H:i'),
            'selesai' => $s->end_time?->format('d M Y H:i') ?? 'Sedang berjalan',
            'modal_awal' => 'Rp '.number_format($s->starting_cash, 0, ',', '.'),
            'total_ekspektasi' => $s->expected_cash ? 'Rp '.number_format($s->expected_cash, 0, ',', '.') : '-',
            'total_aktual' => $s->actual_cash ? 'Rp '.number_format($s->actual_cash, 0, ',', '.') : '-',
            'status' => $s->end_time ? 'Selesai' : 'Aktif',
        ]);

        if ($shifts->isEmpty()) {
            return 'Tidak ada shift ditemukan.';
        }

        return json_encode($shifts->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'date' => $schema->string()->nullable()->description('Filter berdasarkan tanggal (format: YYYY-MM-DD)'),
            'user_id' => $schema->integer()->nullable()->description('Filter berdasarkan ID kasir'),
            'status' => $schema->string()->nullable()->enum(['aktif', 'selesai'])->description('Filter status shift'),
        ];
    }
}
