<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Models\Order;
use App\Models\Shift;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    protected function dateRange(string $startDate, string $endDate): array
    {
        return [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay(),
        ];
    }

    /**
     * Bulatkan nilai uang ke 2 desimal sebelum dikirim ke frontend agar
     * drift float (0.1 + 0.2) tidak sampai ke antarmuka.
     */
    protected function roundMoney(mixed $value): float
    {
        return round((float) $value, 2);
    }

    protected function getPosSummary($startDate, $endDate)
    {
        return Transaction::whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                COUNT(*) as total_transactions,
                COALESCE(SUM(subtotal_amount), 0) as total_subtotal,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(discount_amount), 0) as total_discount,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(paid_amount), 0) as total_paid,
                COALESCE(SUM(change_amount), 0) as total_change,
                COALESCE(AVG(total_amount), 0) as avg_transaction
            ')
            ->first();
    }

    protected function getPosDaily($startDate, $endDate)
    {
        return Transaction::whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                DATE(created_at) as date,
                COUNT(*) as transactions_count,
                COALESCE(SUM(subtotal_amount), 0) as subtotal,
                COALESCE(SUM(tax_amount), 0) as tax,
                COALESCE(SUM(discount_amount), 0) as discount,
                COALESCE(SUM(total_amount), 0) as revenue,
                COALESCE(SUM(paid_amount), 0) as paid
            ')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get();
    }

    protected function getPosTopProducts($startDate, $endDate)
    {
        return DB::table('transaction_details')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->where('transactions.tenant_id', tenant_id())
            ->whereBetween('transactions.created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                products.name,
                SUM(transaction_details.quantity) as total_qty,
                SUM(transaction_details.subtotal) as total_sales
            ')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get();
    }

    protected function getMarketplaceSummary($startDate, $endDate)
    {
        return Order::marketplace()
            ->whereIn('status', ['delivered', 'completed'])
            ->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                COUNT(*) as total_orders,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(SUM(shipping_cost), 0) as total_shipping,
                COALESCE(SUM(subtotal), 0) as total_subtotal
            ')
            ->first();
    }

    protected function getMarketplaceDaily($startDate, $endDate)
    {
        return Order::marketplace()
            ->whereIn('status', ['delivered', 'completed'])
            ->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                DATE(created_at) as date,
                COUNT(*) as transactions_count,
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(SUM(shipping_cost), 0) as shipping_cost,
                COALESCE(SUM(total), 0) as revenue
            ')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get();
    }

    protected function getMarketplaceTopProducts($startDate, $endDate)
    {
        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.type', 'marketplace')
            ->whereIn('orders.status', ['delivered', 'completed'])
            ->where('orders.tenant_id', tenant_id())
            ->whereBetween('orders.created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                order_items.product_name as name,
                SUM(order_items.quantity) as total_qty,
                SUM(order_items.subtotal) as total_sales
            ')
            ->groupBy('order_items.product_name')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get();
    }

    protected function getMergedDaily($posDaily, $marketplaceDaily, $ppobDaily)
    {
        $merged = [];

        foreach ($posDaily as $d) {
            $merged[$d->date] = [
                'date' => $d->date,
                'pos_count' => (int) $d->transactions_count,
                'pos_revenue' => $this->roundMoney($d->revenue),
            ];
        }

        foreach ($marketplaceDaily as $d) {
            if (! isset($merged[$d->date])) {
                $merged[$d->date] = [
                    'date' => $d->date,
                    'pos_count' => 0,
                    'pos_revenue' => 0,
                ];
            }
            $merged[$d->date]['market_count'] = (int) $d->transactions_count;
            $merged[$d->date]['market_revenue'] = $this->roundMoney($d->revenue);
        }

        return collect($merged)->sortByDesc('date')->values();
    }

    protected function getMergedTopProducts($posProducts, $marketplaceProducts)
    {
        $merged = [];

        foreach ($posProducts as $p) {
            $merged[$p->name] = [
                'name' => $p->name,
                'total_qty' => (int) $p->total_qty,
                'total_sales' => $this->roundMoney($p->total_sales),
                'source' => 'kasir',
            ];
        }

        foreach ($marketplaceProducts as $p) {
            if (isset($merged[$p->name])) {
                $merged[$p->name]['total_qty'] += (int) $p->total_qty;
                $merged[$p->name]['total_sales'] = $this->roundMoney(
                    $merged[$p->name]['total_sales'] + $p->total_sales
                );
                $merged[$p->name]['source'] = 'gabungan';
            } else {
                $merged[$p->name] = [
                    'name' => $p->name,
                    'total_qty' => (int) $p->total_qty,
                    'total_sales' => $this->roundMoney($p->total_sales),
                    'source' => 'marketplace',
                ];
            }
        }

        return collect($merged)->sortByDesc('total_sales')->values()->take(10);
    }

    protected function getPpobSummary($startDate, $endDate)
    {
        return Order::ppob()
            ->where('status', 'success')
            ->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                COUNT(*) as total_orders,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(SUM(ppob_markup), 0) as total_margin
            ')
            ->first();
    }

    protected function getPpobDaily($startDate, $endDate)
    {
        return Order::ppob()
            ->where('status', 'success')
            ->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->selectRaw('
                DATE(created_at) as date,
                COUNT(*) as transactions_count,
                COALESCE(SUM(total), 0) as revenue,
                COALESCE(SUM(ppob_markup), 0) as margin
            ')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get();
    }

    protected function getMarketplaceOrders($startDate, $endDate)
    {
        return Order::marketplace()
            ->with(['items', 'user'])
            ->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->recipient_name,
                'customer_phone' => $order->customer_phone,
                'subtotal' => $this->roundMoney($order->subtotal),
                'shipping_cost' => $this->roundMoney($order->shipping_cost),
                'total' => $this->roundMoney($order->total),
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'created_at' => $order->created_at,
                'items_count' => $order->items->count(),
            ]);
    }

    protected function getPpobOrders($startDate, $endDate)
    {
        return Order::ppob()
            ->with(['user'])
            ->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->ppob_customer_name ?? $order->recipient_name,
                'category' => $order->ppob_category,
                'brand' => $order->ppob_brand,
                'total' => $this->roundMoney($order->total),
                'seller_price' => $this->roundMoney($order->ppob_seller_price ?? 0),
                'markup' => $this->roundMoney($order->ppob_markup ?? 0),
                'status' => $order->status,
                'digiflazz_status' => $order->digiflazz_status,
                'created_at' => $order->created_at,
            ]);
    }

    protected function getGrowth($startDate, $endDate)
    {
        $currentMonthStart = Carbon::parse($startDate)->startOfMonth();
        $currentMonthEnd = Carbon::parse($endDate)->endOfMonth();
        $prevMonthStart = $currentMonthStart->copy()->subMonth()->startOfMonth();
        $prevMonthEnd = $currentMonthEnd->copy()->subMonth()->endOfMonth();

        $currentPos = Transaction::whereBetween('created_at', $this->dateRange($currentMonthStart->toDateString(), $currentMonthEnd->toDateString()))
            ->sum('total_amount');

        $prevPos = Transaction::whereBetween('created_at', $this->dateRange($prevMonthStart->toDateString(), $prevMonthEnd->toDateString()))
            ->sum('total_amount');

        $currentMarket = Order::marketplace()->whereIn('status', ['delivered', 'completed'])->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($currentMonthStart->toDateString(), $currentMonthEnd->toDateString()))
            ->sum('total');

        $prevMarket = Order::marketplace()->whereIn('status', ['delivered', 'completed'])->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($prevMonthStart->toDateString(), $prevMonthEnd->toDateString()))
            ->sum('total');

        $currentPpob = Order::ppob()->where('status', 'success')->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($currentMonthStart->toDateString(), $currentMonthEnd->toDateString()))
            ->sum('total');

        $prevPpob = Order::ppob()->where('status', 'success')->tenantScoped()
            ->whereBetween('created_at', $this->dateRange($prevMonthStart->toDateString(), $prevMonthEnd->toDateString()))
            ->sum('total');

        $currentTotal = $currentPos + $currentMarket;
        $prevTotal = $prevPos + $prevMarket;

        $growthPercentage = $prevTotal > 0
            ? round((($currentTotal - $prevTotal) / $prevTotal) * 100, 1)
            : 0;

        return [
            'current' => $this->roundMoney($currentTotal),
            'previous' => $this->roundMoney($prevTotal),
            'percentage' => $growthPercentage,
            'pos_current' => $this->roundMoney($currentPos),
            'marketplace_current' => $this->roundMoney($currentMarket),
            'ppob_current' => $this->roundMoney($currentPpob),
        ];
    }

    public function index(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->toDateString());
        $activeTab = $request->get('tab', 'all');

        $summary = $this->getPosSummary($startDate, $endDate);
        $dailyReport = $this->getPosDaily($startDate, $endDate);
        $topProducts = $this->getPosTopProducts($startDate, $endDate);

        $transactions = Transaction::with(['details.product', 'user'])
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->latest()
            ->paginate(50)
            ->items();

        $shiftReports = Shift::with('user')
            ->withCount('transactions')
            ->withSum('transactions', 'total_amount')
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_time', $this->dateRange($startDate, $endDate))
                    ->orWhereBetween('end_time', $this->dateRange($startDate, $endDate));
            })
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(function ($shift) {
                $sales = $shift->transactions_sum_total_amount ?? 0;
                $expected = $shift->starting_cash + $sales;

                return [
                    'id' => $shift->id,
                    'user_name' => $shift->user?->name ?? 'Unknown',
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'starting_cash' => $this->roundMoney($shift->starting_cash),
                    'expected_cash' => $this->roundMoney($shift->expected_cash ?? $expected),
                    'actual_cash' => $this->roundMoney($shift->actual_cash ?? 0),
                    'transactions_count' => (int) ($shift->transactions_count ?? 0),
                    'total_sales' => $this->roundMoney($sales),
                    'difference' => $this->roundMoney(($shift->actual_cash ?? 0) - ($shift->expected_cash ?? $expected)),
                    'is_closed' => $shift->end_time !== null,
                ];
            });

        $shiftSummary = [
            'total_shifts' => $shiftReports->count(),
            'closed_shifts' => $shiftReports->where('is_closed', true)->count(),
            'total_expected' => $this->roundMoney($shiftReports->sum('expected_cash')),
            'total_actual' => $this->roundMoney($shiftReports->sum('actual_cash')),
            'total_difference' => $this->roundMoney($shiftReports->sum('difference')),
        ];

        // Marketplace
        $marketplaceSummary = $this->getMarketplaceSummary($startDate, $endDate);
        $marketplaceDaily = $this->getMarketplaceDaily($startDate, $endDate);
        $marketplaceTopProducts = $this->getMarketplaceTopProducts($startDate, $endDate);
        $marketplaceOrders = $this->getMarketplaceOrders($startDate, $endDate);

        // PPOB
        $ppobSummary = $this->getPpobSummary($startDate, $endDate);
        $ppobDaily = $this->getPpobDaily($startDate, $endDate);
        $ppobOrders = $this->getPpobOrders($startDate, $endDate);

        // Merged
        $mergedDaily = $this->getMergedDaily($dailyReport, $marketplaceDaily, $ppobDaily);
        $mergedTopProducts = $this->getMergedTopProducts($topProducts, $marketplaceTopProducts);

        $growth = $this->getGrowth($startDate, $endDate);

        $mergedSummary = [
            'total_revenue' => $this->roundMoney($summary->total_revenue + $marketplaceSummary->total_revenue),
            'total_pos' => $this->roundMoney($summary->total_revenue),
            'total_marketplace' => $this->roundMoney($marketplaceSummary->total_revenue),
            'total_ppob' => $this->roundMoney($ppobSummary->total_revenue),
            'total_transactions' => $summary->total_transactions + $marketplaceSummary->total_orders,
            'total_marketplace_orders' => $marketplaceSummary->total_orders,
            'total_ppob_orders' => $ppobSummary->total_orders,
            'total_pos_transactions' => $summary->total_transactions,
            'ppob_margin' => $this->roundMoney($ppobSummary->total_margin),
        ];

        return Inertia::render('reports/index', [
            'summary' => $summary,
            'dailyReport' => $dailyReport,
            'topProducts' => $topProducts,
            'transactions' => $transactions,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'growth' => $growth,
            'shiftReports' => $shiftReports,
            'shiftSummary' => $shiftSummary,
            'activeTab' => $activeTab,
            'mergedSummary' => $mergedSummary,
            'mergedDaily' => $mergedDaily,
            'mergedTopProducts' => $mergedTopProducts,
            'marketplaceSummary' => $marketplaceSummary,
            'marketplaceDaily' => $marketplaceDaily,
            'marketplaceTopProducts' => $marketplaceTopProducts,
            'marketplaceOrders' => $marketplaceOrders,
            'ppobSummary' => $ppobSummary,
            'ppobDaily' => $ppobDaily,
            'ppobOrders' => $ppobOrders,
        ]);
    }

    public function exportPdf(Request $request)
    {
        Gate::authorize('export-reports');

        $tenant = tenant();
        if ($tenant && ! $tenant->canExport()) {
            return redirect()->back()->with('error', 'Export laporan hanya tersedia di Premium. Upgrade sekarang!');
        }

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->toDateString());

        $summary = $this->getPosSummary($startDate, $endDate);
        $dailyReport = $this->getPosDaily($startDate, $endDate);
        $topProducts = $this->getPosTopProducts($startDate, $endDate);

        $transactions = Transaction::with(['details.product', 'user'])
            ->whereBetween('created_at', $this->dateRange($startDate, $endDate))
            ->latest()
            ->limit(500)
            ->get();

        $pdf = Pdf::loadView('exports.report-pdf', compact(
            'summary', 'dailyReport', 'topProducts', 'transactions', 'startDate', 'endDate'
        ));

        return $pdf->download("laporan-keuangan-{$startDate}-{$endDate}.pdf");
    }

    public function exportExcel(Request $request)
    {
        Gate::authorize('export-reports');

        $tenant = tenant();
        if ($tenant && ! $tenant->canExport()) {
            return redirect()->back()->with('error', 'Export laporan hanya tersedia di Premium. Upgrade sekarang!');
        }

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->toDateString());

        return Excel::download(
            new ReportExport($startDate, $endDate),
            "laporan-keuangan-{$startDate}-{$endDate}.xlsx"
        );
    }
}
