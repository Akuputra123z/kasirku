<?php

// app/Ai/Tools/GetTopProductsTool.php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetTopProductsTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar produk terlaris berdasarkan jumlah penjualan. Bisa atur jumlah produk yang ditampilkan (limit).';
    }

    public function handle(Request $request): Stringable|string
    {
        $limit = min((int) ($request['limit'] ?? 5), 10);

        $topProducts = DB::table('transaction_details')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->selectRaw('products.name, SUM(transaction_details.quantity) as total_terjual, SUM(transaction_details.subtotal) as total_pendapatan')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_terjual')
            ->limit($limit)
            ->get()
            ->map(fn ($p) => [
                'nama' => $p->name,
                'total_terjual' => (int) $p->total_terjual.' pcs',
                'total_pendapatan' => 'Rp '.number_format($p->total_pendapatan, 0, ',', '.'),
            ]);

        if ($topProducts->isEmpty()) {
            return 'Belum ada data penjualan.';
        }

        return json_encode($topProducts->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'limit' => $schema->integer()
                ->nullable()
                ->min(1)
                ->description('Jumlah produk teratas yang ingin ditampilkan (maks 10, default 5)'),
        ];
    }
}
