'use client';

import { Icon } from '@iconify/react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Download,
    MoreHorizontal,
    Plus,
    Search,
    X,
    CheckCircle2,
    Package,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Trash2,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ImportDialog } from '@/components/import-dialog';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { VariantManager } from './VariantManager';

interface Category {
    id: number;
    name: string;
}

interface ProductVariant {
    id?: number;
    name: string;
    additional_price: number | string;
    stock: number | string;
    sku: string | null;
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category_id: number;
    status: 'active' | 'inactive';
    image: string | null;
    image_url: string | null;
    created_at: string;
    category?: Category;
    variants?: ProductVariant[];
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    products: Paginator<Product>;
    categories: Category[];
    filters: { search?: string; per_page?: number };
}

export default function Index({ products, categories, filters }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [perPage, setPerPage] = useState(products.per_page ?? 10);
    const [categorySearch, setCategorySearch] = useState('');
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
        {},
    );
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        action: 'delete' | 'bulk-delete';
        productId?: number;
        loading: boolean;
    }>({ open: false, action: 'delete', loading: false });
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const categorySearchRef = useRef<HTMLInputElement>(null);
    const filteredCategories = categories.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase()),
    );
    const selectedIds = Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((key) => products.data[parseInt(key)])
        .filter(Boolean)
        .map((p) => p.id);

    useEffect(() => {
        if (isDialogOpen) {
            setTimeout(() => {
                nameInputRef.current?.focus();
                document
                    .querySelector('.dialog-form-scroll-container')
                    ?.scrollTo({ top: 0, behavior: 'instant' });
            }, 150);
        }
    }, [isDialogOpen]);

    const { data, setData, post, reset, processing, errors, clearErrors } =
        useForm({
            name: '',
            description: '',
            price: '',
            stock: '',
            category_id: '',
            status: 'active',
            image: null as File | null,
            variants: [] as ProductVariant[],
            _method: 'POST' as 'POST' | 'PUT',
        });

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setTimeout(() => {
                document
                    .querySelector('.dialog-form-scroll-container')
                    ?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
        }
    }, [errors]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !processing) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const errorEntries = Object.entries(errors);
    const hasErrors = errorEntries.length > 0;

    const openCreateDialog = () => {
        setEditingProduct(null);
        setImagePreview(null);
        reset();
        clearErrors();
        setCategorySearch('');
        setData('_method', 'POST');
        setIsDialogOpen(true);
    };

    const openEditDialog = (product: Product) => {
        setEditingProduct(product);
        setImagePreview(product.image_url ?? null);
        setData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            stock: product.stock.toString(),
            category_id: product.category_id.toString(),
            status: product.status,
            image: null,
            variants: product.variants || [],
            _method: 'PUT',
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const url = editingProduct
            ? route('products.update', editingProduct.id)
            : route('products.store');

        post(url, {
            forceFormData: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                reset();
                toast.success(
                    editingProduct
                        ? 'Product updated successfully'
                        : 'Product created successfully',
                );
            },
            onError: (err) => {
                const firstError = Object.values(err)[0];

                if (firstError) {
                    toast.error(firstError as string);
                } else {
                    toast.error('An error occurred during submission.');
                }
            },
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number) => {
        setConfirmDialog({
            open: true,
            action: 'delete',
            productId: id,
            loading: false,
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setConfirmDialog({ open: true, action: 'bulk-delete', loading: false });
    };

    const handleConfirmDelete = () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));

        if (confirmDialog.action === 'delete' && confirmDialog.productId) {
            router.delete(route('products.destroy', confirmDialog.productId), {
                onSuccess: () => {
                    setConfirmDialog({
                        open: false,
                        action: 'delete',
                        loading: false,
                    });
                    toast.success('Product deleted successfully');
                },
                onError: () => {
                    setConfirmDialog({
                        open: false,
                        action: 'delete',
                        loading: false,
                    });
                },
                onFinish: () =>
                    setConfirmDialog((prev) => ({ ...prev, loading: false })),
            });
        } else {
            // 🛠️ FIX: Mengubah rute menjadi 'products.bulkDestroy' agar sesuai dengan backend Laravel
            router.post(
                route('products.bulkDestroy'),
                { ids: selectedIds },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmDialog({
                            open: false,
                            action: 'bulk-delete', // 🛠️ Disamakan dengan action aslinya
                            loading: false,
                        });
                        setRowSelection({}); // Membersihkan centang checkbox pada tabel
                        toast.success('Products deleted successfully');
                    },
                    onError: (err) => {
                        setConfirmDialog({
                            open: false,
                            action: 'bulk-delete', // 🛠️ Disamakan dengan action aslinya
                            loading: false,
                        });
                        toast.error(
                            (Object.values(err)[0] as string) ||
                                'Gagal menghapus produk massal.',
                        );
                    },
                    onFinish: () =>
                        setConfirmDialog((prev) => ({
                            ...prev,
                            loading: false,
                        })),
                },
            );
        }
    };

    useEffect(
        () => () => {
            if (searchTimeoutRef.current)
                clearTimeout(searchTimeoutRef.current);
        },
        [],
    );

    const debouncedSearch = useCallback((value: string) => {
        setSearchQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            router.get(
                '/products',
                { search: value || null, per_page: perPage },
                { preserveState: true, replace: true },
            );
        }, 300);
    }, [perPage]);

    const goToPage = (page: number) => {
        router.get(
            '/products',
            { page, search: searchQuery, per_page: perPage },
            { preserveState: true },
        );
    };

    const handlePageSizeChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        router.get(
            '/products',
            { page: 1, search: searchQuery, per_page: newPerPage },
            { preserveState: true },
        );
    };

    const columns: ColumnDef<Product>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Pilih semua"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Pilih baris"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: 'Produk',
            cell: ({ row }) => {
                const product = row.original;

                return (
                    <div className="flex items-center gap-3">
                        <div className="size-10 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    className="size-full object-cover"
                                    alt=""
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-neutral-400">
                                    <Package className="size-5" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold tracking-tight">
                                {product.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                                    PROD-
                                    {product.id.toString().padStart(4, '0')}
                                </span>
                                {product.variants &&
                                    product.variants.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="h-3.5 px-1 text-[8px] font-black tracking-tighter uppercase"
                                        >
                                            {product.variants.length} Varian
                                        </Badge>
                                    )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'category.name',
            header: 'Kategori',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="rounded-md border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:border-neutral-700 dark:bg-neutral-800"
                >
                    {row.original.category?.name || 'Tidak Ada Kategori'}
                </Badge>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Harga',
            cell: ({ row }) => (
                <span className="text-[13px] font-bold">
                    Rp{' '}
                    {new Intl.NumberFormat('id-ID').format(row.original.price)}
                </span>
            ),
        },
        {
            accessorKey: 'stock',
            header: 'Stok',
            cell: ({ row }) => {
                const stock = row.original.stock;

                return (
                    <div className="flex items-center gap-2">
                        <div
                            className={`size-1.5 rounded-full ${stock > 10 ? 'bg-green-500' : 'bg-orange-500'}`}
                        />
                        <span className="text-[13px] font-medium">
                            {stock} unit
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <CheckCircle2
                        className={`size-3.5 ${row.original.status === 'active' ? 'text-blue-500' : 'text-neutral-300'}`}
                    />
                    <span className="text-[13px] font-medium capitalize">
                        {row.original.status}
                    </span>
                </div>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const product = row.original;

                return (
                    <div className="pr-4 text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-xl border-neutral-200 p-1 shadow-xl dark:border-neutral-800"
                            >
                                <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                    Kelola
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.get(
                                            route('products.show', product.id),
                                        )
                                    }
                                    className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px]"
                                >
                                    <Icon
                                        icon="solar:eye-bold-duotone"
                                        width={16}
                                        className="text-neutral-500"
                                    />{' '}
                                    Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => openEditDialog(product)}
                                    className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px]"
                                >
                                    <Icon
                                        icon="solar:pen-bold-duotone"
                                        width={16}
                                        className="text-blue-500"
                                    />{' '}
                                    Edit Produk
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleDelete(product.id)}
                                    className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px] text-red-500 focus:text-red-500"
                                >
                                    <Icon
                                        icon="solar:trash-bin-trash-bold-duotone"
                                        width={16}
                                    />{' '}
                                    Hapus Produk
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="font-geist min-h-screen space-y-6 bg-white p-4 text-neutral-900 md:p-8 dark:bg-neutral-950 dark:text-white">
            <Head title="Produk" />

            <div className="flex flex-col justify-between gap-4 px-2 md:flex-row md:items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Katalog Produk
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        Kelola inventaris dan varian produk.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportOpen(true)}
                        className="flex h-9 items-center gap-2 rounded-lg px-3 font-medium"
                    >
                        Import <Download className="size-3.5" />
                    </Button>
                    <Button
                        onClick={openCreateDialog}
                        size="sm"
                        className="flex h-9 items-center gap-2 rounded-lg bg-black px-3 font-medium text-white shadow-lg hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        Buat <Plus className="size-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        className="h-9 rounded-lg border-neutral-200 bg-transparent pr-8 pl-9 text-[13px] dark:border-neutral-800"
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
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="flex h-9 items-center gap-2 rounded-lg border-red-200 px-3 font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                        >
                            <Trash2 className="size-3.5" />
                            Hapus ({selectedIds.length})
                        </Button>
                    )}
                    <span className="text-[13px] text-muted-foreground">
                        {products.total} produk
                    </span>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={products.data}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                hidePaginationControls={true}
            />

            <div className="flex items-center justify-between border-t border-neutral-100 px-2 pt-4 dark:border-neutral-800">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span>Show</span>
                    <Select
                        value={perPage.toString()}
                        onValueChange={(v) => handlePageSizeChange(Number(v))}
                    >
                        <SelectTrigger className="h-8 w-16 rounded-lg bg-transparent text-[12px] border-neutral-200 dark:border-neutral-800">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top" className="border-neutral-200 dark:border-neutral-800 rounded-xl">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="40">40</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span>per page</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted-foreground">
                        {(products.current_page - 1) * products.per_page + 1}-
                        {Math.min(products.current_page * products.per_page, products.total)} of{' '}
                        {products.total}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            disabled={products.current_page === 1}
                            onClick={() => goToPage(products.current_page - 1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="px-2 text-[12px] font-bold">
                            {products.current_page}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            disabled={products.current_page >= products.last_page}
                            onClick={() => goToPage(products.current_page + 1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="flex max-h-[95vh] flex-col overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-2xl sm:max-w-[800px] dark:bg-neutral-950">
                    <form
                        onSubmit={handleSubmit}
                        onKeyDown={handleKeyDown}
                        className="flex h-full flex-col overflow-hidden"
                    >
                        <div className="border-b border-neutral-100 bg-neutral-50/50 p-8 pb-4 dark:border-neutral-900 dark:bg-neutral-900/20">
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-black text-white shadow-lg shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/5">
                                            <Icon
                                                icon={
                                                    editingProduct
                                                        ? 'solar:box-minimalistic-bold-duotone'
                                                        : 'solar:add-square-bold-duotone'
                                                }
                                                width={32}
                                            />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                                {editingProduct
                                                    ? 'Edit Produk'
                                                    : 'Tambah Produk Baru'}
                                            </DialogTitle>
                                            <DialogDescription className="mt-0.5 text-[13px] font-medium text-neutral-500">
                                                {editingProduct
                                                    ? 'Ubah detail produk dan pengaturan inventaris.'
                                                    : 'Lengkapi informasi di bawah untuk membuat produk baru.'}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    <div className="hidden items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm md:flex dark:border-neutral-800 dark:bg-neutral-900">
                                        <div
                                            className={`size-2 animate-pulse rounded-full ${data.status === 'active' ? 'bg-green-500' : 'bg-neutral-300'}`}
                                        />
                                        <span className="text-[11px] font-bold tracking-wider text-neutral-600 uppercase dark:text-neutral-400">
                                            Status: {data.status}
                                        </span>
                                    </div>
                                </div>
                            </DialogHeader>
                        </div>

                        <div className="custom-scrollbar dialog-form-scroll-container flex-1 overflow-y-auto">
                            {hasErrors && (
                                <div className="mx-8 mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
                                    <Icon
                                        icon="solar:danger-circle-bold-duotone"
                                        className="mt-0.5 size-5 shrink-0 text-red-500"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-red-700 dark:text-red-400">
                                            Please fix the following errors:
                                        </p>
                                        <ul className="mt-1.5 space-y-0.5">
                                            {errorEntries.map(
                                                ([field, message]) => (
                                                    <li
                                                        key={field}
                                                        className="truncate text-[12px] font-medium text-red-600 dark:text-red-300"
                                                    >
                                                        • {message as string}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-10 p-8">
                                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                                    <div className="space-y-4 lg:col-span-5">
                                        <div className="mb-1 flex items-center gap-2">
                                            <Icon
                                                icon="solar:gallery-bold-duotone"
                                                className="size-4 text-neutral-400"
                                            />
                                            <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                                Gambar Produk
                                            </Label>
                                        </div>
                                        <div className="group relative">
                                            <div
                                                className={`flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed bg-neutral-50 transition-all duration-300 md:aspect-square dark:bg-neutral-900/30 ${
                                                    imagePreview
                                                        ? 'border-neutral-200 dark:border-neutral-800'
                                                        : 'border-neutral-200 hover:border-black hover:bg-neutral-100 dark:border-neutral-800 dark:hover:border-white dark:hover:bg-neutral-900/50'
                                                }`}
                                            >
                                                {imagePreview ? (
                                                    <div className="relative size-full">
                                                        <img
                                                            src={imagePreview}
                                                            className="size-full object-cover"
                                                            alt="Preview"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="h-9 rounded-full px-4 font-bold"
                                                                    onClick={() =>
                                                                        document
                                                                            .getElementById(
                                                                                'product-image-input',
                                                                            )
                                                                            ?.click()
                                                                    }
                                                                >
                                                                    Change Photo
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    'product-image-input',
                                                                )
                                                                ?.click()
                                                        }
                                                        className="flex flex-col items-center gap-4 text-neutral-400 transition-colors group-hover:text-black dark:group-hover:text-white"
                                                    >
                                                        <div className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
                                                            <Icon
                                                                icon="solar:camera-add-bold-duotone"
                                                                className="size-8"
                                                            />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[13px] font-bold">
                                                                Upload Image
                                                            </p>
                                                            <p className="mt-0.5 text-[11px] font-medium opacity-60">
                                                                JPG, PNG, WebP
                                                                up to 8MB
                                                            </p>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                            <Input
                                                id="product-image-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </div>
                                        {errors.image && (
                                            <p className="ml-2 text-[11px] font-bold text-red-500 italic">
                                                {errors.image}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-6 lg:col-span-7">
                                        <div className="space-y-4">
                                            <div className="grid gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon
                                                        icon="solar:pen-bold-duotone"
                                                        className="size-4 text-neutral-400"
                                                    />
                                                    <Label
                                                        htmlFor="name"
                                                        className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase"
                                                    >
                                                        Product Name{' '}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>
                                                </div>
                                                <Input
                                                    ref={nameInputRef}
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter product title..."
                                                    className={`h-12 rounded-2xl border-neutral-200 px-5 text-[14px] font-medium transition-all focus:border-black focus:ring-0 dark:border-neutral-800 dark:focus:border-white ${errors.name ? 'border-red-500' : ''}`}
                                                />
                                                {errors.name && (
                                                    <p className="ml-2 text-[11px] font-bold text-red-500 italic">
                                                        {errors.name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Icon
                                                            icon="solar:tag-bold-duotone"
                                                            className="size-4 text-neutral-400"
                                                        />
                                                        <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                                            Category{' '}
                                                            <span className="text-red-500">
                                                                *
                                                            </span>
                                                        </Label>
                                                    </div>
                                                    <Select
                                                        value={data.category_id}
                                                        onValueChange={(v) => {
                                                            setData(
                                                                'category_id',
                                                                v,
                                                            );
                                                            setCategorySearch(
                                                                '',
                                                            );
                                                        }}
                                                        onOpenChange={(o) => {
                                                            if (!o) {
                                                                setCategorySearch(
                                                                    '',
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger
                                                            className={`h-12 rounded-2xl border-neutral-200 px-5 text-[14px] font-medium dark:border-neutral-800 ${errors.category_id ? 'border-red-500' : ''}`}
                                                        >
                                                            <SelectValue placeholder="Select Category" />
                                                        </SelectTrigger>
                                                        <SelectContent
                                                            position="popper"
                                                            className="z-[60] rounded-2xl border-neutral-200 shadow-xl dark:border-neutral-800"
                                                        >
                                                            <div
                                                                className="sticky top-0 z-10 border-b border-neutral-100 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950"
                                                                onPointerDown={(
                                                                    e,
                                                                ) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <Input
                                                                    ref={
                                                                        categorySearchRef
                                                                    }
                                                                    value={
                                                                        categorySearch
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setCategorySearch(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Cari kategori..."
                                                                    className="h-9 rounded-xl border-neutral-200 text-[13px] dark:border-neutral-800"
                                                                    onKeyDown={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="max-h-60 overflow-y-auto scroll-smooth">
                                                                {filteredCategories.length ===
                                                                0 ? (
                                                                    <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                                                                        Tidak
                                                                        ada
                                                                        kategori
                                                                    </p>
                                                                ) : (
                                                                    filteredCategories.map(
                                                                        (c) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    c.id
                                                                                }
                                                                                value={c.id.toString()}
                                                                                className="m-1 cursor-pointer rounded-lg"
                                                                            >
                                                                                <span className="truncate">
                                                                                    {
                                                                                        c.name
                                                                                    }
                                                                                </span>
                                                                            </SelectItem>
                                                                        ),
                                                                    )
                                                                )}
                                                            </div>
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.category_id && (
                                                        <p className="ml-2 text-[11px] font-bold text-red-500 italic">
                                                            {errors.category_id}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Icon
                                                            icon="solar:settings-bold-duotone"
                                                            className="size-4 text-neutral-400"
                                                        />
                                                        <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                                            Status
                                                        </Label>
                                                    </div>
                                                    <div className="flex h-12 rounded-2xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setData(
                                                                    'status',
                                                                    'active',
                                                                )
                                                            }
                                                            className={`flex-1 rounded-xl text-[12px] font-bold transition-all ${data.status === 'active' ? 'bg-white text-black shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500'}`}
                                                        >
                                                            Aktif
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setData(
                                                                    'status',
                                                                    'inactive',
                                                                )
                                                            }
                                                            className={`flex-1 rounded-xl text-[12px] font-bold transition-all ${data.status === 'inactive' ? 'bg-white text-black shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500'}`}
                                                        >
                                                            Nonaktif
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 border-t border-neutral-100 pt-6 dark:border-neutral-900">
                                    <div className="mb-2 flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-900">
                                            <Icon
                                                icon="solar:dollar-bold-duotone"
                                                className="size-5"
                                            />
                                        </div>
                                        <h3 className="text-[15px] font-bold tracking-tight text-neutral-900 uppercase dark:text-white">
                                            Harga & Inventaris
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                                Harga Dasar (Rp){' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <CurrencyInput
                                                value={data.price}
                                                onChange={(v) =>
                                                    setData('price', v)
                                                }
                                                className="h-12 rounded-2xl border-neutral-200 text-[15px] font-bold dark:border-neutral-800"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                                Stock Quantity{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <div className="relative">
                                                <div className="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400">
                                                    <Icon
                                                        icon="solar:box-bold-duotone"
                                                        className="size-4"
                                                    />
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={data.stock}
                                                    onChange={(e) =>
                                                        setData(
                                                            'stock',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-12 rounded-2xl border-neutral-200 pl-11 text-[15px] font-bold dark:border-neutral-800"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="ml-1 flex items-center gap-2">
                                            <Icon
                                                icon="solar:notes-bold-duotone"
                                                className="size-4 text-neutral-400"
                                            />
                                            <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                                Deskripsi Produk
                                            </Label>
                                        </div>
                                        <Textarea
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Tulis deskripsi detail untuk produk ini..."
                                            className="min-h-[140px] resize-none rounded-[1.5rem] border-neutral-200 p-5 text-[14px] leading-relaxed font-medium transition-all focus:border-black dark:border-neutral-800 dark:focus:border-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 border-t border-neutral-100 pt-6 dark:border-neutral-900">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-900">
                                            <Icon
                                                icon="solar:layers-bold-duotone"
                                                className="size-5"
                                            />
                                        </div>
                                        <h3 className="text-[15px] font-bold tracking-tight text-neutral-900 uppercase dark:text-white">
                                            Konfigurasi Varian
                                        </h3>
                                    </div>
                                    <VariantManager
                                        variants={data.variants}
                                        onChange={(newVariants) =>
                                            setData('variants', newVariants)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 border-t border-neutral-100 bg-white p-8 dark:border-neutral-900 dark:bg-neutral-950">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="h-14 flex-1 rounded-2xl border-neutral-200 font-bold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex h-14 flex-[2] items-center gap-3 rounded-2xl bg-black text-[15px] font-bold text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-black dark:shadow-white/5"
                            >
                                {processing ? (
                                    <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <Icon
                                        icon={
                                            editingProduct
                                                ? 'solar:check-read-bold-duotone'
                                                : 'solar:add-square-bold-duotone'
                                        }
                                        width={20}
                                    />
                                )}
                                {editingProduct
                                    ? 'Simpan Perubahan'
                                    : 'Buat Produk'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ImportDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                title="Import Produk"
                description="Upload file CSV untuk menambahkan banyak produk sekaligus."
                route="/products/import"
                templateUrl="/products/import/template"
            />

            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => {
                    if (!confirmDialog.loading) {
                        setConfirmDialog((prev) => ({ ...prev, open }));
                    }
                }}
                title={
                    confirmDialog.action === 'bulk-delete'
                        ? `Hapus ${selectedIds.length} Produk`
                        : 'Hapus Produk'
                }
                description={
                    confirmDialog.action === 'bulk-delete'
                        ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} produk terpilih? Tindakan ini tidak dapat dibatalkan.`
                        : 'Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.'
                }
                confirmText="Hapus"
                cancelText="Batal"
                variant="danger"
                loading={confirmDialog.loading}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
