'use client';
import { Icon } from '@iconify/react';
import { Head, useForm, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Download,
    MoreHorizontal,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Banknote,
    X,
    Trash2,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
    is_active: boolean;
    created_at: string;
}

interface Props {
    methods: PaymentMethod[];
}

export default function PaymentMethods({ methods = [] }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
        null,
    );
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedSearch = useCallback((value: string) => {
        setSearchInput(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(value);
            setCurrentPage(1);
        }, 300);
    }, []);

    useEffect(
        () => () => {
            if (searchTimeoutRef.current)
                clearTimeout(searchTimeoutRef.current);
        },
        [],
    );

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            type: '',
            is_active: true,
        });

    const filteredMethods = useMemo(() => {
        return methods.filter(
            (method) =>
                method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                method.type.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [methods, searchQuery]);

    const paginatedMethods = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;

        return filteredMethods.slice(start, start + rowsPerPage);
    }, [filteredMethods, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredMethods.length / rowsPerPage);

    const openCreateDialog = () => {
        setEditingMethod(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEditDialog = (method: PaymentMethod) => {
        setEditingMethod(method);
        setData({
            name: method.name,
            type: method.type,
            is_active: Boolean(method.is_active),
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMethod) {
            put(route('payment-methods.update', editingMethod.id), {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Metode pembayaran berhasil diperbarui');
                },
                onError: () => {
                    toast.error('Gagal memperbarui metode pembayaran');
                },
                preserveScroll: true,
            });
        } else {
            post(route('payment-methods.store'), {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    toast.success('Metode pembayaran berhasil dibuat');
                },
                onError: () => {
                    toast.error('Gagal membuat metode pembayaran');
                },
                preserveScroll: true,
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!deletingId) return;
        router.delete(route('payment-methods.destroy', deletingId), {
            onSuccess: () => {
                toast.success('Metode pembayaran berhasil dihapus');
                setDeletingId(null);
            },
            onError: () => {
                toast.error('Gagal menghapus metode pembayaran');
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen space-y-6 bg-white p-4 font-sans md:p-8 dark:bg-neutral-950">
            <Head title="Metode Pembayaran" />

            {/* HEADER */}
            <div className="flex flex-col justify-between gap-4 px-2 md:flex-row md:items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Metode Pembayaran
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Kelola jenis metode pembayaran untuk Amerta POS.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={openCreateDialog}
                        size="sm"
                        className="flex h-9 items-center gap-2 bg-black px-3 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        Tambah <Plus className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-col justify-between gap-4 px-2 md:flex-row md:items-center">
                <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari metode pembayaran..."
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
            </div>

            {/* TABLE */}
            <Card className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                    <TableHead className="w-[120px] py-3 text-center text-[13px] font-semibold text-foreground">
                                        ID
                                    </TableHead>
                                    <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                        Nama Metode
                                    </TableHead>
                                    <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                        Tipe
                                    </TableHead>
                                    <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                        Status
                                    </TableHead>
                                    <TableHead className="py-3 pr-10 text-right text-[13px] font-semibold text-foreground">
                                        Tanggal Dibuat
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {paginatedMethods.length > 0 ? (
                                        paginatedMethods.map((method) => (
                                            <motion.tr
                                                key={method.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                            >
                                                <TableCell className="py-3 text-center text-[13px] font-medium text-muted-foreground">
                                                    PM-
                                                    {method.id
                                                        .toString()
                                                        .padStart(4, '0')}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="max-w-[200px] truncate text-[13px] font-semibold text-foreground">
                                                            {method.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-md border-neutral-200 bg-neutral-50 px-1.5 py-0 text-[10px] font-bold text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900"
                                                    >
                                                        {method.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        {method.is_active ? (
                                                            <>
                                                                <CheckCircle2 className="size-3.5 text-blue-500" />
                                                                <span className="text-[13px] font-medium text-foreground">
                                                                    Aktif
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="size-3.5 text-neutral-400" />
                                                                <span className="text-[13px] font-medium text-neutral-500">
                                                                    Nonaktif
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 pr-10 text-right">
                                                    <span className="text-[13px] text-muted-foreground">
                                                        {new Date(
                                                            method.created_at,
                                                        ).toLocaleDateString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 pr-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                            >
                                                                <MoreHorizontal className="size-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel className="px-3 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                                                                Aksi
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openEditDialog(
                                                                        method,
                                                                    )
                                                                }
                                                                className="cursor-pointer gap-2"
                                                            >
                                                                <Icon
                                                                    icon="solar:pen-linear"
                                                                    width={14}
                                                                />{' '}
                                                                Ubah
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setDeletingId(
                                                                        method.id,
                                                                    )
                                                                }
                                                                className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
                                                            >
                                                                <Icon
                                                                    icon="solar:trash-bin-trash-linear"
                                                                    width={14}
                                                                />{' '}
                                                                Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-64 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <Banknote className="size-10 text-neutral-300" />
                                                    <p className="text-sm text-muted-foreground">
                                                        {searchInput
                                                            ? 'Tidak ada metode pembayaran ditemukan.'
                                                            : 'Belum ada metode pembayaran. Tambah metode baru untuk memulai.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* PAGINATION SECTION */}
            <div className="flex flex-col justify-between gap-4 px-2 pb-10 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                    <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(v) => setRowsPerPage(parseInt(v))}
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
                        Baris per halaman
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
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1),
                            )
                        }
                        disabled={
                            currentPage === totalPages || totalPages === 0
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
                            currentPage === totalPages || totalPages === 0
                        }
                    >
                        <ChevronsRight className="size-4" />
                    </Button>
                </div>
            </div>

            {/* DIALOG FORM */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingMethod
                                    ? 'Edit Metode Pembayaran'
                                    : 'Tambah Metode Pembayaran'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingMethod
                                    ? 'Perbarui informasi metode pembayaran.'
                                    : 'Buat metode pembayaran baru.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Metode</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className={
                                        errors.name
                                            ? 'h-10 border-red-500'
                                            : 'h-10'
                                    }
                                    placeholder="Contoh: BCA, QRIS, Tunai"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-[11px] font-medium text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipe</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(v) => setData('type', v)}
                                >
                                    <SelectTrigger
                                        className={
                                            errors.type
                                                ? 'h-10 border-red-500'
                                                : 'h-10'
                                        }
                                    >
                                        <SelectValue placeholder="Pilih tipe pembayaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">
                                            Cash
                                        </SelectItem>
                                        <SelectItem value="E-Wallet">
                                            E-Wallet
                                        </SelectItem>
                                        <SelectItem value="Bank Transfer">
                                            Bank Transfer
                                        </SelectItem>
                                        <SelectItem value="Debit/Credit Card">
                                            Debit/Credit Card
                                        </SelectItem>
                                        <SelectItem value="QRIS">
                                            QRIS
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <p className="text-[11px] font-medium text-red-500">
                                        {errors.type}
                                    </p>
                                )}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(c) =>
                                        setData('is_active', c === true)
                                    }
                                />
                                <Label
                                    htmlFor="is_active"
                                    className="cursor-pointer"
                                >
                                    Aktif
                                </Label>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-black text-white dark:bg-white dark:text-black"
                            >
                                {editingMethod
                                    ? 'Simpan Perubahan'
                                    : 'Simpan Metode'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog
                open={deletingId !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletingId(null);
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Metode Pembayaran</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus metode pembayaran
                            ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeletingId(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
