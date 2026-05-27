'use client';

import { Head, useForm, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus,
    Search,
    Truck,
    X,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface Supplier {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    notes: string | null;
    is_active: boolean;
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
    suppliers: Paginator<Supplier>;
    filters: { search: string | null };
    flash?: { success?: string; error?: string };
}

export default function Index({ suppliers, filters, flash }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            email: '',
            phone: '',
            address: '',
            pic_name: '',
            pic_phone: '',
            notes: '',
            is_active: true,
        });

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedSearch = useCallback((value: string) => {
        setSearchQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            router.get(
                '/suppliers',
                { search: value || null },
                { preserveState: true, replace: true },
            );
        }, 300);
    }, []);

    useEffect(
        () => () => {
            if (searchTimeoutRef.current)
                clearTimeout(searchTimeoutRef.current);
        },
        [],
    );

    const goToPage = (page: number) => {
        router.get(
            '/suppliers',
            { page, search: filters?.search || null },
            { preserveState: true },
        );
    };

    const openCreate = () => {
        setEditingSupplier(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setData({
            name: supplier.name,
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            pic_name: supplier.pic_name || '',
            pic_phone: supplier.pic_phone || '',
            notes: supplier.notes || '',
            is_active: supplier.is_active,
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            put(`/suppliers/${editingSupplier.id}`, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Supplier berhasil diperbarui');
                },
                preserveScroll: true,
            });
        } else {
            post('/suppliers', {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    toast.success('Supplier berhasil ditambahkan');
                },
                preserveScroll: true,
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(`/suppliers/${deleteId}`, {
            onSuccess: () => {
                toast.success('Supplier berhasil dihapus');
                setDeleteId(null);
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen space-y-6 bg-neutral-50 p-4 md:p-8 dark:bg-neutral-950">
            <Head title="Supplier" />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Supplier
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Kelola data supplier produk.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                >
                    <Plus className="size-3.5" /> Tambah Supplier
                </Button>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1 md:w-72">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari supplier..."
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
            </div>

            <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                    Nama
                                </TableHead>
                                <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                    Kontak
                                </TableHead>
                                <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                    PIC
                                </TableHead>
                                <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                    Status
                                </TableHead>
                                <TableHead className="py-3 pr-6 text-right text-[13px] font-semibold text-foreground">
                                    Tanggal
                                </TableHead>
                                <TableHead className="w-[50px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {suppliers.data.length > 0 ? (
                                    suppliers.data.map((supplier) => (
                                        <motion.tr
                                            key={supplier.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                        >
                                            <TableCell className="py-3">
                                                <span className="text-[13px] font-semibold text-foreground">
                                                    {supplier.name}
                                                </span>
                                                {supplier.address && (
                                                    <p className="text-[12px] text-muted-foreground">
                                                        {supplier.address}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-[13px] text-muted-foreground">
                                                    {supplier.email && (
                                                        <>
                                                            {supplier.email}
                                                            <br />
                                                        </>
                                                    )}
                                                    {supplier.phone}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-[13px] text-muted-foreground">
                                                    {supplier.pic_name && (
                                                        <>
                                                            {supplier.pic_name}
                                                            <br />
                                                        </>
                                                    )}
                                                    {supplier.pic_phone}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                                                        supplier.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900'
                                                    }`}
                                                >
                                                    <span
                                                        className={`size-1.5 rounded-full ${supplier.is_active ? 'bg-emerald-500' : 'bg-neutral-400'}`}
                                                    />
                                                    {supplier.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 pr-6 text-right">
                                                <span className="text-[13px] text-muted-foreground">
                                                    {new Date(
                                                        supplier.created_at,
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
                                                                openEdit(
                                                                    supplier,
                                                                )
                                                            }
                                                            className="cursor-pointer gap-2"
                                                        >
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    supplier.id,
                                                                )
                                                            }
                                                            className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
                                                        >
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
                                                <Truck className="size-10 text-neutral-300" />
                                                <p className="text-sm text-muted-foreground">
                                                    Tidak ada supplier
                                                    ditemukan.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {suppliers.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">
                        {suppliers.total} supplier
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(1)}
                            disabled={suppliers.current_page === 1}
                        >
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(suppliers.current_page - 1)}
                            disabled={suppliers.current_page === 1}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                            {suppliers.current_page} / {suppliers.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(suppliers.current_page + 1)}
                            disabled={
                                suppliers.current_page === suppliers.last_page
                            }
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(suppliers.last_page)}
                            disabled={
                                suppliers.current_page === suppliers.last_page
                            }
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[500px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingSupplier
                                    ? 'Edit Supplier'
                                    : 'Tambah Supplier'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSupplier
                                    ? 'Perbarui informasi supplier.'
                                    : 'Tambah supplier produk baru.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Supplier</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="text-[13px]"
                                />
                                {errors.name && (
                                    <p className="text-[12px] text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        className="text-[13px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telepon</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                        className="text-[13px]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                    className="text-[13px]"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pic_name">Nama PIC</Label>
                                    <Input
                                        id="pic_name"
                                        value={data.pic_name}
                                        onChange={(e) =>
                                            setData('pic_name', e.target.value)
                                        }
                                        className="text-[13px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pic_phone">
                                        Telepon PIC
                                    </Label>
                                    <Input
                                        id="pic_phone"
                                        value={data.pic_phone}
                                        onChange={(e) =>
                                            setData('pic_phone', e.target.value)
                                        }
                                        className="text-[13px]"
                                    />
                                </div>
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
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="text-[13px]"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-black text-[13px] text-white hover:bg-black/90 dark:bg-white dark:text-black"
                            >
                                {editingSupplier ? 'Simpan' : 'Buat'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleteId}
                onOpenChange={(open) => {
                    if (!open) setDeleteId(null);
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Hapus Supplier</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus supplier ini?
                            Tindakan ini tidak dapat dibatalkan.
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
