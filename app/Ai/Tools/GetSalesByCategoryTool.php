<?php

namespace App\Ai\Tools;

use App\Models\Category;
use App\Models\TransactionDetail;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetSalesByCategoryTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil ringkasan penjualan per kategori produk. Bisa filter berdasarkan periode: today, week, month, atau all.';
    }

    public function handle(Request $request): Stringable|string
    {
        $period = $request['period'] ?? 'today';

        $dateRange = match ($period) {
            'today' => [Carbon::today(), Carbon::today()->endOfDay()],
            'week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
            'all' => [Carbon::create(2000), Carbon::now()],
            default => [Carbon::today(), Carbon::today()->endOfDay()],
        };

        $categories = Category::all()->filter(function ($c) use ($dateRange) {
            $count = TransactionDetail::whereHas('product', fn ($q) => $q->where('category_id', $c->id))
                ->whereHas('transaction', fn ($q) => $q->whereBetween('created_at', $dateRange))
                ->sum('quantity');

            $c->sold_count = $count;

            return $count > 0;
        })->values();

        if ($categories->isEmpty()) {
            return 'Belum ada data penjualan untuk periode ini.';
        }

        $result = $categories->map(fn ($c) => [
            'kategori' => $c->name,
            'total_produk_terjual' => $c->sold_count.' pcs',
        ]);

        $label = match ($period) {
            'today' => 'Hari Ini',
            'week' => 'Minggu Ini',
            'month' => 'Bulan Ini',
            'all' => 'Semua Waktu',
            default => 'Hari Ini',
        };

        return json_encode([
            'periode' => $label,
            'data' => $result->toArray(),
        ], JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'period' => $schema->string()
                ->nullable()
                ->enum(['today', 'week', 'month', 'all'])
                ->description('Periode laporan: today, week, month, atau all'),
        ];
    }
}
