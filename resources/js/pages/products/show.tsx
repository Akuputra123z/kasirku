import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Package,
    Tag,
    CheckCircle2,
    XCircle,
    LayoutGrid,
    Banknote,
    Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProductVariant {
    id: number;
    name: string;
    additional_price: number;
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category_id: number;
    image: string | null;
    image_url: string | null;
    status: string;
    category?: { id: number; name: string };
    variants?: ProductVariant[];
    created_at: string;
    updated_at: string;
}

interface Props {
    product: Product;
}

export default function ShowProduct({ product }: Props) {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(product.price);

    return (
        <div className="font-geist min-h-screen space-y-6 bg-white p-4 md:p-8 dark:bg-neutral-950">
            <Head title={`Product - ${product.name}`} />

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <Link href={route('products.index')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Product Details
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        View detailed information about PROD-
                        {product.id.toString().padStart(4, '0')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* LEFT COLUMN: IMAGE & QUICK INFO */}
                <div className="space-y-6 md:col-span-1">
                    <Card className="overflow-hidden rounded-2xl border border-neutral-200 shadow-none dark:border-neutral-800">
                        <div className="flex aspect-square items-center justify-center border-b border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-neutral-400">
                                    <Package className="size-16" />
                                    <span className="text-sm font-medium">
                                        No Image Available
                                    </span>
                                </div>
                            )}
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {product.name}
                                    </h2>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase dark:bg-neutral-900"
                                        >
                                            {product.category?.name ||
                                                'Uncategorized'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 dark:bg-neutral-800">
                                    {product.status === 'active' ? (
                                        <>
                                            <CheckCircle2 className="size-3.5 text-blue-500" />
                                            <span className="text-[11px] font-bold tracking-wider uppercase">
                                                Active
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="size-3.5 text-neutral-400" />
                                            <span className="text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
                                                Inactive
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: DETAILS & VARIANTS */}
                <div className="space-y-6 md:col-span-2">
                    <Card className="rounded-2xl border border-neutral-200 shadow-none dark:border-neutral-800">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-900">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <LayoutGrid className="size-5 text-neutral-500" />
                                Specifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 p-6">
                            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-neutral-500">
                                        <Banknote className="size-4" />
                                        <span className="text-[12px] font-bold uppercase">
                                            Base Price
                                        </span>
                                    </div>
                                    <p className="text-lg font-black text-[#2d5a4e] dark:text-[#458f7c]">
                                        {formattedPrice}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-neutral-500">
                                        <Layers className="size-4" />
                                        <span className="text-[12px] font-bold uppercase">
                                            Stock
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`size-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}
                                        />
                                        <p className="text-lg font-bold">
                                            {product.stock}{' '}
                                            <span className="text-[13px] font-medium text-neutral-500">
                                                units
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-neutral-100 dark:bg-neutral-800" />

                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-neutral-500">
                                    <Tag className="size-4" />
                                    <span className="text-[12px] font-bold uppercase">
                                        Description
                                    </span>
                                </div>
                                <p className="text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                                    {product.description ||
                                        'No description provided for this product.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-neutral-200 shadow-none dark:border-neutral-800">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-900">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Layers className="size-5 text-neutral-500" />
                                Product Variants
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {product.variants && product.variants.length > 0 ? (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                    {product.variants.map((variant) => (
                                        <div
                                            key={variant.id}
                                            className="flex items-center justify-between p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                                    <Tag className="size-4 text-neutral-500" />
                                                </div>
                                                <span className="text-[14px] font-semibold">
                                                    {variant.name}
                                                </span>
                                            </div>
                                            <span className="text-[13px] font-bold text-neutral-600 dark:text-neutral-400">
                                                +
                                                {new Intl.NumberFormat(
                                                    'id-ID',
                                                    {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0,
                                                    },
                                                ).format(
                                                    variant.additional_price,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                                    <Layers className="mb-3 size-10 text-neutral-300" />
                                    <p className="text-[13px] font-medium">
                                        No variants configured for this product.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
