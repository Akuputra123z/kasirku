'use client';

import { Head, useForm, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus,
    Search,
    XCircle,
    CheckCircle2,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Trash2,
    PackageCheck,
    ArrowUpDown,
    ArrowDown,
    ArrowUp,
    RotateCcw,
    X,
    Package,
    Clock,
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

interface Supplier {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    stock: number;
}

interface PurchaseOrderDetail {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    received_quantity: number;
    unit_cost: number;
    subtotal: number;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier: Supplier | null;
    user: { name: string };
    order_date: string;
    received_date: string | null;
    total_amount: number;
    status: string;
    notes: string | null;
    details: PurchaseOrderDetail[];
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
    purchaseOrders: Paginator<PurchaseOrder>;
    filters: {
        search: string | null;
        status: string | null;
        sort_field: string;
        sort_dir: string;
    };
    suppliers: Supplier[];
    products: Product[];
    flash?: { success?: string; error?: string };
}

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

const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
        pending:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
        received:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
    };
    return variants[status] || 'bg-neutral-100 text-neutral-600';
};

const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
        pending: 'Pending',
        received: 'Diterima',
    };
    return labels[status] || status;
};

export default function Index({
    purchaseOrders,
    filters,
    suppliers,
    products,
    flash,
}: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [sortField, setSortField] = useState(
        filters?.sort_field ?? 'created_at',
    );
    const [sortDir, setSortDir] = useState(filters?.sort_dir ?? 'desc');
    const [productSearch, setProductSearch] = useState('');
    const [rawPrices, setRawPrices] = useState<Record<number, string>>({});

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            supplier_id: '',
            order_date: new Date().toISOString().split('T')[0],
            notes: '',
            items: [{ product_id: '', quantity: 1, unit_cost: 0 }] as {
                product_id: string | number;
                quantity: number;
                unit_cost: number;
            }[],
        });

    const applyFilters = useCallback(
        (overrides: Record<string, string | null> = {}) => {
            const params: Record<string, string | null> = {
                search: searchQuery || null,
                status: statusFilter === 'all' ? null : statusFilter,
                sort_field: sortField,
                sort_dir: sortDir,
                ...overrides,
            };
            router.get('/purchase-orders', params, { preserveState: true });
        },
        [searchQuery, statusFilter, sortField, sortDir],
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
        setStatusFilter('all');
        router.get('/purchase-orders', {}, { preserveState: true });
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { product_id: '', quantity: 1, unit_cost: 0 },
        ]);
    };

    const removeItem = (idx: number) => {
        if (data.items.length <= 1) return;
        setData(
            'items',
            data.items.filter((_, i) => i !== idx),
        );
    };

    const updateItem = (idx: number, field: string, value: any) => {
        const items = [...data.items];
        items[idx] = { ...items[idx], [field]: value };
        setData('items', items);
    };

    const openCreate = () => {
        reset();
        clearErrors();
        setProductSearch('');
        setRawPrices({});
        setIsCreateOpen(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/purchase-orders', {
            onSuccess: () => {
                setIsCreateOpen(false);
                toast.success('Purchase order berhasil dibuat');
            },
            preserveScroll: true,
        });
    };

    const handleReceive = (po: PurchaseOrder) => {
        setReceivePo(po);
        setIsReceiveOpen(true);
    };

    const confirmReceive = () => {
        if (!receivePo) return;
        router.post(
            `/purchase-orders/${receivePo.id}/receive`,
            {},
            {
                onSuccess: () => {
                    setIsReceiveOpen(false);
                    setReceivePo(null);
                    toast.success('Stok berhasil diterima');
                },
                preserveScroll: true,
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(`/purchase-orders/${deleteId}`, {
            onSuccess: () => {
                toast.success('Purchase order berhasil dihapus');
                setDeleteId(null);
            },
            preserveScroll: true,
        });
    };

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

    const totalPending = purchaseOrders.data.filter(
        (po) => po.status === 'pending',
    ).length;
    const totalReceived = purchaseOrders.data.filter(
        (po) => po.status === 'received',
    ).length;
    const totalItems = purchaseOrders.data.reduce(
        (sum, po) => sum + (po.details?.length || 0),
        0,
    );

    return (
        <div className="min-h-screen space-y-5 bg-neutral-50 p-4 md:p-8 dark:bg-neutral-950">
            <Head title="Purchase Orders" />

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <Card className="border-amber-200/60 bg-white shadow-none dark:border-amber-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
                            <ClipboardList className="size-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Total PO
                            </p>
                            <p className="text-lg font-bold">
                                {purchaseOrders.total}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-200/60 bg-white shadow-none dark:border-amber-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
                            <Package className="size-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Total Item
                            </p>
                            <p className="text-lg font-bold">{totalItems}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-200/60 bg-white shadow-none dark:border-amber-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
                            <Clock className="size-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Pending
                            </p>
                            <p className="text-lg font-bold text-amber-600">
                                {totalPending}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-200/60 bg-white shadow-none dark:border-emerald-900/60 dark:bg-neutral-950">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                            <PackageCheck className="size-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Diterima
                            </p>
                            <p className="text-lg font-bold text-emerald-600">
                                {totalReceived}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Header ── */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Purchase Orders
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Kelola pembelian stok dari supplier.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                >
                    <Plus className="size-3.5" /> PO Baru
                </Button>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nomor PO atau supplier..."
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
                    value={statusFilter}
                    onValueChange={(v) => {
                        setStatusFilter(v);
                        applyFilters({ status: v === 'all' ? null : v });
                    }}
                >
                    <SelectTrigger className="h-9 w-auto min-w-[120px] text-[13px]">
                        <SelectValue placeholder="Semua status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-[13px]">
                            Semua Status
                        </SelectItem>
                        <SelectItem value="pending" className="text-[13px]">
                            Pending
                        </SelectItem>
                        <SelectItem value="received" className="text-[13px]">
                            Diterima
                        </SelectItem>
                    </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== 'all') && (
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

            {/* ── Table ── */}
            <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                <TableHead
                                    className="cursor-pointer py-3 text-[13px] font-semibold whitespace-nowrap text-foreground select-none"
                                    onClick={() => toggleSort('po_number')}
                                >
                                    <span className="inline-flex items-center">
                                        PO # <SortIcon field="po_number" />
                                    </span>
                                </TableHead>
                                <TableHead className="py-3 text-[13px] font-semibold whitespace-nowrap text-foreground">
                                    Supplier
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer py-3 text-[13px] font-semibold whitespace-nowrap text-foreground select-none"
                                    onClick={() => toggleSort('total_amount')}
                                >
                                    <span className="inline-flex items-center">
                                        Total <SortIcon field="total_amount" />
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer py-3 text-[13px] font-semibold whitespace-nowrap text-foreground select-none"
                                    onClick={() => toggleSort('status')}
                                >
                                    <span className="inline-flex items-center">
                                        Status <SortIcon field="status" />
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer py-3 text-[13px] font-semibold whitespace-nowrap text-foreground select-none"
                                    onClick={() => toggleSort('order_date')}
                                >
                                    <span className="inline-flex items-center">
                                        Tanggal <SortIcon field="order_date" />
                                    </span>
                                </TableHead>
                                <TableHead className="w-[100px] py-3" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.data.length > 0 ? (
                                purchaseOrders.data.map((po) => (
                                    <TableRow
                                        key={po.id}
                                        className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                    >
                                        <TableCell className="py-3">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-default text-[13px] font-semibold text-foreground">
                                                        {po.po_number}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="bottom"
                                                    className="text-[12px]"
                                                >
                                                    {po.details?.length || 0}{' '}
                                                    item &middot; Dibuat oleh{' '}
                                                    {po.user?.name}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="text-[13px] text-muted-foreground">
                                                {po.supplier?.name || '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="text-[13px] font-medium">
                                                Rp{' '}
                                                {Number(
                                                    po.total_amount,
                                                ).toLocaleString('id-ID')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge
                                                className={`text-[11px] font-medium ${statusBadge(po.status)}`}
                                                variant="outline"
                                            >
                                                {statusLabel(po.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="text-[13px] text-muted-foreground">
                                                {new Date(
                                                    po.order_date,
                                                ).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 pr-4">
                                            <div className="flex items-center gap-1">
                                                {po.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                handleReceive(
                                                                    po,
                                                                )
                                                            }
                                                            title="Terima stok"
                                                        >
                                                            <PackageCheck className="size-4 text-emerald-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    po.id,
                                                                )
                                                            }
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="size-4 text-red-500" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-64 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <ClipboardList className="size-10 text-neutral-300" />
                                            <p className="text-sm text-muted-foreground">
                                                Belum ada purchase order.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-[13px]"
                                                onClick={openCreate}
                                            >
                                                <Plus className="mr-1 size-3" />{' '}
                                                Buat PO Pertama
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
            {purchaseOrders.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] text-muted-foreground">
                        {purchaseOrders.total} purchase order
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(1)}
                            disabled={purchaseOrders.current_page === 1}
                        >
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                                goToPage(purchaseOrders.current_page - 1)
                            }
                            disabled={purchaseOrders.current_page === 1}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                            {purchaseOrders.current_page} /{' '}
                            {purchaseOrders.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                                goToPage(purchaseOrders.current_page + 1)
                            }
                            disabled={
                                purchaseOrders.current_page ===
                                purchaseOrders.last_page
                            }
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(purchaseOrders.last_page)}
                            disabled={
                                purchaseOrders.current_page ===
                                purchaseOrders.last_page
                            }
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Create PO Dialog ── */}
            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        reset();
                        setRawPrices({});
                    }
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[600px]">
                    <form onSubmit={handleCreate} noValidate>
                        <DialogHeader>
                            <DialogTitle>Purchase Order Baru</DialogTitle>
                            <DialogDescription>
                                Buat purchase order untuk pengadaan stok dari
                                supplier.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier_id">
                                        Supplier
                                    </Label>
                                    <Select
                                        value={data.supplier_id}
                                        onValueChange={(v) =>
                                            setData('supplier_id', v)
                                        }
                                    >
                                        <SelectTrigger className="text-[13px]">
                                            <SelectValue placeholder="Pilih supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((s) => (
                                                <SelectItem
                                                    key={s.id}
                                                    value={String(s.id)}
                                                    className="text-[13px]"
                                                >
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="order_date">
                                        Tanggal PO
                                    </Label>
                                    <Input
                                        id="order_date"
                                        type="date"
                                        value={data.order_date}
                                        onChange={(e) =>
                                            setData(
                                                'order_date',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9 text-[13px]"
                                    />
                                    {errors.order_date && (
                                        <p className="text-[12px] text-red-500">
                                            {errors.order_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[13px] font-medium">
                                        Item
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addItem}
                                        className="h-7 text-[12px]"
                                    >
                                        <Plus className="mr-1 size-3" /> Tambah
                                        Item
                                    </Button>
                                </div>
                                {errors.items && (
                                    <p className="text-[12px] text-red-500">
                                        {errors.items}
                                    </p>
                                )}
                                <div className="relative">
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
                                {data.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="space-y-2 rounded-lg border p-3"
                                    >
                                        <div className="space-y-1">
                                            <Label className="text-[11px] text-muted-foreground">
                                                Produk
                                            </Label>
                                            <Select
                                                value={String(item.product_id)}
                                                onValueChange={(v) =>
                                                    updateItem(
                                                        idx,
                                                        'product_id',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-full text-[12px]">
                                                    <SelectValue placeholder="Pilih produk" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-64 w-[var(--radix-select-trigger-width)] min-w-[200px]">
                                                    {filteredProducts.length >
                                                    0 ? (
                                                        filteredProducts.map(
                                                            (p) => (
                                                                <SelectItem
                                                                    key={p.id}
                                                                    value={String(
                                                                        p.id,
                                                                    )}
                                                                    className="text-[12px]"
                                                                >
                                                                    <span className="inline-flex items-center gap-2">
                                                                        {p.name}
                                                                        {p.sku && (
                                                                            <span className="text-muted-foreground">
                                                                                (
                                                                                {
                                                                                    p.sku
                                                                                }

                                                                                )
                                                                            </span>
                                                                        )}
                                                                        <span
                                                                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stockLevel(p.stock).class}`}
                                                                        >
                                                                            {
                                                                                stockLevel(
                                                                                    p.stock,
                                                                                )
                                                                                    .label
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                </SelectItem>
                                                            ),
                                                        )
                                                    ) : (
                                                        <div className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                                                            Produk tidak
                                                            ditemukan
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors[
                                                `items.${idx}.product_id`
                                            ] && (
                                                <p className="text-[11px] text-red-500">
                                                    {
                                                        errors[
                                                            `items.${idx}.product_id`
                                                        ]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Qty
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            idx,
                                                            'quantity',
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 1,
                                                        )
                                                    }
                                                    className="h-8 w-full text-[12px]"
                                                />
                                                {errors[
                                                    `items.${idx}.quantity`
                                                ] && (
                                                    <p className="text-[11px] text-red-500">
                                                        {
                                                            errors[
                                                                `items.${idx}.quantity`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-[2] space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Harga
                                                </Label>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={
                                                        idx in rawPrices
                                                            ? rawPrices[idx]
                                                            : String(
                                                                  item.unit_cost,
                                                              )
                                                    }
                                                    onChange={(e) => {
                                                        setRawPrices({
                                                            ...rawPrices,
                                                            [idx]: e.target
                                                                .value,
                                                        });
                                                    }}
                                                    onBlur={() => {
                                                        const raw =
                                                            rawPrices[idx];
                                                        if (raw === undefined)
                                                            return;
                                                        const cleaned =
                                                            raw.replace(
                                                                /[^0-9.]/g,
                                                                '',
                                                            );
                                                        const parsed =
                                                            parseFloat(cleaned);
                                                        const val = isNaN(
                                                            parsed,
                                                        )
                                                            ? 0
                                                            : parsed;
                                                        updateItem(
                                                            idx,
                                                            'unit_cost',
                                                            val,
                                                        );
                                                        setRawPrices((prev) => {
                                                            const next = {
                                                                ...prev,
                                                            };
                                                            delete next[idx];
                                                            return next;
                                                        });
                                                    }}
                                                    className="h-8 w-full text-[12px]"
                                                />
                                                {errors[
                                                    `items.${idx}.unit_cost`
                                                ] && (
                                                    <p className="text-[11px] text-red-500">
                                                        {
                                                            errors[
                                                                `items.${idx}.unit_cost`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 shrink-0 text-red-500"
                                                onClick={() => removeItem(idx)}
                                                disabled={
                                                    data.items.length <= 1
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

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
                                onClick={() => setIsCreateOpen(false)}
                                className="text-[13px]"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-black text-[13px] text-white hover:bg-black/90 dark:bg-white dark:text-black"
                            >
                                {processing ? 'Menyimpan...' : 'Buat PO'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Receive Dialog ── */}
            <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Terima Purchase Order</DialogTitle>
                        <DialogDescription>
                            Terima stok untuk PO {receivePo?.po_number}. Semua
                            item akan ditambahkan ke inventaris.
                        </DialogDescription>
                    </DialogHeader>
                    {receivePo && (
                        <div className="space-y-3">
                            {receivePo.details.map((d) => (
                                <div
                                    key={d.id}
                                    className="flex justify-between rounded-lg border p-3 text-[13px]"
                                >
                                    <span className="font-medium">
                                        {d.product.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {d.quantity} x Rp{' '}
                                        {Number(d.unit_cost).toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between border-t pt-2 text-[13px] font-semibold">
                                <span>Total</span>
                                <span>
                                    Rp{' '}
                                    {Number(
                                        receivePo.total_amount,
                                    ).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsReceiveOpen(false)}
                            className="text-[13px]"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmReceive}
                            disabled={processing}
                            className="bg-emerald-600 text-[13px] text-white hover:bg-emerald-700"
                        >
                            {processing
                                ? 'Memproses...'
                                : 'Terima & Tambah Stok'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ── */}
            <Dialog
                open={!!deleteId}
                onOpenChange={(open) => {
                    if (!open) setDeleteId(null);
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Hapus Purchase Order</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus? Tindakan ini tidak bisa
                            dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            className="text-[13px]"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            className="text-[13px]"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
