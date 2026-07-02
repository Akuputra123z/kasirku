'use client';
import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
    Plus,
    Search,
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

interface MarketplaceCategoryGroup {
    id: number;
    name: string;
    children: { id: number; name: string }[];
}

interface MarketplaceCategoryRef {
    id: number;
    name: string;
    parent_id: number | null;
}

interface Category {
    id: number;
    name: string;
    description: string | null;
    marketplace_category_id: number | null;
    marketplace_category: MarketplaceCategoryRef | null;
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
    categories: Paginator<Category>;
    filters: { search: string | null };
    marketplaceCategories: MarketplaceCategoryGroup[];
    flash?: { success?: string; error?: string };
}

export default function Index({ categories, filters, marketplaceCategories, flash }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [marketplaceParentId, setMarketplaceParentId] = useState('none');
    const [marketplaceChildId, setMarketplaceChildId] = useState('none');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, put, errors, reset, clearErrors } =
        useForm({
            name: '',
            description: '',
        });

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (marketplaceChildId !== 'none') {
            const child = marketplaceCategories
                .flatMap((p) => p.children)
                .find((c) => c.id.toString() === marketplaceChildId);
            if (child) {
                setData('name', child.name);
                return;
            }
        }
        if (marketplaceParentId !== 'none') {
            const parent = marketplaceCategories.find(
                (p) => p.id.toString() === marketplaceParentId,
            );
            if (parent) {
                setData('name', parent.name);
                return;
            }
        }
    }, [marketplaceParentId, marketplaceChildId, marketplaceCategories]);

    const debouncedSearch = useCallback((value: string) => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            router.get(
                route('categories.index'),
                { search: value || null },
                { preserveState: true, replace: true },
            );
        }, 300);
    }, []);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

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
            route('categories.index'),
            { page, search: filters?.search || null },
            { preserveState: true },
        );
    };

    const openCreateDialog = () => {
        setEditingCategory(null);
        reset();
        clearErrors();
        setMarketplaceParentId('none');
        setMarketplaceChildId('none');
        setIsDialogOpen(true);
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description || '',
        });
        clearErrors();

        if (category.marketplace_category && category.marketplace_category.parent_id) {
            setMarketplaceParentId(category.marketplace_category.parent_id.toString());
            setMarketplaceChildId(category.marketplace_category.id.toString());
        } else if (category.marketplace_category) {
            setMarketplaceParentId(category.marketplace_category.id.toString());
            setMarketplaceChildId('none');
        } else {
            setMarketplaceParentId('none');
            setMarketplaceChildId('none');
        }

        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        data.marketplace_category_id = marketplaceChildId !== 'none'
            ? Number(marketplaceChildId)
            : marketplaceParentId !== 'none'
                ? Number(marketplaceParentId)
                : null;

        setIsSubmitting(true);

        const options = {
            onSuccess: () => {
                setIsDialogOpen(false);
                if (!editingCategory) {
                    reset();
                    setMarketplaceParentId('none');
                    setMarketplaceChildId('none');
                }
                setIsSubmitting(false);
            },
            onError: (err: Record<string, string>) => {
                toast.error(Object.values(err).join('\n') || 'Terjadi kesalahan');
                setIsSubmitting(false);
            },
            preserveScroll: true,
        };

        if (editingCategory) {
            put(route('categories.update', editingCategory.id), options);
        } else {
            post(route('categories.store'), options);
        }
    };

    const confirmDelete = () => {
        if (!deleteId) {
            return;
        }

        router.delete(route('categories.destroy', deleteId), {
            onSuccess: () => {
                toast.success('Kategori berhasil dihapus');
                setDeleteId(null);
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen space-y-6 bg-neutral-50 p-4 font-sans md:p-8 dark:bg-neutral-950">
            <Head title="Kategori" />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Kategori
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Kelola klasifikasi produk.
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
                        <Plus className="size-3.5" /> Tambah Kategori
                    </Button>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1 md:w-72">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari kategori..."
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
                                        Nama Kategori
                                    </TableHead>
                                    <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                        Deskripsi
                                    </TableHead>
                                    <TableHead className="py-3 pr-6 text-right text-[13px] font-semibold text-foreground">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {categories.data.length > 0 ? (
                                        categories.data.map((category) => (
                                            <motion.tr
                                                key={category.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                            >
                                                <TableCell className="py-3 text-center text-[13px] font-medium text-muted-foreground">
                                                    CAT-
                                                    {category.id
                                                        .toString()
                                                        .padStart(4, '0')}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className="text-[13px] font-semibold text-foreground">
                                                        {category.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className="text-[13px] text-muted-foreground">
                                                        {category.description ||
                                                            '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 pr-6 text-right">
                                                    <span className="text-[13px] text-muted-foreground">
                                                        {new Date(
                                                            category.created_at,
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
                                                                        category,
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
                                                                        category.id,
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
                                                        Tidak ada kategori
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

            {categories.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">
                        {categories.total} kategori
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(1)}
                            disabled={categories.current_page === 1}
                        >
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                                goToPage(categories.current_page - 1)
                            }
                            disabled={categories.current_page === 1}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                            {categories.current_page} / {categories.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                                goToPage(categories.current_page + 1)
                            }
                            disabled={
                                categories.current_page === categories.last_page
                            }
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => goToPage(categories.last_page)}
                            disabled={
                                categories.current_page === categories.last_page
                            }
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    reset();
                    setMarketplaceParentId('none');
                    setMarketplaceChildId('none');
                    setEditingCategory(null);
                    clearErrors();
                }
                setIsDialogOpen(open);
            }}>
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory
                                    ? 'Edit Kategori'
                                    : 'Tambah Kategori'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCategory
                                    ? 'Perbarui informasi kategori.'
                                    : 'Buat kategori produk baru.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">

                            <div className="grid gap-2">
                                <Label>Induk Kategori Marketplace</Label>
                                <Select
                                    value={marketplaceParentId}
                                    onValueChange={(v) => {
                                        setMarketplaceParentId(v);
                                        setMarketplaceChildId('none');
                                    }}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Pilih induk kategori..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tidak ada</SelectItem>
                                        {marketplaceCategories.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {marketplaceParentId !== 'none' && (
                                <div className="grid gap-2">
                                    <Label>Sub-kategori Marketplace (Opsional)</Label>
                                    <Select
                                        value={marketplaceChildId}
                                        onValueChange={(v) => setMarketplaceChildId(v)}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Pilih sub-kategori..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Semua sub-kategori</SelectItem>
                                            {marketplaceCategories
                                                .find((p) => p.id.toString() === marketplaceParentId)
                                                ?.children.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                           
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
                                    placeholder="Keterangan kategori..."
                                    className="min-h-[100px]"
                                />
                                {errors.description && (
                                    <p className="text-[11px] font-medium text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                            
                            {errors.marketplace_category_id && (
                                <p className="text-[11px] font-medium text-red-500">
                                    {errors.marketplace_category_id}
                                </p>
                            )}
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
                                disabled={isSubmitting}
                                className="flex-1 bg-black text-white dark:bg-white dark:text-black"
                            >
                                {editingCategory
                                    ? 'Simpan Perubahan'
                                    : 'Simpan Kategori'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ImportDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                title="Import Kategori"
                description="Upload file CSV untuk menambahkan banyak kategori sekaligus."
                route={route('categories.import')}
                templateUrl={route('categories.import.template')}
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
                        <DialogTitle>Hapus Kategori</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus kategori ini?
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
