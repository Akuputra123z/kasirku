<?php

namespace App\Ai\Tools;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetProductSalesTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil data penjualan untuk produk tertentu. Bisa cari berdasarkan nama produk dan filter periode: today, week, month, all, atau range tanggal custom. Menampilkan total terjual, pendapatan, stok, dan rincian penjualan per tanggal. Cocok untuk menjawab tanggal berapa penjualan tertinggi.';
    }

    public function handle(Request $request): Stringable|string
    {
        $productName = $request['product_name'] ?? '';

        if (empty(trim($productName))) {
            return 'Silakan sebutkan nama produk yang ingin dicek.';
        }

        $period = $request['period'] ?? 'all';
        $startDate = $request['start_date'] ?? null;
        $endDate = $request['end_date'] ?? null;

        $products = Product::with('category')->where('name', 'like', '%'.$productName.'%')->get();

        if ($products->isEmpty()) {
            return "Produk dengan nama \"{$productName}\" tidak ditemukan.";
        }

        $results = [];

        foreach ($products as $product) {
            $baseQuery = DB::table('transaction_details')
                ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
                ->where('transaction_details.product_id', $product->id);

            if ($startDate && $endDate) {
                $baseQuery->whereBetween('transactions.created_at', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay(),
                ]);
            } else {
                match ($period) {
                    'today' => $baseQuery->whereDate('transactions.created_at', Carbon::today()),
                    'week' => $baseQuery->whereBetween('transactions.created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]),
                    'month' => $baseQuery->whereMonth('transactions.created_at', Carbon::now()->month)->whereYear('transactions.created_at', Carbon::now()->year),
                    default => null,
                };
            }

            $stats = (clone $baseQuery)->selectRaw(
                'COALESCE(SUM(quantity), 0) as total_terjual, COALESCE(SUM(subtotal), 0) as total_pendapatan'
            )->first();

            $daily = (clone $baseQuery)
                ->selectRaw('DATE(transactions.created_at) as tanggal, SUM(transaction_details.quantity) as terjual')
                ->groupBy('tanggal')
                ->orderBy('tanggal')
                ->get()
                ->map(fn ($d) => [
                    'tanggal' => Carbon::parse($d->tanggal)->format('d M Y'),
                    'terjual' => (int) $d->terjual.' pcs',
                ]);

            $result = [
                'nama' => $product->name,
                'kategori' => $product->category->name ?? '-',
                'stok_saat_ini' => $product->stock.' pcs',
                'total_terjual' => (int) $stats->total_terjual.' pcs',
                'total_pendapatan' => 'Rp '.number_format($stats->total_pendapatan, 0, ',', '.'),
            ];

            if ($daily->isNotEmpty()) {
                $result['penjualan_per_tanggal'] = $daily->toArray();
            }

            $results[] = $result;
        }

        return json_encode($results, JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'product_name' => $schema->string()->nullable()->description('Nama produk yang ingin dicek penjualannya'),
            'period' => $schema->string()->nullable()->enum(['today', 'week', 'month', 'all'])->description('Periode: today, week, month, atau all (default: all)'),
            'start_date' => $schema->string()->nullable()->description('Filter tanggal mulai (format: YYYY-MM-DD) — jika diisi, period diabaikan'),
            'end_date' => $schema->string()->nullable()->description('Filter tanggal akhir (format: YYYY-MM-DD)'),
        ];
    }
}
