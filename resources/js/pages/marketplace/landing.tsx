'use client';

import { Head, Link, usePage } from '@inertiajs/react';
import { Moon, Sun, Store, MapPin, Package } from 'lucide-react';
import { useEffect, useState } from 'react';

import HeroBanner from '@/components/marketplace/HeroBanner';
import CategoryGrid from '@/components/marketplace/CategoryGrid';
import FlashSale from '@/components/marketplace/FlashSale';
import TopUpCard from '@/components/marketplace/TopUpCard';
import PartnerCard from '@/components/marketplace/PartnerCard';
import ProductGrid from '@/components/marketplace/ProductGrid';
import Newsletter from '@/components/marketplace/Newsletter';

interface Store {
    id: number;
    slug: string;
    name: string;
    city: string | null;
    logo_url: string | null;
    store_description: string | null;
    products_count: number;
}

interface Product {
    id: number;
    name: string;
    display_price: number;
    image_url: string | null;
    stock: number;
    tenant: { slug: string; name: string };
    category: string | null;
    city?: string;
    rating?: number;
    ratingCount?: string;
}

export default function MarketplaceLanding({
    stores,
    featuredProducts,
}: {
    stores: Store[];
    featuredProducts: Product[];
    filters: { search: string | null };
}) {
    const [dark, setDark] = useState(false);
    const { cartCount } = usePage().props as any;

    useEffect(() => {
        const html = document.documentElement;
        if (dark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [dark]);

    const mappedProducts = featuredProducts.map((p) => ({
        ...p,
        city: p.city || p.tenant?.name || 'Indonesia',
    }));

    return (
        <>
            <Head title="Marketplace UMKM - Belanja Produk Lokal Terbaik" />
            <div className="bg-[#f9fafb] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
                <main className="max-w-7xl mx-auto px-4 md:px-20 py-6 space-y-8">
                    <HeroBanner />

                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            <CategoryGrid />
                            <FlashSale />
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <TopUpCard />
                            <PartnerCard />
                        </div>
                    </section>

                    {stores.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Toko UMKM Pilihan</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Temukan produk terbaik dari toko terpercaya</p>
                                </div>
                                <Link href="/stores" className="flex items-center text-emerald-600 font-bold hover:underline">
                                    Lihat Semua →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {stores.map((store) => (
                                    <Link key={store.id} href={`/store/${store.slug}`}
                                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 hover:shadow-xl transition-all duration-300 group">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                                                {store.logo_url ? (
                                                    <img alt={store.name} className="w-8 h-8 object-contain" src={store.logo_url} />
                                                ) : (
                                                    <Store className="size-6 text-emerald-600" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm truncate">{store.name}</h3>
                                                {store.city && (
                                                    <div className="flex items-center text-xs text-slate-400">
                                                        <MapPin className="size-3 mr-0.5" />
                                                        {store.city}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {store.store_description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{store.store_description}</p>
                                        )}
                                        <div className="flex items-center text-xs text-emerald-600 font-medium">
                                            <Package className="size-3 mr-1" />
                                            {store.products_count} produk
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    <ProductGrid products={mappedProducts.length > 0 ? mappedProducts : undefined} />

                    <Newsletter />
                </main>

                <button
                    onClick={() => setDark(!dark)}
                    className="fixed bottom-6 right-6 w-12 h-12 bg-white dark:bg-slate-800 shadow-2xl rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-110 transition-all z-[100]"
                >
                    {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>
            </div>
        </>
    );
}
