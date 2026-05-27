<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
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
    public function index(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->toDateString());

        $summary = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
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

        $dailyReport = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
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

        $topProducts = DB::table('transaction_details')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->selectRaw('
                products.name,
                SUM(transaction_details.quantity) as total_qty,
                SUM(transaction_details.subtotal) as total_sales
            ')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get();

        $transactions = Transaction::with(['details.product', 'user'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->latest()
            ->get();

        // Shift reconciliation within date range
        $shiftReports = Shift::with('user')
            ->withCount('transactions')
            ->withSum('transactions', 'total_amount')
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween(DB::raw('DATE(start_time)'), [$startDate, $endDate])
                    ->orWhereBetween(DB::raw('DATE(end_time)'), [$startDate, $endDate]);
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
                    'starting_cash' => (float) $shift->starting_cash,
                    'expected_cash' => (float) ($shift->expected_cash ?? $expected),
                    'actual_cash' => (float) ($shift->actual_cash ?? 0),
                    'transactions_count' => (int) ($shift->transactions_count ?? 0),
                    'total_sales' => (float) $sales,
                    'difference' => (float) (($shift->actual_cash ?? 0) - ($shift->expected_cash ?? $expected)),
                    'is_closed' => $shift->end_time !== null,
                ];
            });

        $shiftSummary = [
            'total_shifts' => $shiftReports->count(),
            'closed_shifts' => $shiftReports->where('is_closed', true)->count(),
            'total_expected' => $shiftReports->sum('expected_cash'),
            'total_actual' => $shiftReports->sum('actual_cash'),
            'total_difference' => $shiftReports->sum('difference'),
        ];

        $currentMonth = Transaction::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('total_amount');

        $previousMonth = Transaction::whereMonth('created_at', Carbon::now()->subMonth()->month)
            ->whereYear('created_at', Carbon::now()->subMonth()->year)
            ->sum('total_amount');

        $growthPercentage = $previousMonth > 0
            ? round((($currentMonth - $previousMonth) / $previousMonth) * 100, 1)
            : 0;

        return Inertia::render('reports/index', [
            'summary' => $summary,
            'dailyReport' => $dailyReport,
            'topProducts' => $topProducts,
            'transactions' => $transactions,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'growth' => [
                'current' => $currentMonth,
                'previous' => $previousMonth,
                'percentage' => $growthPercentage,
            ],
            'shiftReports' => $shiftReports,
            'shiftSummary' => $shiftSummary,
        ]);
    }

    public function exportPdf(Request $request)
    {
        Gate::authorize('export-reports');

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->toDateString());

        $summary = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
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

        $dailyReport = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
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

        $topProducts = DB::table('transaction_details')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->selectRaw('
                products.name,
                SUM(transaction_details.quantity) as total_qty,
                SUM(transaction_details.subtotal) as total_sales
            ')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get();

        $transactions = Transaction::with(['details.product', 'user'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
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

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->toDateString());

        return Excel::download(
            new ReportExport($startDate, $endDate),
            "laporan-keuangan-{$startDate}-{$endDate}.xlsx"
        );
    }
}
