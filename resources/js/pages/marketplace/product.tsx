'use client';

import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft, ShoppingCart, Heart, Share2, MessageCircle,
    Star, MapPin, Minus, Plus, Package, Check, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Variant { id: number; name: string; additional_price: number; stock: number; }
interface Extra { id: number; name: string; additional_price: number; }

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={size}
                    className={s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                />
            ))}
        </div>
    );
}

function ImageGallery({ imageUrl, name }: { imageUrl: string | null; name: string }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const images = imageUrl ? [imageUrl] : [];

    return (
        <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl border bg-gray-50">
                {images[selectedIndex] ? (
                    <img src={images[selectedIndex]} alt={name} className="size-full object-contain" />
                ) : (
                    <div className="flex size-full items-center justify-center text-gray-300">
                        <Package className="size-24" />
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                {images.length > 0 ? (
                    images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedIndex(i)}
                            className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                selectedIndex === i ? 'border-[#4648d4]' : 'border-transparent hover:border-gray-200'
                            }`}
                        >
                            <img src={img} alt="" className="size-full object-cover" />
                        </button>
                    ))
                ) : null}
                {Array.from({ length: Math.max(0, 4 - images.length) }).map((_, i) => (
                    <div
                        key={`placeholder-${i}`}
                        className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50"
                    >
                        <Package className="size-5 text-gray-300" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function VariantSelector({
    variants,
    selected,
    onChange,
}: {
    variants: Variant[];
    selected: Variant | null;
    onChange: (v: Variant | null) => void;
}) {
    return (
        <div>
            <h3 className="text-sm font-medium text-gray-900">
                Pilih Varian <span className="text-gray-400">(Pilih salah satu)</span>
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => onChange(selected?.id === v.id ? null : v)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                            selected?.id === v.id
                                ? 'border-[#4648d4] bg-[#eef0ff] text-[#4648d4]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                        {selected?.id === v.id && <Check size={14} />}
                        {v.name}
                        {v.additional_price > 0 && (
                            <span className="text-xs opacity-70">(+{formatPrice(v.additional_price)})</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function TransactionCard({
    currentPrice,
    quantity,
    setQuantity,
    stock,
    addToCart,
    buyNow,
}: {
    currentPrice: number;
    quantity: number;
    setQuantity: (n: number) => void;
    stock: number;
    addToCart: () => void;
    buyNow: () => void;
}) {
    const subtotal = currentPrice * quantity;

    return (
        <div className="sticky top-24 space-y-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#4648d4]">{formatPrice(currentPrice)}</span>
                {stock > 0 && (
                    <span className="text-xs text-gray-400">Stok: {stock}</span>
                )}
            </div>

            <Separator />

            <div>
                <p className="mb-2 text-sm font-medium text-gray-900">Jumlah</p>
                <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-2 hover:bg-gray-50 disabled:opacity-30"
                            disabled={quantity <= 1}
                        >
                            <Minus size={16} />
                        </button>
                        <span className="flex min-w-[3rem] items-center justify-center text-sm font-medium">
                            {quantity}
                        </span>
                        <button
                            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                            className="p-2 hover:bg-gray-50 disabled:opacity-30"
                            disabled={quantity >= stock}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <span className="text-xs text-gray-400">
                        {stock > 0 ? `Maks. ${stock}` : 'Stok habis'}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
            </div>

            <Button
                onClick={addToCart}
                disabled={stock < 1}
                className="w-full bg-[#fea619] text-[#684000] hover:bg-[#ffb95f]"
            >
                <ShoppingCart className="mr-2 size-4" /> + Keranjang
            </Button>

            <Button variant="outline" onClick={buyNow} disabled={stock < 1} className="w-full">
                Beli Langsung
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <button className="flex items-center gap-1 hover:text-[#4648d4]">
                    <MessageCircle size={14} /> Chat
                </button>
                <button className="flex items-center gap-1 hover:text-[#4648d4]">
                    <Heart size={14} /> Wishlist
                </button>
                <button className="flex items-center gap-1 hover:text-[#4648d4]">
                    <Share2 size={14} /> Share
                </button>
            </div>
        </div>
    );
}

function StoreInfoSection({ store }: { store: any }) {
    return (
        <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef0ff] text-lg font-bold text-[#4648d4]">
                    {store.logo_url ? (
                        <img src={store.logo_url} alt={store.name} className="size-full object-cover" />
                    ) : (
                        store.name?.charAt(0) || 'T'
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <Link
                        href={`/store/${store.slug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-[#4648d4]"
                    >
                        {store.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                        {store.city && (
                            <span className="flex items-center gap-0.5">
                                <MapPin size={12} /> {store.city}
                            </span>
                        )}
                    </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/store/${store.slug}`}>Kunjungi</Link>
                </Button>
            </div>
        </div>
    );
}

function ProductTabs({ product }: { product: any }) {
    const [activeTab, setActiveTab] = useState<'detail' | 'info'>('detail');

    return (
        <div>
            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('detail')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'detail'
                            ? 'border-b-2 border-[#4648d4] text-[#4648d4]'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Detail Produk
                </button>
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'info'
                            ? 'border-b-2 border-[#4648d4] text-[#4648d4]'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Info Penting
                </button>
            </div>

            <div className="py-4 text-sm leading-relaxed text-gray-600">
                {activeTab === 'detail' ? (
                    product.description ? (
                        <p className="whitespace-pre-wrap">{product.description}</p>
                    ) : (
                        <p className="text-gray-400 italic">Tidak ada deskripsi produk.</p>
                    )
                ) : (
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b">
                                <td className="py-2 font-medium text-gray-900">Berat</td>
                                <td className="py-2 text-gray-600">{product.weight ?? '-'} gr</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2 font-medium text-gray-900">Kondisi</td>
                                <td className="py-2 text-gray-600">{product.condition ?? 'Baru'}</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2 font-medium text-gray-900">Kategori</td>
                                <td className="py-2 text-gray-600">{product.category ?? '-'}</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2 font-medium text-gray-900">Min. Pembelian</td>
                                <td className="py-2 text-gray-600">{product.min_buy ?? 1} buah</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function ReviewsSection({ reviews }: { reviews: any }) {
    const totalDist = reviews.distribution.reduce((s: number, n: number) => s + n, 0);
    const pct = (star: number) => totalDist > 0 ? ((reviews.distribution[5 - star] ?? 0) / totalDist) * 100 : 0;
    const satisfactionPct = totalDist > 0
        ? Math.round((((reviews.distribution[0] ?? 0) + (reviews.distribution[1] ?? 0)) / totalDist) * 100)
        : 0;

    return (
        <section className="border-t border-gray-200 py-8">
            <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-lg font-bold text-gray-900">ULASAN PEMBELI</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* left — rating summary (4 cols) */}
                <div className="md:col-span-4">
                    <div className="mb-6">
                        <div className="text-center md:text-left">
                            <span className="text-[48px] font-bold text-gray-900 leading-none">
                                {reviews.average}
                                <span className="text-base font-normal text-gray-500">/ 5.0</span>
                            </span>
                        </div>
                        <div className="flex justify-center md:justify-start gap-0.5 my-2">
                            <StarRating rating={reviews.average} size={20} />
                        </div>
                        <p className="text-sm text-gray-500">{satisfactionPct}% pembeli merasa puas</p>
                        <p className="text-sm text-gray-500">{reviews.total} rating • {reviews.recent.length} ulasan</p>
                    </div>

                    {/* distribution bars */}
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-700 w-3">{star}</span>
                                <Star size={16} className="fill-yellow-400 text-yellow-400 shrink-0" />
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gray-900 rounded-full transition-all"
                                        style={{ width: `${pct(star)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">
                                    ({reviews.distribution[5 - star] ?? 0})
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* filter */}
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">FILTER ULASAN</h3>
                        <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                            Media
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* right — review cards (8 cols) */}
                <div className="md:col-span-8">
                    {/* media */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">FOTO & VIDEO PEMBELI</h3>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                            {reviews.recent.slice(0, 4).map((r: any, idx: number) => (
                                <div key={idx} className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-300">
                                    <Package size={24} />
                                </div>
                            ))}
                            {reviews.recent.length === 0 && (
                                <p className="text-sm text-gray-400">Belum ada foto atau video dari pembeli.</p>
                            )}
                        </div>
                    </div>

                    {/* review list */}
                    <div className="space-y-6">
                        {reviews.recent.length === 0 && (
                            <p className="text-sm text-gray-400">Belum ada ulasan untuk toko ini.</p>
                        )}
                        {reviews.recent.map((r: any) => (
                            <div key={r.id} className="pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                                <div className="flex items-center gap-1 mb-1">
                                    <StarRating rating={r.rating} size={16} />
                                    <span className="text-sm text-gray-500 ml-1">{r.date}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                                        {(r.user_name?.charAt(0) || 'A').toUpperCase()}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{r.user_name}</span>
                                </div>
                                {r.review && (
                                    <p className="text-sm text-gray-700">{r.review}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </div>
        </section>
    );
}

function RelatedProductCard({ product }: { product: any }) {
    return (
        <Link
            href={`/store/${product.store.slug}/products/${product.slug}`}
            className="group rounded-xl border bg-white p-3 transition-shadow hover:shadow-md"
        >
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="size-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                    <div className="flex size-full items-center justify-center text-gray-300"><Package className="size-10" /></div>
                )}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
            <p className="mt-1 text-sm font-bold text-[#4648d4]">{formatPrice(product.display_price)}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                {product.sales_count > 0 && <span>Terjual {product.sales_count}+</span>}
                {product.store?.city && <span>{product.store.city}</span>}
            </div>
        </Link>
    );
}

export default function ProductDetail({ product }: { product: any }) {
    const { auth } = usePage().props as any;
    const isAuth = !!auth?.user;
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [quantity, setQuantity] = useState(1);

    const currentPrice = Number(product.display_price) + Number(selectedVariant?.additional_price || 0);

    function ensureCustomer() {
        if (!isAuth) {
            router.visit(`/customer/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            return false;
        }
        if (!auth?.user?.has_customer_account) {
            toast.error('Hanya akun pembeli yang bisa berbelanja');
            return false;
        }
        return true;
    }

    function addToCart() {
        if (!ensureCustomer()) return;
        router.post('/cart/add', {
            product_id: product.id,
            product_variant_id: selectedVariant?.id || null,
            quantity,
        }, {
            onSuccess: () => toast.success('Ditambahkan ke keranjang'),
        });
    }

    function buyNow() {
        if (!ensureCustomer()) return;
        router.post('/cart/add', {
            product_id: product.id,
            product_variant_id: selectedVariant?.id || null,
            quantity,
        }, {
            onSuccess: () => router.visit('/checkout'),
        });
    }

    return (
        <>
            <Head title={`${product.name} - Kasirku Marketplace`} />
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-6">
                    {/* breadcrumb */}
                    <nav className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                        <Link href="/" className="hover:text-[#4648d4]">Kategori</Link>
                        <span>/</span>
                        {product.category && (
                            <>
                                <Link href={`/store/${product.store.slug}`} className="hover:text-gray-600">
                                    {product.store.name}
                                </Link>
                                <span>/</span>
                                <span className="text-gray-600">{product.category}</span>
                                <span>/</span>
                            </>
                        )}
                        <span className="truncate text-gray-600 max-w-[200px]">{product.name}</span>
                    </nav>

                    {/* back */}
                    <Link
                        href={`/store/${product.store.slug}`}
                        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4648d4]"
                    >
                        <ArrowLeft size={16} /> Kembali ke toko
                    </Link>

                    {/* main grid */}
                    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* left column — images */}
                        <div className="lg:col-span-4">
                            <ImageGallery imageUrl={product.image_url} name={product.name} />
                        </div>

                        {/* middle column — product details */}
                        <div className="space-y-4 lg:col-span-5">
                            {/* title + meta */}
                            <div className="rounded-xl border bg-white p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-700 hover:bg-green-100"
                                    >
                                        {product.condition}
                                    </Badge>
                                    {product.sales_count > 0 && (
                                        <span className="text-xs text-gray-400">
                                            Terjual {product.sales_count}+
                                        </span>
                                    )}
                                    {product.reviews?.total > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <StarRating rating={product.reviews.average} size={12} />
                                            <span>({product.reviews.total} rating)</span>
                                        </div>
                                    )}
                                </div>

                                <h1 className="mt-3 text-xl font-bold text-gray-900">{product.name}</h1>
                                <p className="mt-1 text-3xl font-bold text-[#4648d4]">
                                    {formatPrice(currentPrice)}
                                </p>
                            </div>

                            {/* variants */}
                            {product.variants?.length > 0 && (
                                <div className="rounded-xl border bg-white p-5">
                                    <VariantSelector
                                        variants={product.variants}
                                        selected={selectedVariant}
                                        onChange={setSelectedVariant}
                                    />
                                </div>
                            )}

                            {/* tabs: detail / info penting */}
                            <div className="rounded-xl border bg-white p-5">
                                <ProductTabs product={product} />
                            </div>

                            {/* store info */}
                            <StoreInfoSection store={product.store} />
                        </div>

                        {/* right column — transaction card */}
                        <div className="lg:col-span-3">
                            <TransactionCard
                                currentPrice={currentPrice}
                                quantity={quantity}
                                setQuantity={setQuantity}
                                stock={product.stock}
                                addToCart={addToCart}
                                buyNow={buyNow}
                            />
                        </div>
                    </div>

                    {/* related products — if any */}
                    {product.related?.length > 0 && (
                        <div className="mt-6">
                            <div className="rounded-xl border bg-white p-5">
                                <h2 className="text-lg font-semibold text-gray-900">Produk Terkait</h2>
                                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                    {product.related.map((rp: any) => (
                                        <RelatedProductCard key={rp.id} product={rp} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* reviews — standalone section below main grid */}
                <ReviewsSection reviews={product.reviews} />

            </div>
        </>
    );
}
