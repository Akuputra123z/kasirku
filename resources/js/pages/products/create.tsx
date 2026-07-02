'use client';

import { Icon } from '@iconify/react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import { CameraScanner } from '@/components/camera-scanner';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { useBeep } from '@/hooks/use-beep';
import { VariantManager } from './VariantManager';
import billing from '@/routes/billing';

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface ProductVariant {
    id?: number;
    name: string;
    additional_price: number | string;
    stock: number | string;
    weight?: number | string | null;
    sku: string | null;
}

interface Props {
    categories: Category[];
    brands: Brand[];
}

export default function Create({ categories }: Props) {
    const { tenant } = usePage().props;
    const isPremium = (tenant as { subscription_tier?: string } | null)?.subscription_tier === 'premium';
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const nameInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const categorySearchRef = useRef<HTMLInputElement>(null);
    const autoCameraOpenedRef = useRef(false);

    const filteredCategories = categories.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase()),
    );

    const { data, setData, post, processing, errors, clearErrors } =
        useForm({
            name: '',
            description: '',
            price: '',
            cost_price: '',
            barcode: '',
            stock: '',
            category_id: '',
            status: 'active' as 'active' | 'inactive',
            image: null as File | null,
            variants: [] as ProductVariant[],
            visible_online: false,
            online_price: '',
            stock_online: '',
            weight: '',
        });

    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    const { beep } = useBeep();

    const handleBarcodeScan = useCallback(
        (barcode: string) => {
            setData('barcode', barcode);
            beep('success');
            toast.success(`Barcode terdeteksi: ${barcode}`);
        },
        [setData, beep],
    );

    const { lastScanned } = useBarcodeScanner({
        onScan: handleBarcodeScan,
        enabled: true,
    });

    useEffect(() => {
        if (lastScanned) {
            barcodeInputRef.current?.focus();
        }
    }, [lastScanned]);

    const handleBarcodeFocus = useCallback(() => {
        if (window.innerWidth >= 768) return;
        if (autoCameraOpenedRef.current) return;
        autoCameraOpenedRef.current = true;
        setIsCameraOpen(true);
    }, []);

    const handleCameraClose = useCallback(() => {
        setIsCameraOpen(false);
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }, []);

    const handleCameraScan = useCallback(
        (barcode: string) => {
            setData('barcode', barcode);
            beep('success');
            toast.success(`Barcode terdeteksi: ${barcode}`);
            setIsCameraOpen(false);
        },
        [setData, beep],
    );

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

        post(route('products.store'), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Product created successfully');
                router.get(route('products.index'));
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !processing) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const errorEntries = Object.entries(errors);
    const hasErrors = errorEntries.length > 0;

    return (
        <div className="font-geist min-h-screen bg-white p-4 text-neutral-900 md:p-8 dark:bg-neutral-950 dark:text-white">
            <Head title="Tambah Produk" />

            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <Link
                        href={route('products.index')}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Produk
                    </Link>
                </div>

                <form
                    onSubmit={handleSubmit}
                    onKeyDown={handleKeyDown}
                    className="space-y-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-black text-white shadow-lg shadow-black/10 dark:bg-white dark:text-black">
                                <Icon
                                    icon="solar:add-square-bold-duotone"
                                    width={28}
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Tambah Produk Baru
                                </h1>
                                <p className="mt-0.5 text-[13px] font-medium text-neutral-500">
                                    Lengkapi informasi di bawah untuk membuat produk baru.
                                </p>
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

                    {hasErrors && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
                            <Icon
                                icon="solar:danger-circle-bold-duotone"
                                className="mt-0.5 size-5 shrink-0 text-red-500"
                            />
                            <div className="min-w-0">
                                <p className="text-[13px] font-bold text-red-700 dark:text-red-400">
                                    Please fix the following errors:
                                </p>
                                <ul className="mt-1.5 space-y-0.5">
                                    {errorEntries.map(([field, message]) => (
                                        <li
                                            key={field}
                                            className="truncate text-[12px] font-medium text-red-600 dark:text-red-300"
                                        >
                                            • {message as string}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 gap-5 md:gap-10 lg:grid-cols-12">
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
                                        className={`flex aspect-[3/1] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-neutral-50 transition-all duration-300 md:aspect-square md:rounded-[2rem] dark:bg-neutral-900/30 ${
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
                                                                    .getElementById('product-image-input')
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
                                                        .getElementById('product-image-input')
                                                        ?.click()
                                                }
                                                className="flex flex-col items-center gap-2 text-neutral-400 transition-colors group-hover:text-black md:gap-4 dark:group-hover:text-white"
                                            >
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm md:size-16 md:rounded-2xl dark:bg-neutral-900">
                                                    <Icon
                                                        icon="solar:camera-add-bold-duotone"
                                                        className="size-5 md:size-8"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[13px] font-bold">
                                                        Upload Image
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] font-medium opacity-60">
                                                        JPG, PNG, WebP up to 8MB
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
                                                <span className="text-red-500">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            ref={nameInputRef}
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
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
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                            </div>
                                            <Select
                                                value={data.category_id}
                                                onValueChange={(v) => {
                                                    setData('category_id', v);
                                                    setCategorySearch('');
                                                }}
                                                onOpenChange={(o) => {
                                                    if (!o) setCategorySearch('');
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
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Input
                                                            ref={categorySearchRef}
                                                            value={categorySearch}
                                                            onChange={(e) =>
                                                                setCategorySearch(e.target.value)
                                                            }
                                                            placeholder="Cari kategori..."
                                                            className="h-9 rounded-xl border-neutral-200 text-[13px] dark:border-neutral-800"
                                                            onKeyDown={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        />
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto scroll-smooth">
                                                        {filteredCategories.length === 0 ? (
                                                            <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                                                                Tidak ada kategori
                                                            </p>
                                                        ) : (
                                                            filteredCategories.map((c) => (
                                                                <SelectItem
                                                                    key={c.id}
                                                                    value={c.id.toString()}
                                                                    className="m-1 cursor-pointer rounded-lg"
                                                                >
                                                                    <span className="truncate">
                                                                        {c.name}
                                                                    </span>
                                                                </SelectItem>
                                                            ))
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
                                                        setData('status', 'active')
                                                    }
                                                    className={`flex-1 rounded-xl text-[12px] font-bold transition-all ${data.status === 'active' ? 'bg-white text-black shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500'}`}
                                                >
                                                    Aktif
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setData('status', 'inactive')
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
                            <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                        Harga Jual (Rp){' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <CurrencyInput
                                        value={data.price}
                                        onChange={(v) => setData('price', v)}
                                        className="h-12 rounded-2xl border-neutral-200 text-[15px] font-bold dark:border-neutral-800"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                        Modal Awal (Rp)
                                    </Label>
                                    <CurrencyInput
                                        value={data.cost_price}
                                        onChange={(v) => setData('cost_price', v)}
                                        className="h-12 rounded-2xl border-neutral-200 text-[15px] font-bold dark:border-neutral-800"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                    Barcode
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            ref={barcodeInputRef}
                                            value={data.barcode}
                                            onChange={(e) =>
                                                setData('barcode', e.target.value)
                                            }
                                            onFocus={handleBarcodeFocus}
                                            placeholder="Scan atau ketik barcode..."
                                            className="h-12 w-full rounded-2xl border-neutral-200 font-mono text-[14px] dark:border-neutral-800"
                                        />
                                        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1.5">
                                            <span className="relative flex size-2">
                                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                                                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                                            </span>
                                            <span className="hidden text-[10px] font-bold text-green-600 tracking-wider uppercase md:block dark:text-green-400">
                                                SCAN
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCameraOpen(true)}
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-card text-muted-foreground hover:bg-accent dark:border-neutral-800"
                                        title="Scan barcode dengan kamera"
                                    >
                                        <Icon
                                            icon="solar:camera-bold-duotone"
                                            className="size-5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const gen =
                                                'BRC-' +
                                                Math.random()
                                                    .toString(36)
                                                    .substring(2, 8)
                                                    .toUpperCase();
                                            setData('barcode', gen);
                                        }}
                                        className="h-12 shrink-0 rounded-2xl border border-neutral-200 bg-card px-4 text-[12px] font-bold text-muted-foreground hover:bg-accent dark:border-neutral-800"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                        Stock Quantity{' '}
                                        <span className="text-red-500">*</span>
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
                                                setData('stock', e.target.value)
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
                                        setData('description', e.target.value)
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
                                        icon="solar:cart-bold-duotone"
                                        className="size-5"
                                    />
                                </div>
                                <h3 className="text-[15px] font-bold tracking-tight text-neutral-900 uppercase dark:text-white">
                                    Marketplace Online
                                </h3>
                            </div>
                            {isPremium ? (
                                <>
                                    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex size-10 items-center justify-center rounded-xl ${data.visible_online ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-200 text-neutral-400'} transition-colors`}>
                                                <Icon icon="solar:global-bold-duotone" className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold">Jual Online</p>
                                                <p className="text-[11px] text-neutral-500">Tampilkan produk ini di marketplace</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setData('visible_online', !data.visible_online)}
                                            className={`relative h-7 w-12 rounded-full transition-all ${data.visible_online ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-md transition-transform ${data.visible_online ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    {data.visible_online && (
                                        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
                                            <div className="grid gap-2">
                                                <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">Harga Online (Rp)</Label>
                                                <CurrencyInput
                                                    value={data.online_price}
                                                    onChange={(v) => setData('online_price', v)}
                                                    className="h-12 rounded-2xl border-neutral-200 text-[15px] font-bold dark:border-neutral-800"
                                                    placeholder="Kosongkan untuk pakai harga jual"
                                                />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                            Stok Online
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
                                                value={data.stock_online}
                                                onChange={(e) =>
                                                    setData(
                                                        'stock_online',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-12 rounded-2xl border-neutral-200 pl-11 text-[15px] font-bold dark:border-neutral-800"
                                                placeholder="Kosongkan untuk pakai stok reguler"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="ml-1 text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                            Berat (gram)
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400">
                                                <Icon
                                                    icon="solar:scales-bold-duotone"
                                                    className="size-4"
                                                />
                                            </div>
                                            <Input
                                                type="number"
                                                value={data.weight}
                                                onChange={(e) =>
                                                    setData('weight', e.target.value)
                                                }
                                                className="h-12 rounded-2xl border-neutral-200 pl-11 text-[15px] font-bold dark:border-neutral-800"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="text-[11px] font-medium text-neutral-400">
                                            Digunakan untuk kalkulasi ongkos kirim
                                        </p>
                                    </div>
                                </div>
                            )}
                                </>
                            ) : (
                                <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-100 p-5 dark:border-neutral-800 dark:bg-neutral-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-200 text-neutral-400 dark:bg-neutral-800">
                                            <Icon icon="solar:lock-bold-duotone" className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-neutral-400">Jual Online</p>
                                            <p className="text-[11px] text-neutral-400">Fitur Premium — <Link href={billing.index().url} className="text-emerald-600 underline">Upgrade sekarang</Link></p>
                                        </div>
                                    </div>
                                </div>
                            )}
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

                    <div className="flex items-center gap-3 border-t border-neutral-100 bg-white pt-6 md:gap-4 dark:border-neutral-900 dark:bg-neutral-950">
                        <Link
                            href={route('products.index')}
                            className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-neutral-200 text-[15px] font-bold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                        >
                            Batal
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="flex h-14 flex-[2] items-center gap-3 rounded-2xl bg-black text-[15px] font-bold text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-black dark:shadow-white/5"
                        >
                            {processing ? (
                                <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <Icon
                                    icon="solar:add-square-bold-duotone"
                                    width={20}
                                />
                            )}
                            Buat Produk
                        </Button>
                    </div>
                </form>
            </div>

            <CameraScanner
                isOpen={isCameraOpen}
                onScan={handleCameraScan}
                onClose={handleCameraClose}
            />
        </div>
    );
}
