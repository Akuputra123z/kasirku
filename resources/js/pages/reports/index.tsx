'use client';

import { Head, router, usePage } from '@inertiajs/react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Receipt,
    Printer,
    Calendar,
    Search,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    FileSpreadsheet,
    Users,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface Summary {
    total_transactions: number;
    total_subtotal: number;
    total_tax: number;
    total_discount: number;
    total_revenue: number;
    total_paid: number;
    total_change: number;
    avg_transaction: number;
}

interface DailyReport {
    date: string;
    transactions_count: number;
    subtotal: number;
    tax: number;
    discount: number;
    revenue: number;
    paid: number;
}

interface TopProduct {
    name: string;
    total_qty: number;
    total_sales: number;
}

interface Transaction {
    id: number;
    transaction_code: string;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    paid_amount: number;
    change_amount: number;
    created_at: string;
    user: { name: string };
    details: {
        product: { name: string };
        quantity: number;
        price: number;
        subtotal: number;
    }[];
}

interface ShiftReport {
    id: number;
    user_name: string;
    start_time: string;
    end_time: string | null;
    starting_cash: number;
    expected_cash: number;
    actual_cash: number;
    transactions_count: number;
    total_sales: number;
    difference: number;
    is_closed: boolean;
}

interface ShiftSummary {
    total_shifts: number;
    closed_shifts: number;
    total_expected: number;
    total_actual: number;
    total_difference: number;
}

interface Props {
    summary: Summary;
    dailyReport: DailyReport[];
    topProducts: TopProduct[];
    transactions: Transaction[];
    filters: { start_date: string; end_date: string };
    growth: { current: number; previous: number; percentage: number };
    shiftReports: ShiftReport[];
    shiftSummary: ShiftSummary;
}

