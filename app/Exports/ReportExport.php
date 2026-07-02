<?php

namespace App\Exports;

use App\Models\Customer;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportExport implements WithMultipleSheets
{
    public function __construct(
        protected string $startDate,
        protected string $endDate,
    ) {}

    public function sheets(): array
    {
        $startDate = $this->startDate;
        $endDate = $this->endDate;

        // --- Data Queries ---

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

        $paymentMethods = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->selectRaw('
                COALESCE(payment_method_id, 0) as payment_method_id,
                COUNT(*) as transaction_count,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(AVG(total_amount), 0) as avg_transaction
            ')
            ->groupBy('payment_method_id')
            ->get()
            ->map(function ($item) {
                $pm = $item->payment_method_id
                    ? PaymentMethod::find($item->payment_method_id)
                    : null;

                return [
                    'method' => $pm?->name ?? 'Tanpa Metode',
                    'type' => $pm?->type ?? '-',
                    'count' => $item->transaction_count,
                    'revenue' => $item->total_revenue,
                    'avg' => $item->avg_transaction,
                ];
            });

        $orderTypes = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->selectRaw('
                order_type,
                COUNT(*) as transaction_count,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(AVG(total_amount), 0) as avg_transaction
            ')
            ->groupBy('order_type')
            ->get()
            ->mapWithKeys(fn ($item) => [$item->order_type => [
                'count' => $item->transaction_count,
                'revenue' => $item->total_revenue,
                'avg' => $item->avg_transaction,
            ]]);

        $categories = DB::table('transaction_details')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->selectRaw('
                categories.name as category_name,
                SUM(transaction_details.quantity) as total_qty,
                SUM(transaction_details.subtotal) as total_sales,
                COUNT(DISTINCT transaction_details.transaction_id) as transaction_count,
                COUNT(DISTINCT products.id) as product_count
            ')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_sales')
            ->get();

        $topProducts = DB::table('transaction_details')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->selectRaw('
                products.name,
                categories.name as category_name,
                COALESCE(AVG(transaction_details.price), 0) as avg_price,
                SUM(transaction_details.quantity) as total_qty,
                SUM(transaction_details.subtotal) as total_sales,
                COALESCE(products.stock, 0) as current_stock
            ')
            ->groupBy('products.id', 'products.name', 'categories.name', 'products.stock')
            ->orderByDesc('total_sales')
            ->limit(20)
            ->get();

        $lineItems = TransactionDetail::selectRaw('
                transaction_details.*,
                transactions.transaction_code,
                transactions.created_at as transaction_date,
                transactions.order_type,
                transactions.status
            ')
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->orderBy('transactions.created_at', 'desc')
            ->get();

        $transactions = Transaction::with(['details', 'user', 'customer', 'paymentMethod'])
            ->withCount('details as items_count')
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->latest()
            ->get();

        $shiftReports = Shift::with('user')
            ->withCount('transactions')
            ->withSum('transactions', 'total_amount')
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween(DB::raw('DATE(start_time)'), [$startDate, $endDate])
                    ->orWhereBetween(DB::raw('DATE(end_time)'), [$startDate, $endDate]);
            })
            ->orderBy('start_time', 'desc')
            ->get();

        $customers = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->whereNotNull('customer_id')
            ->selectRaw('
                customer_id,
                COUNT(*) as transaction_count,
                COALESCE(SUM(total_amount), 0) as total_spent,
                COALESCE(AVG(total_amount), 0) as avg_spent,
                COALESCE(MAX(total_amount), 0) as max_transaction
            ')
            ->groupBy('customer_id')
            ->get()
            ->map(function ($item) {
                $customer = Customer::find($item->customer_id);

                return [
                    'name' => $customer?->name ?? 'Dihapus',
                    'phone' => $customer?->phone ?? '-',
                    'email' => $customer?->email ?? '-',
                    'points' => $customer?->loyalty_points ?? 0,
                    'count' => $item->transaction_count,
                    'total_spent' => $item->total_spent,
                    'avg_spent' => $item->avg_spent,
                    'max_transaction' => $item->max_transaction,
                ];
            })
            ->sortByDesc('total_spent')
            ->values();

        $marketplaceOrders = Order::marketplace()
            ->whereIn('status', ['delivered', 'completed'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->with('items')
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn ($order) => [
                'order_number' => $order->order_number,
                'customer_name' => $order->recipient_name,
                'phone' => $order->customer_phone ?? '-',
                'items_count' => $order->items->count(),
                'subtotal' => (float) $order->subtotal,
                'shipping_cost' => (float) $order->shipping_cost,
                'total' => (float) $order->total,
                'status' => $order->status,
                'payment_method' => $order->payment_method ?? '-',
                'date' => $order->created_at,
            ]);

        $marketplaceSummary = Order::marketplace()
            ->whereIn('status', ['delivered', 'completed'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_orders,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(SUM(shipping_cost), 0) as total_shipping,
                COALESCE(SUM(subtotal), 0) as total_subtotal
            ')
            ->first();

        $ppobOrders = Order::ppob()
            ->where('status', 'success')
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn ($order) => [
                'order_number' => $order->order_number,
                'customer_name' => $order->ppob_customer_name ?? $order->recipient_name,
                'category' => $order->ppob_category ?? '-',
                'brand' => $order->ppob_brand ?? '-',
                'total' => (float) $order->total,
                'markup' => (float) ($order->ppob_markup ?? 0),
                'status' => $order->status,
                'date' => $order->created_at,
            ]);

        $ppobSummary = Order::ppob()
            ->where('status', 'success')
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_orders,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(SUM(ppob_markup), 0) as total_margin
            ')
            ->first();

        return [
            'Ringkasan' => new class($summary, $startDate, $endDate, $paymentMethods, $orderTypes, $marketplaceSummary, $ppobSummary) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(
                    protected $summary,
                    protected string $startDate,
                    protected string $endDate,
                    protected $paymentMethods,
                    protected $orderTypes,
                    protected $marketplaceSummary,
                    protected $ppobSummary,
                ) {}

                public function title(): string
                {
                    return 'Ringkasan';
                }

                public function headings(): array
                {
                    return ['Metrik', 'Nilai'];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true, 'size' => 12]],
                        'A1:B1' => ['fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    $rows = [
                        ['LAPORAN KEUANGAN', ''],
                        ['Periode', $this->startDate.' s/d '.$this->endDate],
                        ['', ''],
                        ['RINGKASAN UMUM', ''],
                        ['Total Transaksi', $this->summary->total_transactions],
                        ['Total Pendapatan (POS)', $this->summary->total_revenue],
                        ['Total Subtotal', $this->summary->total_subtotal],
                        ['Total Pajak', $this->summary->total_tax],
                        ['Total Diskon', $this->summary->total_discount],
                        ['Total Dibayar', $this->summary->total_paid],
                        ['Total Kembalian', $this->summary->total_change],
                        ['Rata-rata Transaksi', round($this->summary->avg_transaction, 2)],
                        ['', ''],
                        ['PENDAPATAN MARKETPLACE', ''],
                        ['Total Pesanan Marketplace', $this->marketplaceSummary->total_orders],
                        ['Pendapatan Marketplace', $this->marketplaceSummary->total_revenue],
                        ['Biaya Kirim', $this->marketplaceSummary->total_shipping],
                        ['', ''],
                        ['PENDAPATAN PPOB', ''],
                        ['Total Transaksi PPOB', $this->ppobSummary->total_orders],
                        ['Pendapatan PPOB', $this->ppobSummary->total_revenue],
                        ['Total Margin PPOB', $this->ppobSummary->total_margin],
                        ['', ''],
                        ['TOTAL PENDAPATAN', $this->summary->total_revenue + $this->marketplaceSummary->total_revenue + $this->ppobSummary->total_revenue],
                        ['', ''],
                    ];

                    $rows[] = ['RINCIAN PER METODE PEMBAYARAN', ''];
                    $rows[] = ['Metode', 'Total'];
                    foreach ($this->paymentMethods as $pm) {
                        $rows[] = [$pm['method'], $pm['revenue']];
                    }

                    $rows[] = ['', ''];
                    $rows[] = ['RINCIAN PER TIPE PESANAN', ''];
                    $rows[] = ['Tipe', 'Total'];
                    $labels = ['direct' => 'Direct (POS)', 'service' => 'Service', 'pre_order' => 'Pre-Order'];
                    foreach ($labels as $key => $label) {
                        $data = $this->orderTypes[$key] ?? null;
                        $rows[] = [$label, $data ? $data['revenue'] : 0];
                    }

                    return $rows;
                }
            },
            'Laporan Harian' => new class($dailyReport) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $dailyReport) {}

                public function title(): string
                {
                    return 'Laporan Harian';
                }

                public function headings(): array
                {
                    return ['Tanggal', 'Transaksi', 'Subtotal', 'Pajak', 'Diskon', 'Pendapatan', 'Dibayar'];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    return $this->dailyReport->map(fn ($d) => [
                        $d->date, $d->transactions_count, $d->subtotal,
                        $d->tax, $d->discount, $d->revenue, $d->paid,
                    ])->toArray();
                }
            },
            'Per Metode Pembayaran' => new class($paymentMethods) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $paymentMethods) {}

                public function title(): string
                {
                    return 'Per Metode Bayar';
                }

                public function headings(): array
                {
                    return ['Metode Pembayaran', 'Tipe', 'Jumlah Transaksi', 'Total Pendapatan', 'Rata-rata'];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    return $this->paymentMethods->map(fn ($pm) => [
                        $pm['method'], $pm['type'], $pm['count'], $pm['revenue'], round($pm['avg'], 2),
                    ])->toArray();
                }
            },
            'Per Tipe Pesanan' => new class($orderTypes, $startDate, $endDate) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(
                    protected $orderTypes,
                    protected string $startDate,
                    protected string $endDate,
                ) {}

                public function title(): string
                {
                    return 'Per Tipe Pesanan';
                }

                public function headings(): array
                {
                    return ['Tipe Pesanan', 'Jumlah Transaksi', 'Total Pendapatan', 'Rata-rata'];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    $labels = ['direct' => 'Direct (POS)', 'service' => 'Service', 'pre_order' => 'Pre-Order'];
                    $rows = [];

                    foreach ($labels as $key => $label) {
                        $data = $this->orderTypes[$key] ?? null;
                        $rows[] = [
                            $label,
                            $data['count'] ?? 0,
                            $data['revenue'] ?? 0,
                            round($data['avg'] ?? 0, 2),
                        ];
                    }

                    $total = collect($this->orderTypes);
                    $rows[] = ['', '', '', ''];
                    $rows[] = [
                        'TOTAL',
                        $total->sum('count'),
                        $total->sum('revenue'),
                        round($total->avg('avg') ?? 0, 2),
                    ];

                    return $rows;
                }
            },
            'Per Kategori' => new class($categories) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $categories) {}

                public function title(): string
                {
                    return 'Per Kategori';
                }

                public function headings(): array
                {
                    return ['Kategori', 'Qty Terjual', 'Total Penjualan', 'Jumlah Transaksi', 'Jumlah Produk'];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    return $this->categories->map(fn ($c) => [
                        $c->category_name, (int) $c->total_qty, $c->total_sales,
                        (int) $c->transaction_count, (int) $c->product_count,
                    ])->toArray();
                }
            },
            'Produk Terlaris' => new class($topProducts) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $topProducts) {}

                public function title(): string
                {
                    return 'Produk Terlaris';
                }

                public function headings(): array
                {
                    return ['Nama Produk', 'Kategori', 'Harga Rata-rata', 'Qty Terjual', 'Total Penjualan', 'Stok Saat Ini'];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    return $this->topProducts->map(fn ($p) => [
                        $p->name, $p->category_name, round($p->avg_price, 2),
                        (int) $p->total_qty, $p->total_sales, (int) $p->current_stock,
                    ])->toArray();
                }
            },
            'Detail Item Terjual' => new class($lineItems) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $lineItems) {}

                public function title(): string
                {
                    return 'Detail Item Terjual';
                }

                public function headings(): array
                {
                    return ['Kode Transaksi', 'Tanggal', 'Tipe', 'Nama Produk', 'Varian', 'Harga', 'Qty', 'Subtotal', 'Catatan'];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    $labels = ['direct' => 'POS', 'service' => 'Service', 'pre_order' => 'Pre-Order'];

                    return $this->lineItems->map(fn ($item) => [
                        $item->transaction_code,
                        $item->transaction_date,
                        $labels[$item->order_type] ?? $item->order_type,
                        $item->product_name,
                        $item->variant_name ?? '-',
                        (float) $item->price,
                        (int) $item->quantity,
                        (float) $item->subtotal,
                        $item->notes ?? '-',
                    ])->toArray();
                }
            },
            'Detail Transaksi' => new class($transactions) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $transactions) {}

                public function title(): string
                {
                    return 'Detail Transaksi';
                }

                public function headings(): array
                {
                    return [
                        'Kode', 'Tanggal', 'Kasir', 'Pelanggan', 'Tipe Pesanan',
                        'Metode Bayar', 'Jml Item', 'Subtotal', 'Diskon', 'Pajak',
                        'Total', 'Dibayar', 'Kembalian', 'Status',
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    $labels = ['direct' => 'POS', 'service' => 'Service', 'pre_order' => 'Pre-Order'];

                    return $this->transactions->map(fn ($t) => [
                        $t->transaction_code,
                        $t->created_at,
                        $t->user?->name ?? '-',
                        $t->customer?->name ?? '-',
                        $labels[$t->order_type] ?? $t->order_type,
                        $t->paymentMethod?->name ?? '-',
                        (int) $t->items_count,
                        (float) $t->subtotal_amount,
                        (float) $t->discount_amount,
                        (float) $t->tax_amount,
                        (float) $t->total_amount,
                        (float) $t->paid_amount,
                        (float) $t->change_amount,
                        ucfirst($t->status),
                    ])->toArray();
                }
            },
            'Shift Kasir' => new class($shiftReports) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $shiftReports) {}

                public function title(): string
                {
                    return 'Shift Kasir';
                }

                public function headings(): array
                {
                    return [
                        'Kasir', 'Buka', 'Tutup', 'Modal Awal', 'Expected Cash',
                        'Actual Cash', 'Selisih', 'Transaksi', 'Total Penjualan',
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    return $this->shiftReports->map(function ($shift) {
                        $sales = $shift->transactions_sum_total_amount ?? 0;
                        $expected = $shift->starting_cash + $sales;

                        return [
                            $shift->user?->name ?? 'Unknown',
                            $shift->start_time,
                            $shift->end_time ?? 'Belum ditutup',
                            (float) $shift->starting_cash,
                            (float) ($shift->expected_cash ?? $expected),
                            (float) ($shift->actual_cash ?? 0),
                            (float) (($shift->actual_cash ?? 0) - ($shift->expected_cash ?? $expected)),
                            (int) ($shift->transactions_count ?? 0),
                            (float) $sales,
                        ];
                    })->toArray();
                }
            },
            'Pelanggan' => new class($customers) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $customers) {}

                public function title(): string
                {
                    return 'Pelanggan';
                }

                public function headings(): array
                {
                    return [
                        'Nama Pelanggan', 'Telepon', 'Email', 'Poin Loyalty',
                        'Transaksi', 'Total Belanja', 'Rata-rata', 'Transaksi Tertinggi',
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    return $this->customers->map(fn ($c) => [
                        $c['name'], $c['phone'], $c['email'], $c['points'],
                        $c['count'], $c['total_spent'], round($c['avg_spent'], 2), $c['max_transaction'],
                    ])->toArray();
                }
            },
            'Marketplace' => new class($marketplaceOrders, $marketplaceSummary) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $marketplaceOrders, protected $marketplaceSummary) {}

                public function title(): string
                {
                    return 'Marketplace';
                }

                public function headings(): array
                {
                    return [
                        'No. Pesanan', 'Pelanggan', 'Telepon', 'Item',
                        'Subtotal', 'Ongkir', 'Total', 'Status', 'Pembayaran', 'Tanggal',
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    $rows = $this->marketplaceOrders->map(fn ($o) => [
                        $o['order_number'], $o['customer_name'], $o['phone'], $o['items_count'],
                        $o['subtotal'], $o['shipping_cost'], $o['total'],
                        ucfirst($o['status']), $o['payment_method'], $o['date'],
                    ])->toArray();

                    $rows[] = ['', '', '', '', '', '', '', '', '', ''];
                    $rows[] = [
                        'TOTAL', '', '', '',
                        $this->marketplaceSummary->total_subtotal,
                        $this->marketplaceSummary->total_shipping,
                        $this->marketplaceSummary->total_revenue,
                        '', '', '('.$this->marketplaceSummary->total_orders.' pesanan)',
                    ];

                    return $rows;
                }
            },
            'PPOB' => new class($ppobOrders, $ppobSummary) implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
            {
                public function __construct(protected $ppobOrders, protected $ppobSummary) {}

                public function title(): string
                {
                    return 'PPOB';
                }

                public function headings(): array
                {
                    return [
                        'No. Pesanan', 'Pelanggan', 'Kategori', 'Brand',
                        'Total', 'Margin', 'Status', 'Tanggal',
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    return [
                        1 => ['font' => ['bold' => true], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
                    ];
                }

                public function array(): array
                {
                    $rows = $this->ppobOrders->map(fn ($o) => [
                        $o['order_number'], $o['customer_name'], $o['category'], $o['brand'],
                        $o['total'], $o['markup'], ucfirst($o['status']), $o['date'],
                    ])->toArray();

                    $rows[] = ['', '', '', '', '', '', '', ''];
                    $rows[] = [
                        'TOTAL', '', '', '',
                        $this->ppobSummary->total_revenue,
                        $this->ppobSummary->total_margin,
                        '', '('.$this->ppobSummary->total_orders.' transaksi)',
                    ];

                    return $rows;
                }
            },
        ];
    }
}
