'use client';

import { Link } from '@inertiajs/react';
import { BadgeCheck, MapPin, Store, ShoppingBag } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    slug: string;
    display_price: number;
    image_url: string | null;
    tenant: { slug: string; name: string };
    category: string | null;
    city?: string;
    rating?: number;
    ratingCount?: string;
}

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

interface ProductGridProps {
    products?: Product[];
    title?: string;
    subtitle?: string;
}

export default function ProductGrid({ products, title = 'Rekomendasi Untuk Kamu', subtitle = 'Kurasi produk terbaik berdasarkan minatmu' }: ProductGridProps) {
    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
                </div>
                <Link href="/all-products" className="flex items-center text-emerald-600 font-bold hover:underline">
                    Lihat Semua →
                </Link>
            </div>
            {products && products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {products.map((product) => (
                        <Link key={product.id} href={`/store/${product.tenant.slug}/products/${product.slug}`}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                            <div className="relative overflow-hidden aspect-square bg-slate-50 dark:bg-slate-800">
                                {product.image_url ? (
                                    <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image_url} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ShoppingBag className="size-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <span className="bg-white/95 backdrop-blur text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center shadow-sm">
                                        <BadgeCheck className="size-3 mr-1 text-emerald-600" /> UMKM
                                    </span>
                                </div>
                            </div>
                            <div className="p-3">
                                {product.category && (
                                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-1">{product.category}</div>
                                )}
                                <h3 className="text-sm font-medium leading-snug line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                                <div className="text-emerald-600 font-bold text-base">{formatPrice(product.display_price)}</div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-[10px] text-slate-400 truncate max-w-[100px] flex items-center gap-1">
                                        <Store className="size-3 shrink-0" />
                                        <span className="truncate">{product.tenant.name}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate max-w-[70px] flex items-center gap-0.5">
                                        <MapPin className="size-3 shrink-0" />
                                        {product.city ?? 'Indonesia'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                    <ShoppingBag className="size-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Belum ada produk tersedia saat ini.</p>
                    <Link href="/all-products" className="inline-block mt-3 text-emerald-600 font-bold hover:underline text-sm">
                        Jelajahi Produk
                    </Link>
                </div>
            )}
        </section>
    );
}
