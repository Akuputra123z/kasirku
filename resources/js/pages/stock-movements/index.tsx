'use client';

import { Head, useForm, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    Plus,
    Minus,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowDown,
    ArrowUp,
    Package,
    TrendingUp,
    TrendingDown,
    Calendar,
    RotateCcw,
    ListOrdered,
    Filter,
    X,
    XCircle,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface Variant {
    id: number;
    name: string;
    sku: string | null;
    stock: number;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    stock: number;
    variants?: Variant[];
}

interface Movement {
    id: number;
    product: Product;
    product_variant: Variant | null;
    user: { name: string };
    type: string;
    quantity: number;
    stock_before: number;
    stock_after: number;
    reason: string;
    notes: string | null;
    created_at: string;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    movements: Paginator<Movement>;
    filters: {
        search: string | null;
        type: string | null;
        date_from: string | null;
        date_to: string | null;
        sort_field: string;
        sort_dir: string;
    };
    todayStats: {
        stock_in: number;
        stock_out: number;
        total_movements: number;
    };
    products: Product[];
    flash?: { success?: string; error?: string };
}

const typeStyle = (type: string) => {
    switch (type) {
        case 'in':
            return {
                label: 'Stok Masuk',
                badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
                icon: TrendingUp,
                sign: '+',
                color: 'text-emerald-600',
            };
        case 'out':
            return {
                label: 'Stok Keluar',
                badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
                icon: TrendingDown,
                sign: '-',
                color: 'text-red-600',
            };
        default:
            return {
                label: 'Penyesuaian',
                badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
                icon: ListOrdered,
                sign: '±',
                color: 'text-blue-600',
            };
    }
};

const QUICK_QTY = [1, 5, 10, 25, 50, 100];

const stockLevel = (stock: number) => {
    if (stock <= 0)
        return {
            label: 'Habis',
            class: 'text-red-600 bg-red-50 dark:bg-red-950/30',
        };
    if (stock <= 5)
        return {
            label: 'Kritis',
            class: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
        };
    if (stock <= 20)
        return {
            label: 'Rendah',
            class: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
        };
    if (stock <= 50)
        return {
            label: 'Sedang',
            class: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
        };
    return {
        label: 'Aman',
        class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    };
};

export default function Index({
    movements,
    filters,
    todayStats,
    products,
    flash,
}: Props) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters?.type ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters?.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters?.date_to ?? '');
    const [sortField, setSortField] = useState(
        filters?.sort_field ?? 'created_at',
    );
    const [sortDir, setSortDir] = useState(filters?.sort_dir ?? 'desc');
    const [productSearch, setProductSearch] = useState('');
    const [showFilters, setShowFilters] = useState(
        !!(filters?.date_from || filters?.date_to),
    );

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            product_id: '',
            product_variant_id: '',
            type: 'in',
            quantity: 1,
            reason: 'adjustment',
            notes: '',
        });

    const applyFilters = useCallback(
        (overrides: Record<string, string | null> = {}) => {
            const params: Record<string, string | null> = {
                search: searchQuery || null,
                type: typeFilter === 'all' ? null : typeFilter,
                date_from: dateFrom || null,
                date_to: dateTo || null,
                sort_field: sortField,
                sort_dir: sortDir,
                ...overrides,
            };

            router.get('/stock-movements', params, { preserveState: true });
        },
        [searchQuery, typeFilter, dateFrom, dateTo, sortField, sortDir],
    );

    const debouncedSearch = useCallback(
        (value: string) => {
            setSearchQuery(value);
            if (searchTimeoutRef.current)
                clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => {
                applyFilters({ search: value || null });
            }, 300);
        },
        [applyFilters],
    );

    useEffect(
        () => () => {
            if (searchTimeoutRef.current)
                clearTimeout(searchTimeoutRef.current);
        },
        [],
    );

    const goToPage = (page: number) => {
        applyFilters({ page: String(page) });
    };

    const toggleSort = (field: string) => {
        if (sortField === field) {
            const newDir = sortDir === 'desc' ? 'asc' : 'desc';
            setSortDir(newDir);
            applyFilters({ sort_field: field, sort_dir: newDir });
        } else {
            setSortField(field);
            setSortDir('desc');
            applyFilters({ sort_field: field, sort_dir: 'desc' });
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setTypeFilter('all');
        setDateFrom('');
        setDateTo('');
        setShowFilters(false);
        router.get('/stock-movements', {}, { preserveState: true });
    };

    const openAdjust = () => {
        reset();
        clearErrors();
        setProductSearch('');
        setIsAdjustOpen(true);
    };

    const handleAdjust = (e: React.FormEvent) => {
        e.preventDefault();
        post('/stock-movements', {
            onSuccess: () => {
                setIsAdjustOpen(false);
                toast.success('Mutasi stok berhasil dicatat');
            },
            preserveScroll: true,
        });
    };

    const selectedProduct = data.product_id
        ? products.find((p) => String(p.id) === data.product_id)
        : null;

    const selectedVariant =
        data.product_variant_id && selectedProduct?.variants
            ? selectedProduct.variants.find(
                  (v) => String(v.id) === data.product_variant_id,
              )
            : null;

    const currentStock = selectedVariant
        ? selectedVariant.stock
        : (selectedProduct?.stock ?? 0);

    const resultStock =
        data.type === 'adjustment'
            ? currentStock
            : data.type === 'out'
              ? currentStock - data.quantity
              : currentStock + data.quantity;

    const filteredProducts = useMemo(
        () =>
            productSearch
                ? products.filter(
                      (p) =>
                          p.name
                              .toLowerCase()
                              .includes(productSearch.toLowerCase()) ||
                          (p.sku &&
                              p.sku
                                  .toLowerCase()
                                  .includes(productSearch.toLowerCase())),
                  )
                : products,
        [products, productSearch],
    );

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field)
            return <ArrowUpDown className="ml-1 size-3 opacity-30" />;
        return sortDir === 'desc' ? (
            <ArrowDown className="ml-1 size-3" />
        ) : (
            <ArrowUp className="ml-1 size-3" />
        );
    };

    return (
        <div className="min-h-screen space-y-5 bg-neutral-50 p-4 md:p-8 dark:bg-neutral-950">
            <Head title="Mutasi Stok" />

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <Card className="border-emerald-200/60 bg-white shadow-none dark:border-emerald-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                            <TrendingUp className="size-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Stok Masuk Hari Ini
                            </p>
                            <p className="text-lg font-bold text-emerald-600">
                                {todayStats.stock_in}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-200/60 bg-white shadow-none dark:border-red-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50">
                            <TrendingDown className="size-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Stok Keluar Hari Ini
                            </p>
                            <p className="text-lg font-bold text-red-600">
                                {todayStats.stock_out}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200/60 bg-white shadow-none dark:border-blue-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                            <ListOrdered className="size-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Total Mutasi Hari Ini
                            </p>
                            <p className="text-lg font-bold">
                                {todayStats.total_movements}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200/60 bg-white shadow-none dark:border-neutral-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
                            <Package className="size-5 text-neutral-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Total Produk
                            </p>
                            <p className="text-lg font-bold">
                                {products.length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Header ── */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Mutasi Stok
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Catat dan pantau semua perubahan stok produk.
                    </p>
                </div>
                <Button
                    onClick={openAdjust}
                    className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                >
                    <Plus className="size-3.5" /> Mutasi Baru
                </Button>
            </div>

            {/* ── Filters ── */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-0 flex-1 sm:max-w-xs">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => debouncedSearch(e.target.value)}
                            className="h-9 pr-8 pl-9 text-[13px]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => debouncedSearch('')}
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                    <Select
                        value={typeFilter}
                        onValueChange={(v) => {
                            setTypeFilter(v);
                            applyFilters({ type: v === 'all' ? null : v });
                        }}
                    >
                        <SelectTrigger className="h-9 w-auto min-w-[120px] text-[13px]">
                            <SelectValue placeholder="Semua tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="in">Stok Masuk</SelectItem>
                            <SelectItem value="out">Stok Keluar</SelectItem>
                            <SelectItem value="adjustment">
                                Penyesuaian
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant={showFilters ? 'default' : 'outline'}
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="size-4" />
                    </Button>
                    {(searchQuery ||
                        typeFilter !== 'all' ||
                        dateFrom ||
                        dateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 shrink-0 gap-1 text-[13px]"
                            onClick={clearFilters}
                        >
                            <RotateCcw className="size-3" /> Reset
                        </Button>
                    )}
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-wrap items-end gap-2 overflow-hidden sm:gap-3"
                        >
                            <div className="w-full min-w-0 sm:w-auto">
                                <Label className="mb-1 block text-[11px] text-muted-foreground">
                                    Dari Tanggal
                                </Label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                    className="h-9 w-full text-[13px] sm:w-auto"
                                />
                            </div>
                            <div className="w-full min-w-0 sm:w-auto">
                                <Label className="mb-1 block text-[11px] text-muted-foreground">
                                    Sampai Tanggal
                                </Label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="h-9 w-full text-[13px] sm:w-auto"
                                />
                            </div>
                            <Button
                                size="sm"
                                className="h-9 w-full shrink-0 text-[13px] sm:w-auto"
                                onClick={() => applyFilters()}
                            >
                                <Calendar className="mr-1 size-3.5" /> Terapkan
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Table ── */}
            <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                <TableHead
                                    className="cursor-pointer py-3 text-[13px] font-semibold text-foreground select-none"
                                    onClick={() => toggleSort('created_at')}
                                >
                                    <span className="inline-flex items-center">
                                        Tanggal <SortIcon field="created_at" />
                                    </span>
                                </TableHead>
                                <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                    Produk
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer py-3 text-[13px] font-semibold text-foreground select-none"
                                    onClick={() => toggleSort('type')}
                                >
                                    <span className="inline-flex items-center">
                                        Tipe <SortIcon field="type" />
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer py-3 text-right text-[13px] font-semibold text-foreground select-none"
                                    onClick={() => toggleSort('quantity')}
                                >
                                    <span className="inline-flex items-center justify-end">
                                        Qty <SortIcon field="quantity" />
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="hidden cursor-pointer py-3 text-right text-[13px] font-semibold text-foreground select-none md:table-cell"
                                    onClick={() => toggleSort('stock_before')}
                                >
                                    <span className="inline-flex items-center justify-end">
                                        Stok Awal{' '}
                                        <SortIcon field="stock_before" />
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="hidden cursor-pointer py-3 text-right text-[13px] font-semibold text-foreground select-none md:table-cell"
                                    onClick={() => toggleSort('stock_after')}
                                >
                                    <span className="inline-flex items-center justify-end">
                                        Stok Akhir{' '}
                                        <SortIcon field="stock_after" />
                                    </span>
                                </TableHead>
                                <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                    Alasan
                                </TableHead>
                                <TableHead className="hidden py-3 text-[13px] font-semibold text-foreground lg:table-cell">
                                    Oleh
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movements.data.length > 0 ? (
                                movements.data.map((m) => {
                                    const style = typeStyle(m.type);
                                    const Icon = style.icon;
                                    return (
                                        <TableRow
                                            key={m.id}
                                            className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                        >
                                            <TableCell className="py-3 align-top">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-default text-[13px] text-muted-foreground">
                                                            {new Date(
                                                                m.created_at,
                                                            ).toLocaleDateString(
                                                                'id-ID',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                },
                                                            )}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="bottom"
                                                        className="text-[12px]"
                                                    >
                                                        {new Date(
                                                            m.created_at,
                                                        ).toLocaleString(
                                                            'id-ID',
                                                            {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-[13px] font-medium text-foreground">
                                                    {m.product?.name ??
                                                        'Produk dihapus'}
                                                </span>
                                                {m.product_variant && (
                                                    <p className="text-[12px] text-muted-foreground">
                                                        Varian:{' '}
                                                        {m.product_variant.name}
                                                    </p>
                                                )}
                                                {m.product?.sku && (
                                                    <p className="text-[12px] text-muted-foreground">
                                                        {m.product.sku}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge
                                                    className={`text-[11px] font-medium ${style.badge}`}
                                                    variant="outline"
                                                >
                                                    <Icon className="mr-1 size-3" />
                                                    {style.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <span
                                                    className={`text-[13px] font-semibold ${style.color}`}
                                                >
                                                    {style.sign}
                                                    {m.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden py-3 text-right md:table-cell">
                                                <span className="text-[13px] text-muted-foreground">
                                                    {m.stock_before}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden py-3 text-right md:table-cell">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-[13px] font-medium`}
                                                >
                                                    {m.stock_after}
                                                    <span
                                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stockLevel(m.stock_after).class}`}
                                                    >
                                                        {
                                                            stockLevel(
                                                                m.stock_after,
                                                            ).label
                                                        }
                                                    </span>
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-[13px] text-muted-foreground capitalize">
                                                    {m.reason === 'adjustment'
                                                        ? 'Penyesuaian'
                                                        : m.reason === 'opname'
                                                          ? 'Stok Opname'
                                                          : m.reason ===
                                                              'purchase_receive'
                                                            ? 'Pembelian'
                                                            : m.reason ===
                                                                'pos_sale'
                                                              ? 'Penjualan'
                                                              : m.reason ===
                                                                  'damage'
                                                                ? 'Rusak'
                                                                : m.reason ===
                                                                    'lost'
                                                                  ? 'Hilang'
                                                                  : m.reason ===
                                                                      'return'
                                                                    ? 'Retur'
                                                                    : m.reason}
                                                </span>
                                                {m.notes && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="max-w-[120px] cursor-default truncate text-[12px] text-muted-foreground/60">
                                                                {m.notes}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="bottom"
                                                            className="max-w-xs text-[12px]"
                                                        >
                                                            {m.notes}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden py-3 lg:table-cell">
                                                <span className="text-[13px] text-muted-foreground">
                                                    {m.user?.name ?? '-'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="h-64 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Package className="size-10 text-neutral-300" />
                                            <p className="text-sm text-muted-foreground">
                                                Belum ada mutasi stok.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-[13px]"
                                                onClick={openAdjust}
                                            >
                                                <Plus className="mr-1 size-3" />{' '}
                                                Buat Mutasi Pertama
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* ── Pagination ── */}
            {movements.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] text-muted-foreground">
                        {movements.total} mutasi
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(1)}
                            disabled={movements.current_page === 1}
                        >
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(movements.current_page - 1)}
                            disabled={movements.current_page === 1}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                            {movements.current_page} / {movements.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(movements.current_page + 1)}
                            disabled={
                                movements.current_page === movements.last_page
                            }
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(movements.last_page)}
                            disabled={
                                movements.current_page === movements.last_page
                            }
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Form Dialog ── */}
            <Dialog
                open={isAdjustOpen}
                onOpenChange={(open) => {
                    setIsAdjustOpen(open);
                    if (!open) reset();
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[520px]">
                    <form ref={formRef} onSubmit={handleAdjust}>
                        <DialogHeader>
                            <DialogTitle>Mutasi Stok Baru</DialogTitle>
                            <DialogDescription>
                                Catat perubahan stok — barang masuk, keluar,
                                atau penyesuaian manual.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 py-4">
                            {/* ── Type Selector ── */}
                            <div className="space-y-2">
                                <Label>Tipe Mutasi</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        {
                                            value: 'in',
                                            label: 'Masuk',
                                            icon: TrendingUp,
                                            color: 'text-emerald-600',
                                            activeColor:
                                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                                            desc: 'Tambah stok',
                                        },
                                        {
                                            value: 'out',
                                            label: 'Keluar',
                                            icon: TrendingDown,
                                            color: 'text-red-600',
                                            activeColor:
                                                'border-red-500 bg-red-50 dark:bg-red-950/30',
                                            desc: 'Kurangi stok',
                                        },
                                        {
                                            value: 'adjustment',
                                            label: 'Sesuaikan',
                                            icon: ListOrdered,
                                            color: 'text-blue-600',
                                            activeColor:
                                                'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
                                            desc: 'Atur stok',
                                        },
                                    ].map((opt) => {
                                        const Icon = opt.icon;
                                        const isActive =
                                            data.type === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() =>
                                                    setData('type', opt.value)
                                                }
                                                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-center text-[12px] transition-all ${
                                                    isActive
                                                        ? `border-2 font-medium ${opt.activeColor}`
                                                        : 'border-neutral-200 text-muted-foreground hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-500'
                                                }`}
                                            >
                                                <Icon
                                                    className={`size-5 ${isActive ? opt.color : ''}`}
                                                />
                                                <span
                                                    className={`text-[11px] font-semibold tracking-wider uppercase ${isActive ? opt.color : ''}`}
                                                >
                                                    {opt.label}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {opt.desc}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Product ── */}
                            <div className="space-y-2">
                                <Label htmlFor="product_id">Produk</Label>
                                <div className="relative mb-1">
                                    <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari produk..."
                                        value={productSearch}
                                        onChange={(e) =>
                                            setProductSearch(e.target.value)
                                        }
                                        className="h-8 pl-7 text-[12px]"
                                    />
                                </div>
                                <Select
                                    value={data.product_id}
                                    onValueChange={(v) => {
                                        setData('product_id', v);
                                        setData('product_variant_id', '');
                                        setProductSearch('');
                                    }}
                                >
                                    <SelectTrigger className="w-full text-[13px]">
                                        <SelectValue placeholder="Pilih produk" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64 w-[var(--radix-select-trigger-width)] min-w-[260px] sm:min-w-[300px]">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={String(p.id)}
                                                    className="text-[13px]"
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        {p.name}
                                                        {p.sku && (
                                                            <span className="text-muted-foreground">
                                                                ({p.sku})
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stockLevel(p.stock).class}`}
                                                        >
                                                            {
                                                                stockLevel(
                                                                    p.stock,
                                                                ).label
                                                            }
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                                                Produk tidak ditemukan
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.product_id && (
                                    <p className="text-[12px] text-red-500">
                                        {errors.product_id}
                                    </p>
                                )}
                            </div>

                            {/* ── Variant ── */}
                            {selectedProduct &&
                                selectedProduct.variants &&
                                selectedProduct.variants.length > 0 && (
                                    <div className="space-y-2">
                                        <Label htmlFor="product_variant_id">
                                            Varian
                                        </Label>
                                        <Select
                                            value={data.product_variant_id}
                                            onValueChange={(v) =>
                                                setData('product_variant_id', v)
                                            }
                                        >
                                            <SelectTrigger className="text-[13px]">
                                                <SelectValue placeholder="Pilih varian" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedProduct.variants.map(
                                                    (v) => (
                                                        <SelectItem
                                                            key={v.id}
                                                            value={String(v.id)}
                                                            className="text-[13px]"
                                                        >
                                                            <span className="inline-flex items-center gap-2">
                                                                {v.name}
                                                                {v.sku && (
                                                                    <span className="text-muted-foreground">
                                                                        ({v.sku}
                                                                        )
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stockLevel(v.stock).class}`}
                                                                >
                                                                    {
                                                                        stockLevel(
                                                                            v.stock,
                                                                        ).label
                                                                    }
                                                                </span>
                                                            </span>
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.product_variant_id && (
                                            <p className="text-[12px] text-red-500">
                                                {errors.product_variant_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                            {/* ── Stock Preview ── */}
                            {selectedProduct && (
                                <div
                                    className={`rounded-lg border p-3 transition-all sm:p-4 ${
                                        resultStock < 0
                                            ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                                            : 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50'
                                    }`}
                                >
                                    {selectedProduct.variants &&
                                        selectedProduct.variants.length > 0 &&
                                        !selectedVariant && (
                                            <p className="mb-3 text-center text-[12px] text-amber-600 dark:text-amber-400">
                                                Produk ini memiliki varian.
                                                Pilih varian untuk melihat stok
                                                varian.
                                            </p>
                                        )}
                                    <div className="grid grid-cols-3 items-center gap-2 text-center sm:gap-4">
                                        <div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {selectedVariant
                                                    ? `Stok (${selectedVariant.name})`
                                                    : 'Stok Saat Ini'}
                                            </p>
                                            <p
                                                className={`mt-0.5 text-xl font-bold ${stockLevel(currentStock).class}`}
                                            >
                                                {currentStock}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div
                                                className={`rounded-full p-1.5 ${
                                                    data.type === 'in'
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                        : data.type === 'out'
                                                          ? 'bg-red-100 dark:bg-red-900/30'
                                                          : 'bg-blue-100 dark:bg-blue-900/30'
                                                }`}
                                            >
                                                {data.type === 'in' ? (
                                                    <ArrowDown className="size-5 text-emerald-600" />
                                                ) : data.type === 'out' ? (
                                                    <ArrowUp className="size-5 text-red-600" />
                                                ) : (
                                                    <Minus className="size-5 text-blue-600" />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Hasil Akhir
                                            </p>
                                            <p
                                                className={`mt-0.5 text-xl font-bold ${
                                                    resultStock < 0
                                                        ? 'text-red-600'
                                                        : data.type === 'in'
                                                          ? 'text-emerald-600'
                                                          : data.type === 'out'
                                                            ? 'text-red-600'
                                                            : 'text-blue-600'
                                                }`}
                                            >
                                                {resultStock}
                                            </p>
                                        </div>
                                    </div>
                                    {resultStock < 0 && (
                                        <p className="mt-2 text-center text-[12px] font-medium text-red-600">
                                            Stok tidak mencukupi!
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── Quantity ── */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Jumlah</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData(
                                                'quantity',
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                        className="h-9 flex-1 text-[13px]"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {QUICK_QTY.map((q) => (
                                        <button
                                            key={q}
                                            type="button"
                                            onClick={() =>
                                                setData('quantity', q)
                                            }
                                            className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all ${
                                                data.quantity === q
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-neutral-200 text-muted-foreground hover:border-neutral-300 hover:text-foreground dark:border-neutral-700 dark:hover:border-neutral-500'
                                            }`}
                                        >
                                            +{q}
                                        </button>
                                    ))}
                                </div>
                                {errors.quantity && (
                                    <p className="text-[12px] text-red-500">
                                        {errors.quantity}
                                    </p>
                                )}
                            </div>

                            {/* ── Reason ── */}
                            <div className="space-y-2">
                                <Label htmlFor="reason">Alasan</Label>
                                <Select
                                    value={data.reason}
                                    onValueChange={(v) => setData('reason', v)}
                                >
                                    <SelectTrigger className="text-[13px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="adjustment">
                                            Penyesuaian Manual
                                        </SelectItem>
                                        <SelectItem value="opname">
                                            Stok Opname
                                        </SelectItem>
                                        <SelectItem value="damage">
                                            Rusak
                                        </SelectItem>
                                        <SelectItem value="lost">
                                            Hilang
                                        </SelectItem>
                                        <SelectItem value="return">
                                            Retur
                                        </SelectItem>
                                        <SelectItem value="other">
                                            Lainnya
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.reason && (
                                    <p className="text-[12px] text-red-500">
                                        {errors.reason}
                                    </p>
                                )}
                            </div>

                            {/* ── Notes ── */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                    className="text-[13px]"
                                    rows={2}
                                    placeholder="Catatan opsional..."
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAdjustOpen(false)}
                                className="text-[13px]"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || resultStock < 0}
                                className="bg-black text-[13px] text-white hover:bg-black/90 dark:bg-white dark:text-black"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Mutasi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
