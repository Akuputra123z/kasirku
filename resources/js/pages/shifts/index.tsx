'use client';
import { Head, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Play,
    Search,
    StopCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    DollarSign,
    Receipt,
    ShoppingBag,
    Info,
    ArrowRight,
    X,
} from 'lucide-react';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import shiftsRoute from '@/routes/shifts';

// ---- Types ----
interface ShiftUser {
    id: number;
    name: string;
    email: string;
}

interface Shift {
    id: number;
    user_id: number;
    user: ShiftUser | null;
    start_time: string;
    end_time: string | null;
    starting_cash: number;
    expected_cash: number | null;
    actual_cash: number | null;
    notes: string | null;
    created_at: string;
    transactions_count?: number;
    transactions_sum_total_amount?: number;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLinks[];
}

interface PageProps extends Record<string, unknown> {
    shifts: Paginator<Shift>;
    active_shift: Shift | null;
    flash?: {
        success?: string;
        error?: string;
    };
}

// ---- Helpers ----
const fmt = (n: number | null | undefined) =>
    n != null
        ? 'Rp ' +
          n.toLocaleString('id-ID', {
              minimumFractionDigits: 0,
          })
        : '-';

const fmtDate = (s: string) =>
    new Date(s).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const fmtDateShort = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const duration = (start: string, end?: string | null) => {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    const diff = Math.floor((e.getTime() - s.getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);

    return `${h}j ${m}m`;
};

// ---- Modal Wrapper ----
function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

// ---- Stat Card ----
function StatCard({
    icon: Icon,
    label,
    value,
    trend,
}: {
    icon: any;
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900">
                    <Icon className="size-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                    <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        {label}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <p className="text-lg font-black">{value}</p>
                        {trend === 'up' && (
                            <TrendingUp className="size-4 text-emerald-500" />
                        )}
                        {trend === 'down' && (
                            <TrendingDown className="size-4 text-red-500" />
                        )}
                        {trend === 'neutral' && (
                            <Minus className="size-4 text-amber-500" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---- Main Page ----
export default function ShiftsIndex() {
    const { shifts, active_shift } = usePage<PageProps>().props;

    const [startModal, setStartModal] = useState(false);
    const [closeModal, setCloseModal] = useState(false);

    const [startingCash, setStartingCash] = useState('');
    const [actualCash, setActualCash] = useState('');
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [expandedShift, setExpandedShift] = useState<number | null>(null);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedSearch = useCallback((value: string) => {
        setSearchInput(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(value);
            setCurrentPage(1);
        }, 300);
    }, []);

    useEffect(
        () => () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        },
        [],
    );

    // ---- Filter ----
    const filteredShifts = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return shifts.data.filter(
            (shift) =>
                (shift.user?.name?.toLowerCase().includes(q) ?? false) ||
                (shift.user?.email?.toLowerCase().includes(q) ?? false) ||
                fmtDateShort(shift.start_time).toLowerCase().includes(q),
        );
    }, [shifts.data, searchQuery]);

    // ---- Pagination ----
    const paginatedShifts = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;

        return filteredShifts.slice(start, start + rowsPerPage);
    }, [filteredShifts, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredShifts.length / rowsPerPage);

    // ---- Actions ----
    const handleStart = () => {
        if (!startingCash) {
            return;
        }

        setLoading(true);
        router.post(
            shiftsRoute.start().url,
            { starting_cash: startingCash },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Shift berhasil dibuka');
                },
                onError: () => {
                    toast.error('Gagal membuka shift');
                },
                onFinish: () => {
                    setLoading(false);
                    setStartModal(false);
                    setStartingCash('');
                },
            },
        );
    };

    const handleClose = () => {
        if (!active_shift || !actualCash) {
            return;
        }

        setLoading(true);
        router.post(
            shiftsRoute.close(active_shift.id).url,
            { actual_cash: actualCash, notes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Shift berhasil ditutup');
                },
                onError: () => {
                    toast.error('Gagal menutup shift');
                },
                onFinish: () => {
                    setLoading(false);
                    setCloseModal(false);
                    setActualCash('');
                    setNotes('');
                },
            },
        );
    };

    const closeSelisih = active_shift
        ? Number(actualCash || '0') - (active_shift.expected_cash ?? 0)
        : 0;

    const activeSales = active_shift?.transactions_sum_total_amount ?? 0;

    return (
        <>
            <Head title="Manajemen Shift" />

            <div className="min-h-screen space-y-6 bg-neutral-50 p-4 font-sans md:p-8 dark:bg-neutral-950">
                {/* HEADER */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Manajemen Shift
                        </h1>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                            Kelola sesi shift kasir — buka shift baru, pantau
                            aktivitas, dan tutup shift dengan rekonsiliasi kas.
                        </p>
                    </div>

                    {!active_shift ? (
                        <Button
                            onClick={() => setStartModal(true)}
                            className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                        >
                            <Play className="size-3.5" />
                            Buka Shift
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCloseModal(true)}
                            className="h-9 gap-2 bg-red-600 px-4 font-medium text-white hover:bg-red-700"
                        >
                            <StopCircle className="size-3.5" />
                            Tutup Shift
                        </Button>
                    )}
                </div>

                {/* ACTIVE SHIFT CARD */}
                {active_shift && (
                    <Card className="overflow-hidden border-2 border-emerald-200 shadow-md dark:border-emerald-800">
                        <CardContent className="p-0">
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-2 animate-pulse rounded-full bg-white" />
                                    <span className="text-[11px] font-bold tracking-widest text-white/90 uppercase">
                                        Shift Aktif
                                    </span>
                                </div>
                            </div>
                            <div className="grid gap-4 p-6 md:grid-cols-4">
                                <div className="md:col-span-1">
                                    <p className="text-sm font-bold text-foreground">
                                        {active_shift.user?.name ?? 'User'}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Mulai {fmtDate(active_shift.start_time)}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/50">
                                        <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                                            {duration(active_shift.start_time)}
                                        </span>
                                    </div>
                                </div>
                                <StatCard
                                    icon={ShoppingBag}
                                    label="Transaksi"
                                    value={String(
                                        active_shift.transactions_count ?? 0,
                                    )}
                                />
                                <StatCard
                                    icon={DollarSign}
                                    label="Total Penjualan"
                                    value={fmt(activeSales)}
                                />
                                <StatCard
                                    icon={Receipt}
                                    label="Kas Diperkirakan"
                                    value={fmt(
                                        active_shift?.expected_cash ?? 0,
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* FILTER + TABLE HEADER */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <h2 className="text-base font-bold tracking-tight">
                        Riwayat Shift
                    </h2>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari kasir atau tanggal..."
                            value={searchInput}
                            onChange={(e) => debouncedSearch(e.target.value)}
                            className="h-9 pr-8 pl-9 text-[13px]"
                        />
                        {searchInput && (
                            <button
                                onClick={() => debouncedSearch('')}
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="overflow-x-auto">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                        <TableHead className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Kasir
                                        </TableHead>
                                        <TableHead className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Mulai
                                        </TableHead>
                                        <TableHead className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Durasi
                                        </TableHead>
                                        <TableHead className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-right text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Modal
                                        </TableHead>
                                        <TableHead className="text-right text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Penjualan
                                        </TableHead>
                                        <TableHead className="text-right text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Ekspektasi
                                        </TableHead>
                                        <TableHead className="text-right text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Aktual
                                        </TableHead>
                                        <TableHead className="text-right text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Selisih
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {paginatedShifts.length > 0 ? (
                                            paginatedShifts.map((shift) => {
                                                const sales =
                                                    shift.transactions_sum_total_amount ??
                                                    0;
                                                const expected =
                                                    shift.expected_cash ??
                                                    (shift.end_time
                                                        ? shift.starting_cash +
                                                          sales
                                                        : null);
                                                const diff =
                                                    shift.actual_cash != null &&
                                                    expected != null
                                                        ? shift.actual_cash -
                                                          expected
                                                        : null;
                                                const isActive =
                                                    !shift.end_time;
                                                const hasIssue =
                                                    diff != null && diff !== 0;

                                                return (
                                                    <motion.tr
                                                        key={shift.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        layout
                                                        onClick={() =>
                                                            setExpandedShift(
                                                                expandedShift ===
                                                                    shift.id
                                                                    ? null
                                                                    : shift.id,
                                                            )
                                                        }
                                                        className={cn(
                                                            'group cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50',
                                                            isActive &&
                                                                'bg-emerald-50/50 dark:bg-emerald-950/20',
                                                        )}
                                                    >
                                                        <TableCell className="py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold dark:bg-neutral-900">
                                                                    {shift.user?.name?.charAt(
                                                                        0,
                                                                    ) ?? '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[13px] font-semibold">
                                                                        {shift
                                                                            .user
                                                                            ?.name ??
                                                                            'Unknown User'}
                                                                    </p>
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        {shift
                                                                            .user
                                                                            ?.email ??
                                                                            '-'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 text-[13px] text-muted-foreground">
                                                            {fmtDate(
                                                                shift.start_time,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="size-3.5 text-muted-foreground" />
                                                                <span className="text-[13px] font-medium">
                                                                    {duration(
                                                                        shift.start_time,
                                                                        shift.end_time,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            {isActive ? (
                                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                                    Aktif
                                                                </Badge>
                                                            ) : hasIssue ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                                                >
                                                                    Selesai
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                                                                >
                                                                    Selesai
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-right text-[13px] font-medium">
                                                            {fmt(
                                                                shift.starting_cash,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-right text-[13px] font-medium">
                                                            {fmt(sales)}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-right text-[13px] font-medium">
                                                            {fmt(expected)}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-right text-[13px] font-medium">
                                                            {fmt(
                                                                shift.actual_cash,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-right">
                                                            {diff != null ? (
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1 text-[13px] font-bold',
                                                                        diff >
                                                                            0 &&
                                                                            'text-emerald-600 dark:text-emerald-400',
                                                                        diff <
                                                                            0 &&
                                                                            'text-red-600 dark:text-red-400',
                                                                        diff ===
                                                                            0 &&
                                                                            'text-neutral-500',
                                                                    )}
                                                                >
                                                                    {diff > 0
                                                                        ? '+'
                                                                        : ''}
                                                                    {fmt(diff)}
                                                                    {diff >
                                                                        0 && (
                                                                        <TrendingUp className="size-3.5" />
                                                                    )}
                                                                    {diff <
                                                                        0 && (
                                                                        <TrendingDown className="size-3.5" />
                                                                    )}
                                                                    {diff ===
                                                                        0 && (
                                                                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[13px] text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </motion.tr>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    className="h-52 text-center"
                                                >
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <Clock className="size-10 text-neutral-300 dark:text-neutral-700" />
                                                        <p className="text-sm text-muted-foreground">
                                                            {searchInput
                                                                ? 'Tidak ada shift yang cocok dengan pencarian.'
                                                                : 'Belum ada shift. Buka shift baru untuk memulai.'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </div>
                </Card>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-2">
                            <Select
                                value={rowsPerPage.toString()}
                                onValueChange={(v) => {
                                    setRowsPerPage(parseInt(v));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[70px] text-[13px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-[13px] text-muted-foreground">
                                dari {filteredShifts.length} shift
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1),
                                    )
                                }
                                disabled={
                                    currentPage === totalPages ||
                                    totalPages === 0
                                }
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={
                                    currentPage === totalPages ||
                                    totalPages === 0
                                }
                            >
                                <ChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* START MODAL */}
                <Modal
                    open={startModal}
                    onClose={() => setStartModal(false)}
                    title="Buka Shift Baru"
                >
                    <div className="space-y-5">
                        <div className="flex gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
                            <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                    Persiapan Sebelum Buka Shift
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                                    Hitung fisik uang yang ada di laci kas.
                                    Jumlah ini akan menjadi modal awal shift.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Modal Awal Kas
                            </label>
                            <CurrencyInput
                                value={startingCash}
                                onChange={setStartingCash}
                                placeholder="Masukkan jumlah uang di laci kas"
                                className="h-11 text-base"
                            />
                        </div>

                        <div className="flex gap-2 rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                            <Info className="size-4 shrink-0 text-blue-500" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Setelah shift dibuka, semua transaksi akan
                                tercatat di shift ini hingga ditutup.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setStartModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleStart}
                                disabled={loading || !startingCash}
                                className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
                            >
                                {loading ? 'Memproses...' : 'Buka Shift'}
                            </Button>
                        </DialogFooter>
                    </div>
                </Modal>

                {/* CLOSE MODAL */}
                <Modal
                    open={closeModal}
                    onClose={() => setCloseModal(false)}
                    title="Tutup Shift — Rekonsiliasi Kas"
                >
                    <div className="space-y-5">
                        {/* Ringkasan Shift */}
                        <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-muted-foreground">
                                    Total Transaksi
                                </span>
                                <span className="font-bold">
                                    {active_shift?.transactions_count ?? 0}{' '}
                                    transaksi
                                </span>
                            </div>
                            <Separator className="dark:bg-neutral-800" />
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-muted-foreground">
                                    Total Penjualan
                                </span>
                                <span className="font-bold">
                                    {fmt(activeSales)}
                                </span>
                            </div>
                            <Separator className="dark:bg-neutral-800" />
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-muted-foreground">
                                    Modal Awal
                                </span>
                                <span className="font-bold">
                                    {active_shift
                                        ? fmt(active_shift.starting_cash)
                                        : '-'}
                                </span>
                            </div>
                            <Separator className="dark:bg-neutral-800" />
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-foreground">
                                    Kas Yang Diharapkan
                                </span>
                                <span className="text-base font-black text-foreground">
                                    {fmt(active_shift?.expected_cash ?? 0)}
                                </span>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="flex gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
                            <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                                Hitung seluruh uang fisik di laci kas (termasuk
                                uang hasil penjualan).
                                <br />
                                Ekspektasi kas = Modal awal <strong>
                                    +
                                </strong>{' '}
                                Total penjualan.
                            </p>
                        </div>

                        {/* Input Actual Cash */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Kas Aktual (Fisik)
                            </label>
                            <CurrencyInput
                                value={actualCash}
                                onChange={setActualCash}
                                placeholder="Masukkan jumlah uang fisik di laci"
                                className="h-11 text-base"
                            />
                        </div>

                        {/* Selisih */}
                        {actualCash && (
                            <div className="space-y-1">
                                <div
                                    className={cn(
                                        'rounded-xl p-4 text-sm font-medium',
                                        closeSelisih === 0 &&
                                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
                                        closeSelisih > 0 &&
                                            'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
                                        closeSelisih < 0 &&
                                            'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs tracking-wider uppercase">
                                            Selisih (Aktual — Ekspektasi)
                                        </span>
                                        <span className="text-lg font-black">
                                            {closeSelisih >= 0 ? '+' : ''}
                                            {fmt(closeSelisih)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] opacity-70">
                                        {closeSelisih === 0 &&
                                            'Kas pas — tidak ada selisih.'}
                                        {closeSelisih > 0 &&
                                            'Kelebihan kas sebesar selisih di atas.'}
                                        {closeSelisih < 0 &&
                                            'Kekurangan kas sebesar selisih di atas.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Catatan (Opsional)
                            </label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Kelebihan Rp 5.000 karena uang kembalian..."
                                className="min-h-[80px] resize-none"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setCloseModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleClose}
                                disabled={loading || !actualCash}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {loading ? 'Memproses...' : 'Tutup Shift'}
                            </Button>
                        </DialogFooter>
                    </div>
                </Modal>
            </div>
        </>
    );
}
