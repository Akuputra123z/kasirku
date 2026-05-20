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
    XCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImportDialog } from '@/components/import-dialog';
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

interface Category {
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
    categories: Paginator<Category>;
    filters: { search: string | null };
    flash?: { success?: string; error?: string };
}

export default function Index({ categories, filters, flash }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            description: '',
        });

    const searchCategories = () => {
        router.get(
            '/categories',
            { search: searchQuery || null },
            { preserveState: true },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            '/categories',
            { page, search: filters?.search || null },
            { preserveState: true },
        );
    };

    const categoryList = useMemo(() => {
        if (searchQuery && !filters?.search) {
            return categories.data.filter(
                (c) =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (c.description &&
                        c.description
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())),
            );
        }

        return categories.data;
    }, [categories.data, searchQuery, filters?.search]);

    const openCreateDialog = () => {
        setEditingCategory(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description || '',
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            put(`/categories/${editingCategory.id}`, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Kategori berhasil diperbarui');
                },
                preserveScroll: true,
            });
        } else {
            post('/categories', {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    toast.success('Kategori berhasil dibuat');
                },
                preserveScroll: true,
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteId) {
            return;
        }

        router.delete(`/categories/${deleteId}`, {
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

            <AnimatePresence>
                {flash?.success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50"
                    >
                        <CheckCircle2 className="size-5 shrink-0" />
                        <span className="text-sm font-medium">
                            {flash.success}
                        </span>
                    </motion.div>
                )}
                {flash?.error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/50"
                    >
                        <XCircle className="size-5 shrink-0" />
                        <span className="text-sm font-medium">
                            {flash.error}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === 'Enter' && searchCategories()
                        }
                        className="h-9 pl-9 text-[13px]"
                    />
                </div>
                <Button
                    onClick={searchCategories}
                    variant="secondary"
                    className="h-9 px-3 text-[13px]"
                >
                    Cari
                </Button>
            </div>

            <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                <CardContent className="p-0">
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
                                {categoryList.length > 0 ? (
                                    categoryList.map((category) => (
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
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
                                <Label htmlFor="name">Nama Kategori</Label>
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
                                    placeholder="Contoh: Laptop"
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
                                    placeholder="Keterangan kategori..."
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
                route="/categories/import"
                templateUrl="/categories/import/template"
            />

            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteId(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
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
