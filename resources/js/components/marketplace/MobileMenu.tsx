'use client';

import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu, Search, Settings, Store } from 'lucide-react';
import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

interface CategoryChild {
    name: string;
    slug: string;
}

interface CategoryParent {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    children: CategoryChild[];
}

export default function MobileMenu({
    categories = [],
}: {
    categories?: CategoryParent[];
}) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const isCustomer = user?.has_customer_account;
    const hasStore = user?.has_store;
    const [search, setSearch] = useState('');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (search.trim()) {
            router.get(`/stores?search=${encodeURIComponent(search.trim())}`);
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    aria-label="Buka menu"
                    className="p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
                >
                    <Menu className="size-5" />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] max-w-xs gap-0 p-0">
                <SheetHeader className="border-b border-gray-100 dark:border-slate-800">
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                {/* Mobile search */}
                <form onSubmit={handleSearch} className="p-4 border-b border-gray-100 dark:border-slate-800">
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4648d4] focus:border-[#4648d4] text-sm outline-none"
                            placeholder="Cari produk atau toko..."
                            type="text"
                        />
                    </div>
                </form>

                <div className="flex-1 overflow-y-auto py-2">
                    <Link
                        href="/all-products"
                        className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Semua Kategori
                        <span className="text-xs text-slate-400">→</span>
                    </Link>

                    {categories.slice(0, 8).map((category) => (
                        <Link
                            key={category.slug}
                            href={`/all-products?category=${category.slug}`}
                            className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-[#4648d4] transition-colors"
                        >
                            {category.name}
                        </Link>
                    ))}

                    <hr className="border-gray-100 dark:border-slate-800 my-2" />

                    <Link
                        href="/stores"
                        className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Toko
                    </Link>
                    <Link
                        href="/stores"
                        className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Promo
                    </Link>
                    <Link
                        href="/stores"
                        className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Tentang UMKM
                    </Link>
                    <span className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-default">
                        Bantuan
                    </span>
                </div>

                <SheetFooter className="border-t border-gray-100 dark:border-slate-800">
                    {user ? (
                        <div className="flex flex-col gap-2">
                            {isCustomer && (
                                <Link
                                    href="/customer/dashboard"
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <Settings className="size-4" />
                                    Dashboard
                                </Link>
                            )}
                            {hasStore && (
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <Store className="size-4" />
                                    Toko Saya
                                </Link>
                            )}
                            <button
                                onClick={() => router.post('/logout')}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left rounded-lg transition-colors"
                            >
                                <LogOut className="size-4" />
                                Keluar
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-2.5 border border-[#4648d4] text-[#4648d4] font-semibold hover:bg-[#eef0ff] dark:hover:bg-[#4648d4]/20 transition-colors rounded-lg text-sm text-center"
                            >
                                Masuk
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2.5 bg-[#4648d4] text-white font-semibold hover:bg-[#3b3db8] transition-colors rounded-lg text-sm text-center"
                            >
                                Daftar
                            </Link>
                        </div>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}