<?php

namespace App\Ai\Tools;

use App\Models\Customer;
use App\Models\PointTransaction;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetPointSummaryTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil ringkasan poin pelanggan. Bisa lihat total poin, riwayat perolehan, dan penukaran poin. Filter berdasarkan ID pelanggan.';
    }

    public function handle(Request $request): Stringable|string
    {
        $customerId = $request['customer_id'] ?? null;

        if (! $customerId) {
            return 'Silakan berikan ID pelanggan yang ingin dicek poinnya.';
        }

        $customer = Customer::find($customerId);

        if (! $customer) {
            return 'Pelanggan dengan ID tersebut tidak ditemukan.';
        }

        $history = PointTransaction::where('customer_id', $customerId)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($pt) => [
                'tipe' => $pt->type === 'earn' ? 'Dapat' : 'Tukar',
                'poin' => $pt->points,
                'keterangan' => $pt->description ?? '-',
                'tanggal' => $pt->created_at->format('d M Y H:i'),
            ]);

        $totalEarned = PointTransaction::where('customer_id', $customerId)
            ->where('type', 'earn')->sum('points');
        $totalRedeemed = PointTransaction::where('customer_id', $customerId)
            ->where('type', 'redeem')->sum('points');

        return json_encode([
            'pelanggan' => $customer->name,
            'poin_saat_ini' => $customer->loyalty_points,
            'total_pernah_dapat' => $totalEarned,
            'total_pernah_tukar' => $totalRedeemed,
            'riwayat' => $history->toArray(),
        ], JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'customer_id' => $schema->integer()->nullable()->description('ID pelanggan yang ingin dilihat poinnya (dikosongkan untuk semua)'),
        ];
    }
}
