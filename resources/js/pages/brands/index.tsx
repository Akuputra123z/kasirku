'use client';
import { Head, useForm, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
    Plus,
    Search,
    CheckCircle2,
    Tag,
    X,
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { ImportDialog } from '@/components/import-dialog';
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

interface Brand {
    id: number;
    name: string;
    description: string | null;
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
    brands: Paginator<Brand>;
    filters: { search: string | null };
    flash?: { success?: string; error?: string };
}

export default function Index({ brands, filters, flash }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            description: '',
        });

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedSearch = useCallback((value: string) => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            router.get(
                route('brands.index'),
                { search: value || null },
                { preserveState: true, replace: true },
            );
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

    const goToPage = (page: number) => {
        router.get(
            route('brands.index'),
            { page, search: filters?.search || null },
            { preserveState: true },
        );
    };

    const openCreateDialog = () => {
        setEditingBrand(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEditDialog = (brand: Brand) => {
        setEditingBrand(brand);
        setData({
            name: brand.name,
            description: brand.description || '',
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingBrand) {
            put(route('brands.update', editingBrand.id), {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Brand berhasil diperbarui');
                },
                preserveScroll: true,
            });
        } else {
            post(route('brands.store'), {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    toast.success('Brand berhasil dibuat');
                },
                preserveScroll: true,
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteId) {
            return;
        }

        router.delete(route('brands.destroy', deleteId), {
            onSuccess: () => {
                toast.success('Brand berhasil dihapus');
                setDeleteId(null);
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen space-y-6 bg-neutral-50 p-4 font-sans md:p-8 dark:bg-neutral-950">
            <Head title="Brand" />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Brand
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Kelola merek produk.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsImportOpen(true)}
                        variant="outline"
                        className="h-9 gap-2 px-4 text-[13px]"
                    >
                        Import CSV
                    </Button>
                    <Button
                        onClick={openCreateDialog}
                        className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                    >
                        <Plus className="size-3.5" /> Tambah Brand
                    </Button>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1 md:w-72">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari brand..."
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
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                    <TableHead className="w-[100px] py-3 text-center text-[13px] font-semibold text-foreground">
                                        Kode
                                    </TableHead>
                                    <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                        Nama Brand
                                    </TableHead>
                                    <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                        Deskripsi
                                    </TableHead>
                                    <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                        Status
                                    </TableHead>
                                    <TableHead className="py-3 pr-6 text-right text-[13px] font-semibold text-foreground">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {brands.data.length > 0 ? (
                                        brands.data.map((brand) => (
                                            <motion.tr
                                                key={brand.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                            >
                                                <TableCell className="py-3 text-center text-[13px] font-medium text-muted-foreground">
                                                    BRD-
                                                    {brand.id
                                                        .toString()
                                                        .padStart(4, '0')}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className="text-[13px] font-semibold text-foreground">
                                                        {brand.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className="text-[13px] text-muted-foreground">
                                                        {brand.description ||
                                                            '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="size-3.5 text-blue-500" />
                                                        <span className="text-[13px] font-medium">
                                                            Aktif
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 pr-6 text-right">
                                                    <span className="text-[13px] text-muted-foreground">
                                                        {new Date(
                                                            brand.created_at,
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
                                                                        brand,
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
                                                                        brand.id,
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
                                                    <Tag className="size-10 text-neutral-300" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Tidak ada brand
                                                        ditemukan.
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

            {brands.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">
                        {brands.total} brand
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(1)}
                            disabled={brands.current_page === 1}
                        >
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(brands.current_page - 1)}
                            disabled={brands.current_page === 1}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                            {brands.current_page} / {brands.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(brands.current_page + 1)}
                            disabled={brands.current_page === brands.last_page}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(brands.last_page)}
                            disabled={brands.current_page === brands.last_page}
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingBrand ? 'Edit Brand' : 'Tambah Brand'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingBrand
                                    ? 'Perbarui informasi brand.'
                                    : 'Buat brand produk baru.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Brand</Label>
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
                                    placeholder="Contoh: ASUS"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-[11px] font-medium text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">
                                    Deskripsi (Opsional)
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Keterangan brand..."
                                    className="min-h-[100px]"
                                />
                                {errors.description && (
                                    <p className="text-[11px] font-medium text-red-500">
                                        {errors.description}
                                    </p>
                                )}
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
                                {editingBrand
                                    ? 'Simpan Perubahan'
                                    : 'Simpan Brand'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ImportDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                title="Import Brand"
                description="Upload file CSV untuk menambahkan banyak brand sekaligus."
                route={route('brands.import')}
                templateUrl={route('brands.import.template')}
            />

            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteId(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Brand</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus brand ini?
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmDelete}
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
