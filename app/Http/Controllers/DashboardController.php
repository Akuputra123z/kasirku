<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $tenantId = tenant_id();

        $data = Cache::remember("dashboard.{$tenantId}", 300, function () {
            $now = Carbon::now();

            $totalEarnings = Transaction::sum('total_amount');
            $totalSales = Transaction::count();
            $weeklySales = Transaction::where('created_at', '>=', $now->copy()->startOfWeek())
                ->sum('total_amount');
            $totalOrders = Transaction::where('created_at', '>=', $now->copy()->startOfMonth())
                ->count();

            $lastMonthRange = [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()];
            $thisMonthRange = [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];

            $lastMonthEarnings = Transaction::whereBetween('created_at', $lastMonthRange)
                ->sum('total_amount');
            $thisMonthEarnings = Transaction::whereBetween('created_at', $thisMonthRange)
                ->sum('total_amount');
            $earningsGrowth = $lastMonthEarnings > 0
                ? round((($thisMonthEarnings - $lastMonthEarnings) / $lastMonthEarnings) * 100)
                : null;

            $lastWeekSales = Transaction::whereBetween('created_at', [
                $now->copy()->subWeek()->startOfWeek(),
                $now->copy()->subWeek()->endOfWeek(),
            ])->sum('total_amount');
            $weeklyGrowth = $lastWeekSales > 0
                ? round((($weeklySales - $lastWeekSales) / $lastWeekSales) * 100)
                : null;

            $thisMonthSales = Transaction::whereBetween('created_at', $thisMonthRange)
                ->count();
            $lastMonthSales = Transaction::whereBetween('created_at', $lastMonthRange)
                ->count();
            $salesGrowth = $lastMonthSales > 0
                ? round((($thisMonthSales - $lastMonthSales) / $lastMonthSales) * 100)
                : null;

            $ordersGrowth = $salesGrowth;

            $recentSix = Transaction::where('created_at', '>=', $now->copy()->subMonths(6))->sum('total_amount');
            $priorSix = Transaction::whereBetween('created_at', [
                $now->copy()->subMonths(12),
                $now->copy()->subMonths(6),
            ])->sum('total_amount');
            $yearlyGrowth = $priorSix > 0
                ? round((($recentSix - $priorSix) / $priorSix) * 100)
                : null;

            $driver = DB::connection()->getDriverName();
            $yearExpr = $driver === 'sqlite' ? "strftime('%Y', created_at)" : 'YEAR(created_at)';
            $monthExpr = $driver === 'sqlite' ? "strftime('%m', created_at)" : 'MONTH(created_at)';

            $monthlyRows = Transaction::where('created_at', '>=', $now->copy()->subMonths(12)->startOfMonth())
                ->selectRaw("{$yearExpr} as year, {$monthExpr} as month, SUM(total_amount) as revenue, SUM(tax_amount) as tax, SUM(discount_amount) as discount")
                ->groupBy(DB::raw("{$yearExpr}, {$monthExpr}"))
                ->get()
                ->keyBy(fn ($row) => "{$row->year}-".(int) $row->month);

            $monthlyChart = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = $now->copy()->subMonths($i);
                $row = $monthlyRows->get("{$date->year}-{$date->month}");
                $revenue = $row?->revenue ?? 0;
                $tax = $row?->tax ?? 0;
                $discount = $row?->discount ?? 0;

                $monthlyChart[] = [
                    'month' => $date->format('M'),
                    'earning' => round($revenue / 1000000, 1),
                    'profit' => round(($revenue - $discount) / 1000000, 1),
                    'expense' => round(($tax + $discount) / 1000000, 1),
                ];
            }

            $totalSubtotal = Transaction::sum('subtotal_amount') ?: 1;
            $totalTax = Transaction::sum('tax_amount');
            $totalDiscount = Transaction::sum('discount_amount');

            $earningBreakdown = [
                ['category' => 'Revenue', 'value' => round((($totalSubtotal - $totalDiscount - $totalTax) / $totalSubtotal) * 100), 'fill' => 'var(--color-chart-1)'],
                ['category' => 'Tax', 'value' => round(($totalTax / $totalSubtotal) * 100), 'fill' => 'var(--color-chart-2)'],
                ['category' => 'Discount', 'value' => round(($totalDiscount / $totalSubtotal) * 100), 'fill' => 'var(--color-chart-3)'],
            ];

            $maxSales = DB::table('transaction_details')
                ->selectRaw('MAX(sub.total) as max_total')
                ->fromSub(
                    DB::table('transaction_details')
                        ->where('tenant_id', tenant_id())
                        ->selectRaw('SUM(subtotal) as total')
                        ->groupBy('product_id'),
                    'sub'
                )->value('max_total') ?: 1;

            $topProducts = DB::table('transaction_details')
                ->join('products', 'transaction_details.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('transaction_details.tenant_id', tenant_id())
                ->selectRaw('
                    products.name as product_name,
                    categories.name as category_name,
                    products.image,
                    SUM(transaction_details.quantity) as total_qty,
                    SUM(transaction_details.subtotal) as total_sales,
                    products.stock
                ')
                ->groupBy('products.id', 'products.name', 'categories.name', 'products.image', 'products.stock')
                ->orderByDesc('total_sales')
                ->limit(8)
                ->get()
                ->map(function ($p) use ($maxSales) {
                    return [
                        'product_name' => $p->product_name,
                        'category_name' => $p->category_name,
                        'image' => $p->image,
                        'total_qty' => (int) $p->total_qty,
                        'total_sales' => round((float) $p->total_sales, 2),
                        'stock' => (int) $p->stock,
                        'progress' => min(100, round(($p->total_sales / $maxSales) * 100)),
                    ];
                })
                ->values()
                ->toArray();

            $salesByCategory = DB::table('transaction_details')
                ->join('products', 'transaction_details.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('transaction_details.tenant_id', tenant_id())
                ->selectRaw('categories.name, SUM(transaction_details.subtotal) as total_sales, COUNT(DISTINCT transaction_details.transaction_id) as total_trx')
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc('total_sales')
                ->limit(5)
                ->get()
                ->map(fn ($row) => [
                    'name' => $row->name,
                    'total_sales' => round((float) $row->total_sales, 2),
                    'total_trx' => (int) $row->total_trx,
                ])
                ->values()
                ->toArray();

            return [
                'stats' => [
                    'totalEarnings' => round((float) $totalEarnings, 2),
                    'totalSales' => $totalSales,
                    'weeklySales' => round((float) $weeklySales, 2),
                    'totalOrders' => $totalOrders,
                    'earningsGrowth' => $earningsGrowth,
                    'weeklyGrowth' => $weeklyGrowth,
                    'salesGrowth' => $salesGrowth,
                    'ordersGrowth' => $ordersGrowth,
                    'yearlyGrowth' => $yearlyGrowth,
                ],
                'monthlyChart' => $monthlyChart,
                'earningBreakdown' => $earningBreakdown,
                'topProducts' => $topProducts,
                'salesByCategory' => $salesByCategory,
            ];
        });

        return Inertia::render('dashboard', $data);
    }
}