export default function Reports({
    summary,
    dailyReport,
    topProducts,
    transactions,
    filters,
    growth,
    shiftReports,
    shiftSummary,
}: Props) {
    const auth = usePage().props.auth as { permissions?: string[] } | undefined;
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const printRef = useRef<HTMLDivElement>(null);
    const canExport = auth?.permissions?.includes('export-reports');

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Laporan_Keuangan_${startDate}_${endDate}`,
    });

    const applyFilter = () => {
        router.get(
            '/reports',
            { start_date: startDate, end_date: endDate },
            { preserveState: true },
        );
    };

    const fmt = (val: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const summaryCards = [
        {
            label: 'Total Pendapatan',
            value: fmt(summary.total_revenue),
            icon: DollarSign,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
        },
        {
            label: 'Jumlah Transaksi',
            value: summary.total_transactions.toString(),
            icon: ShoppingCart,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
        },
        {
            label: 'Rata-rata Transaksi',
            value: fmt(summary.avg_transaction),
            icon: BarChart3,
            color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
        },
        {
            label: 'Total Pajak',
            value: fmt(summary.total_tax),
            icon: Receipt,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
        },
    ];

    return (
        <div className="font-geist min-h-screen space-y-6 bg-white p-4 text-neutral-900 md:p-8 dark:bg-neutral-950 dark:text-white">
            <Head title="Laporan Keuangan" />

            {/* HEADER */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Laporan Keuangan
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Ringkasan pendapatan, pengeluaran, dan performa
                        penjualan.
                    </p>
                </div>
                <div className="flex gap-2">
                    {canExport && (
                        <>
                            <a
                                href={`/reports/pdf?start_date=${startDate}&end_date=${endDate}`}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-[13px] font-bold text-white shadow-lg transition-colors hover:bg-red-700"
                            >
                                <FileText className="size-4" /> PDF
                            </a>
                            <a
                                href={`/reports/excel?start_date=${startDate}&end_date=${endDate}`}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-[13px] font-bold text-white shadow-lg transition-colors hover:bg-emerald-700"
                            >
                                <FileSpreadsheet className="size-4" /> Excel
                            </a>
                        </>
                    )}
                    <Button
                        onClick={() => handlePrint()}
                        className="h-10 gap-2 rounded-xl bg-black px-5 text-[13px] font-bold text-white shadow-lg dark:bg-white dark:text-black"
                    >
                        <Printer className="size-4" /> Cetak
                    </Button>
                </div>
            </div>

            {/* DATE FILTER */}
            <Card className="rounded-2xl border border-neutral-100 shadow-none dark:border-neutral-800">
                <CardContent className="flex flex-wrap items-end gap-3 p-4">
                    <div className="space-y-1">
                        <label className="ml-1 text-[10px] font-bold text-neutral-500 uppercase">
                            Dari Tanggal
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-9 w-44 rounded-lg text-[13px]"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="ml-1 text-[10px] font-bold text-neutral-500 uppercase">
                            Sampai Tanggal
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-9 w-44 rounded-lg text-[13px]"
                        />
                    </div>
                    <Button
                        onClick={applyFilter}
                        className="h-9 gap-2 rounded-lg bg-neutral-900 px-4 text-[13px] font-bold text-white dark:bg-white dark:text-black"
                    >
                        <Search className="size-3.5" /> Filter
                    </Button>
                </CardContent>
            </Card>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {summaryCards.map((card) => (
                    <Card
                        key={card.label}
                        className="rounded-2xl border border-neutral-100 shadow-none transition-all hover:shadow-lg hover:shadow-black/5 dark:border-neutral-800"
                    >
                        <CardContent className="flex items-start gap-3 p-4">
                            <div
                                className={`flex size-10 items-center justify-center rounded-xl ${card.color}`}
                            >
                                <card.icon className="size-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    {card.label}
                                </p>
                                <p className="mt-0.5 text-lg font-black">
                                    {card.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* GROWTH + FINANCIAL DETAIL */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="rounded-2xl border border-neutral-100 shadow-none dark:border-neutral-800">
                    <CardContent className="space-y-4 p-5">
                        <h3 className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
                            Pertumbuhan Bulanan
                        </h3>
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex size-12 items-center justify-center rounded-2xl ${growth.percentage >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}
                            >
                                {growth.percentage >= 0 ? (
                                    <TrendingUp className="size-6" />
                                ) : (
                                    <TrendingDown className="size-6" />
                                )}
                            </div>
                            <div>
                                <p
                                    className={`text-2xl font-black ${growth.percentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                                >
                                    {growth.percentage >= 0 ? '+' : ''}
                                    {growth.percentage}%
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    vs bulan sebelumnya
                                </p>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-[13px]">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Bulan ini
                                </span>
                                <span className="font-bold">
                                    {fmt(growth.current)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Bulan lalu
                                </span>
                                <span className="font-bold">
                                    {fmt(growth.previous)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-neutral-100 shadow-none lg:col-span-2 dark:border-neutral-800">
                    <CardContent className="space-y-4 p-5">
                        <h3 className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
                            Rincian Keuangan
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                {
                                    label: 'Total Subtotal',
                                    value: fmt(summary.total_subtotal),
                                    cls: '',
                                },
                                {
                                    label: 'Total Pajak',
                                    value: '+' + fmt(summary.total_tax),
                                    cls: 'text-blue-500',
                                },
                                {
                                    label: 'Total Diskon',
                                    value: '-' + fmt(summary.total_discount),
                                    cls: 'text-red-500',
                                },
                                {
                                    label: 'Total Dibayar',
                                    value: fmt(summary.total_paid),
                                    cls: 'text-emerald-500',
                                },
                                {
                                    label: 'Total Kembalian',
                                    value: fmt(summary.total_change),
                                    cls: 'text-amber-500',
                                },
                                {
                                    label: 'Pendapatan Bersih',
                                    value: fmt(summary.total_revenue),
                                    cls: 'text-neutral-900 dark:text-white',
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50"
                                >
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {item.label}
                                    </p>
                                    <p
                                        className={`mt-1 text-[15px] font-black ${item.cls}`}
                                    >
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SHIFT RECONCILIATION */}
            {shiftReports.length > 0 && (
                <Card className="rounded-2xl border border-neutral-100 shadow-none dark:border-neutral-800">
                    <CardContent className="space-y-4 p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
                                Rekonsiliasi Shift
                            </h3>
                            <div className="flex items-center gap-4 text-[12px]">
                                <span className="text-muted-foreground">
                                    <span className="font-bold text-foreground">
                                        {shiftSummary.total_shifts}
                                    </span>{' '}
                                    shift
                                    {shiftSummary.closed_shifts > 0 && (
                                        <span>
                                            {' '}
                                            ·{' '}
                                            <span className="font-bold text-foreground">
                                                {shiftSummary.closed_shifts}
                                            </span>{' '}
                                            ditutup
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Summary Mini Cards */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                    Total Ekspektasi
                                </p>
                                <p className="mt-1 text-[15px] font-black">
                                    {fmt(shiftSummary.total_expected)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                    Total Aktual
                                </p>
                                <p className="mt-1 text-[15px] font-black">
                                    {fmt(shiftSummary.total_actual)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                    Total Selisih
                                </p>
                                <p
                                    className={`mt-1 text-[15px] font-black ${shiftSummary.total_difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                                >
                                    {shiftSummary.total_difference >= 0
                                        ? '+'
                                        : ''}
                                    {fmt(shiftSummary.total_difference)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                    Rata-rata/Shift
                                </p>
                                <p className="mt-1 text-[15px] font-black">
                                    {fmt(
                                        shiftSummary.total_expected /
                                            (shiftSummary.total_shifts || 1),
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Shift Detail Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="px-3 py-2.5 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Kasir
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Shift
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Trx
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Modal
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Penjualan
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Ekspektasi
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Aktual
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Selisih
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shiftReports.map((shift) => (
                                        <tr
                                            key={shift.id}
                                            className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-800/50 dark:hover:bg-neutral-900/50"
                                        >
                                            <td className="px-3 py-2.5 font-bold">
                                                {shift.user_name}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="text-[11px] text-muted-foreground">
                                                    {new Date(
                                                        shift.start_time,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: '2-digit',
                                                            month: 'short',
                                                        },
                                                    )}
                                                    {shift.end_time ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400">
                                                            {' '}
                                                            ·{' '}
                                                            {Math.floor(
                                                                (new Date(
                                                                    shift.end_time,
                                                                ).getTime() -
                                                                    new Date(
                                                                        shift.start_time,
                                                                    ).getTime()) /
                                                                    3600000,
                                                            )}
                                                            j
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600">
                                                            {' '}
                                                            · Aktif
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium">
                                                {shift.transactions_count}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                                                {fmt(shift.starting_cash)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium">
                                                {fmt(shift.total_sales)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-bold">
                                                {fmt(shift.expected_cash)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium">
                                                {fmt(shift.actual_cash)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <span
                                                    className={`text-[13px] font-bold ${shift.difference > 0 ? 'text-emerald-600 dark:text-emerald-400' : shift.difference < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500'}`}
                                                >
                                                    {shift.difference >= 0
                                                        ? '+'
                                                        : ''}
                                                    {fmt(shift.difference)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-neutral-900 font-black dark:border-white">
                                        <td className="px-3 py-3" colSpan={2}>
                                            TOTAL
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {shiftSummary.total_shifts > 0
                                                ? shiftReports.reduce(
                                                      (s, r) =>
                                                          s +
                                                          r.transactions_count,
                                                      0,
                                                  )
                                                : 0}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {fmt(
                                                shiftReports.reduce(
                                                    (s, r) =>
                                                        s + r.starting_cash,
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {fmt(
                                                shiftReports.reduce(
                                                    (s, r) => s + r.total_sales,
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {fmt(shiftSummary.total_expected)}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {fmt(shiftSummary.total_actual)}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span
                                                className={
                                                    shiftSummary.total_difference >=
                                                    0
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }
                                            >
                                                {shiftSummary.total_difference >=
                                                0
                                                    ? '+'
                                                    : ''}
                                                {fmt(
                                                    shiftSummary.total_difference,
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TOP PRODUCTS + DAILY REPORT */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Top Products */}
                <Card className="rounded-2xl border border-neutral-100 shadow-none dark:border-neutral-800">
                    <CardContent className="space-y-3 p-5">
                        <h3 className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
                            Produk Terlaris
                        </h3>
                        <div className="space-y-2">
                            {topProducts.length > 0 ? (
                                topProducts.map((product, idx) => (
                                    <div
                                        key={product.name}
                                        className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/50"
                                    >
                                        <span className="flex size-7 items-center justify-center rounded-lg bg-neutral-200 text-[11px] font-black dark:bg-neutral-800">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[12px] font-bold">
                                                {product.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {product.total_qty} unit terjual
                                            </p>
                                        </div>
                                        <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400">
                                            {fmt(product.total_sales)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-center text-[13px] text-muted-foreground">
                                    Belum ada data.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Report Table */}
                <Card className="rounded-2xl border border-neutral-100 shadow-none lg:col-span-2 dark:border-neutral-800">
                    <CardContent className="space-y-3 p-5">
                        <h3 className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
                            Laporan Harian
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="px-3 py-2.5 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Trx
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Subtotal
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Pajak
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Diskon
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Pendapatan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyReport.length > 0 ? (
                                        dailyReport.map((day) => (
                                            <tr
                                                key={day.date}
                                                className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-800/50 dark:hover:bg-neutral-900/50"
                                            >
                                                <td className="px-3 py-2.5 font-bold">
                                                    {fmtDate(day.date)}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-md text-[10px] font-bold"
                                                    >
                                                        {day.transactions_count}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                                                    {fmt(day.subtotal)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-bold text-blue-500">
                                                    +{fmt(day.tax)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-bold text-red-500">
                                                    -{fmt(day.discount)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-black">
                                                    {fmt(day.revenue)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Belum ada data.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {dailyReport.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-neutral-900 font-black dark:border-white">
                                            <td className="px-3 py-3">TOTAL</td>
                                            <td className="px-3 py-3 text-center">
                                                {summary.total_transactions}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {fmt(summary.total_subtotal)}
                                            </td>
                                            <td className="px-3 py-3 text-right text-blue-500">
                                                +{fmt(summary.total_tax)}
                                            </td>
                                            <td className="px-3 py-3 text-right text-red-500">
                                                -{fmt(summary.total_discount)}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {fmt(summary.total_revenue)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* PRINTABLE AREA - HIDDEN */}
            <div style={{ display: 'none' }}>
                <div
                    ref={printRef}
                    className="bg-white p-8 font-mono text-[11px] text-black"
                    style={{ width: '210mm' }}
                >
                    <div className="mb-6 text-center">
                        <h1 className="text-[20px] font-bold uppercase">
                            AMERTA KOMPUTER
                        </h1>
                        <p className="text-[12px]">
                            Jl. Diponegoro No.88 Kec.Rembang, Keb.Rembang
                        </p>
                        <p className="text-[12px]">Telp: 0812-3456-7890</p>
                        <div className="mt-3 border-b-2 border-black pb-3">
                            <h2 className="text-[16px] font-bold">
                                LAPORAN KEUANGAN
                            </h2>
                            <p className="text-[12px]">
                                Periode: {fmtDate(startDate)} —{' '}
                                {fmtDate(endDate)}
                            </p>
                        </div>
                    </div>

                    {/* Print Summary */}
                    <div className="mb-6">
                        <h3 className="mb-2 border-b border-black pb-1 text-[14px] font-bold">
                            RINGKASAN
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12px]">
                            <div className="flex justify-between">
                                <span>Total Transaksi:</span>
                                <span className="font-bold">
                                    {summary.total_transactions} transaksi
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Rata-rata Transaksi:</span>
                                <span className="font-bold">
                                    {fmt(summary.avg_transaction)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Subtotal:</span>
                                <span className="font-bold">
                                    {fmt(summary.total_subtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Pajak:</span>
                                <span className="font-bold">
                                    {fmt(summary.total_tax)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Diskon:</span>
                                <span className="font-bold">
                                    {fmt(summary.total_discount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Dibayar:</span>
                                <span className="font-bold">
                                    {fmt(summary.total_paid)}
                                </span>
                            </div>
                            <div className="col-span-2 mt-1 flex justify-between border-t border-black pt-1">
                                <span className="text-[14px] font-bold">
                                    TOTAL PENDAPATAN:
                                </span>
                                <span className="text-[14px] font-bold">
                                    {fmt(summary.total_revenue)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Print Daily */}
                    <div className="mb-6">
                        <h3 className="mb-2 border-b border-black pb-1 text-[14px] font-bold">
                            LAPORAN HARIAN
                        </h3>
                        <table className="w-full border-collapse text-[11px]">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-1.5 text-left">
                                        Tanggal
                                    </th>
                                    <th className="py-1.5 text-center">Trx</th>
                                    <th className="py-1.5 text-right">
                                        Subtotal
                                    </th>
                                    <th className="py-1.5 text-right">Pajak</th>
                                    <th className="py-1.5 text-right">
                                        Diskon
                                    </th>
                                    <th className="py-1.5 text-right">
                                        Pendapatan
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyReport.map((day) => (
                                    <tr
                                        key={day.date}
                                        className="border-b border-gray-300"
                                    >
                                        <td className="py-1.5">
                                            {fmtDate(day.date)}
                                        </td>
                                        <td className="py-1.5 text-center">
                                            {day.transactions_count}
                                        </td>
                                        <td className="py-1.5 text-right">
                                            {fmt(day.subtotal)}
                                        </td>
                                        <td className="py-1.5 text-right">
                                            {fmt(day.tax)}
                                        </td>
                                        <td className="py-1.5 text-right">
                                            {fmt(day.discount)}
                                        </td>
                                        <td className="py-1.5 text-right font-bold">
                                            {fmt(day.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-black font-bold">
                                    <td className="py-1.5">TOTAL</td>
                                    <td className="py-1.5 text-center">
                                        {summary.total_transactions}
                                    </td>
                                    <td className="py-1.5 text-right">
                                        {fmt(summary.total_subtotal)}
                                    </td>
                                    <td className="py-1.5 text-right">
                                        {fmt(summary.total_tax)}
                                    </td>
                                    <td className="py-1.5 text-right">
                                        {fmt(summary.total_discount)}
                                    </td>
                                    <td className="py-1.5 text-right">
                                        {fmt(summary.total_revenue)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Print Top Products */}
                    <div className="mb-6">
                        <h3 className="mb-2 border-b border-black pb-1 text-[14px] font-bold">
                            PRODUK TERLARIS
                        </h3>
                        <table className="w-full border-collapse text-[11px]">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-1.5 text-left">No</th>
                                    <th className="py-1.5 text-left">
                                        Nama Produk
                                    </th>
                                    <th className="py-1.5 text-center">
                                        Qty Terjual
                                    </th>
                                    <th className="py-1.5 text-right">
                                        Total Penjualan
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((p, i) => (
                                    <tr
                                        key={p.name}
                                        className="border-b border-gray-300"
                                    >
                                        <td className="py-1.5">{i + 1}</td>
                                        <td className="py-1.5">{p.name}</td>
                                        <td className="py-1.5 text-center">
                                            {p.total_qty}
                                        </td>
                                        <td className="py-1.5 text-right">
                                            {fmt(p.total_sales)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Print Transaction Detail */}
                    <div className="mb-6">
                        <h3 className="mb-2 border-b border-black pb-1 text-[14px] font-bold">
                            DETAIL TRANSAKSI
                        </h3>
                        <table className="w-full border-collapse text-[10px]">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-1 text-left">Kode</th>
                                    <th className="py-1 text-left">Kasir</th>
                                    <th className="py-1 text-left">Tanggal</th>
                                    <th className="py-1 text-right">
                                        Subtotal
                                    </th>
                                    <th className="py-1 text-right">Pajak</th>
                                    <th className="py-1 text-right">Diskon</th>
                                    <th className="py-1 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="border-b border-gray-200"
                                    >
                                        <td className="py-1 font-bold">
                                            {t.transaction_code}
                                        </td>
                                        <td className="py-1">
                                            {t.user?.name ?? '-'}
                                        </td>
                                        <td className="py-1">
                                            {fmtDate(t.created_at)}
                                        </td>
                                        <td className="py-1 text-right">
                                            {fmt(t.subtotal_amount)}
                                        </td>
                                        <td className="py-1 text-right">
                                            {fmt(t.tax_amount)}
                                        </td>
                                        <td className="py-1 text-right">
                                            {fmt(t.discount_amount)}
                                        </td>
                                        <td className="py-1 text-right font-bold">
                                            {fmt(t.total_amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Print Footer */}
                    <div className="mt-8 border-t border-black pt-4 text-center text-[10px]">
                        <p>
                            Dicetak pada: {new Date().toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1 font-bold">
                            AMERTA KOMPUTER — Sistem POS
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
