'use client';

import { Link, router, usePage } from '@inertiajs/react';
import { Store, Search, ShoppingCart, MessageSquare, LogOut, Bell, ChevronDown, Settings } from 'lucide-react';
import { useRef, useState } from 'react';
import CategoryDropdown from '@/components/marketplace/CategoryDropdown';
import MarketplaceFooter from '@/components/marketplace/MarketplaceFooter';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
    const { auth, cartCount, marketplaceCategories } = usePage().props as any;
    const user = auth?.user;
    const isAuth = !!user;
    const isCustomer = user?.has_customer_account;
    const hasStore = user?.has_store;
    const [search, setSearch] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (search.trim()) {
            router.get(`/stores?search=${encodeURIComponent(search.trim())}`);
        }
    }

    const initial = user?.name?.[0]?.toUpperCase() || 'U';
    const quickCategories = marketplaceCategories?.slice(0, 6) ?? [];

    return (
        <div className="font-sans min-h-screen bg-[#f9fafb] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* TopBar */}
            <div className="bg-gray-100 dark:bg-slate-800 text-xs py-2 px-4 md:px-20 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <span className="text-[#4648d4] dark:text-[#818cf8] font-medium cursor-default">
                        Download App
                    </span>
                    <Link href="/stores" className="text-slate-500 dark:text-slate-400 hover:text-[#4648d4]">Tentang UMKM</Link>
                    {isAuth && hasStore ? (
                        <Link href="/dashboard" className="text-[#4648d4] dark:text-[#818cf8] font-medium hover:text-[#3b3db8]">Toko Saya</Link>
                    ) : isAuth ? (
                        <Link href="/customer/buka-toko" className="text-[#4648d4] dark:text-[#818cf8] font-medium hover:text-[#3b3db8]">Buka Toko</Link>
                    ) : (
                        <Link href="/register" className="text-slate-500 dark:text-slate-400 hover:text-[#4648d4]">Mulai Berjualan</Link>
                    )}
                </div>
                <div className="flex items-center space-x-6 text-slate-500 dark:text-slate-400">
                    <Link href="/stores" className="hover:text-[#4648d4]">Promo</Link>
                    <span className="cursor-default">Bantuan</span>
                </div>
            </div>

            {/* Main Navbar */}
            <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between px-4 md:px-20 py-3 gap-6">
                    {/* Left: Branding + Category */}
                    <div className="flex items-center gap-6 shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            <Store className="text-[#4648d4]" size={28} fill="currentColor" />
                            <span className="text-xl font-bold text-[#4648d4]">LINKASPACE</span>
                        </Link>
                        <div className="hidden lg:flex items-center gap-5">
                            <CategoryDropdown categories={marketplaceCategories ?? []} />
                            <Link href="/stores" className="text-sm font-medium text-slate-600 hover:text-[#4648d4]">
                                Toko
                            </Link>
                        </div>
                    </div>

                    {/* Center: Search */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-3xl relative">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-5 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4648d4] focus:border-[#4648d4] text-sm outline-none"
                                placeholder="Cari produk atau toko..."
                                type="text"
                            />
                        </div>
                    </form>

                    {/* Right: Icons + Profile */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Link href="/customer/notifications" className="p-2.5 text-slate-500 hover:text-[#4648d4] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
                            <Bell className="size-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </Link>
                        <Link href="/cart" className="p-2.5 text-slate-500 hover:text-[#4648d4] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
                            <ShoppingCart className="size-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </Link>
                        <Link href="/customer/conversations" className="p-2.5 text-slate-500 hover:text-[#4648d4] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <MessageSquare className="size-5" />
                        </Link>

                        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1.5" />

                        {isAuth ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setShowProfile((v) => !v)}
                                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="size-7 rounded-full bg-[#4648d4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {user?.profile_photo_url ? (
                                            <img src={user.profile_photo_url} alt="" className="size-full object-cover rounded-full" />
                                        ) : (
                                            initial
                                        )}
                                    </div>
                                    <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
                                        {user?.name}
                                    </span>
                                    <ChevronDown className="size-3 text-slate-400 hidden lg:block" />
                                </button>

                                {showProfile && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white">{user?.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                                            </div>
                                            {isCustomer && (
                                                <Link
                                                    href="/customer/dashboard"
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                                    onClick={() => setShowProfile(false)}
                                                >
                                                    <Settings className="size-4" />
                                                    Dashboard
                                                </Link>
                                            )}
                                            {hasStore && (
                                                <Link
                                                    href="/dashboard"
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                                    onClick={() => setShowProfile(false)}
                                                >
                                                    <Store className="size-4" />
                                                    Toko Saya
                                                </Link>
                                            )}
                                            <hr className="border-gray-100 dark:border-slate-800 my-1" />
                                            <button
                                                onClick={() => router.post('/logout')}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                                            >
                                                <LogOut className="size-4" />
                                                Keluar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login" className="px-4 py-2 border border-[#4648d4] text-[#4648d4] font-semibold hover:bg-[#eef0ff] dark:hover:bg-[#4648d4]/20 transition-colors rounded-lg text-sm">
                                    Masuk
                                </Link>
                                <Link href="/register" className="px-4 py-2 bg-[#4648d4] text-white font-semibold hover:bg-[#3b3db8] transition-colors rounded-lg text-sm">
                                    Daftar
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>


            {children}

            <MarketplaceFooter />
        </div>
    );
}
