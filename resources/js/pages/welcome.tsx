'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Bell,
    ChevronRight,
    ChevronDown,
    CreditCard,
    Github,
    LogOut,
    MessageCircle,
    MessageSquare,
    Package,
    Play,
    QrCode,
    Rocket,
    Search,
    ShoppingCart,
    Store,
    Settings,
    TrendingUp,
    X,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { dashboard, login, register } from '@/routes';
import CategoryDropdown from '@/components/marketplace/CategoryDropdown';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth, cartCount, marketplaceCategories } = usePage().props as any;
    const isAuthenticated = !!auth?.user;
    const isCustomer = auth?.user?.has_customer_account;
    const hasStore = auth?.user?.has_store;
    const [showVideo, setShowVideo] = useState(false);
    const [search, setSearch] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const initial = auth?.user?.name?.[0]?.toUpperCase() || 'U';

    const quickCategories = marketplaceCategories?.slice(0, 6) ?? [];

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (search.trim()) {
            router.get(`/stores?search=${encodeURIComponent(search.trim())}`);
        }
    }

    return (
        <>
            <Head title="Kasirku - Solusi POS Digital UMKM" />

            <style>{'html { scroll-behavior: smooth; }'}</style>
            <div className="flex min-h-screen flex-col bg-[#f8f9fa] text-[#191c1d] antialiased">
                {/* ── TOPBAR ── */}
                <div className="bg-gray-100 dark:bg-slate-800 text-xs py-2 px-4 md:px-20 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <span className="text-[#4648d4] dark:text-[#818cf8] font-medium cursor-default">Download App</span>
                        <Link href="/stores" className="text-slate-500 dark:text-slate-400 hover:text-[#4648d4]">Tentang UMKM</Link>
                        {isAuthenticated && hasStore ? (
                            <Link href="/dashboard" className="text-[#4648d4] dark:text-[#818cf8] font-medium hover:text-[#3b3db8]">Toko Saya</Link>
                        ) : isAuthenticated ? (
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

                {/* ── MAIN NAVBAR ── */}
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

                            {isAuthenticated ? (
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setShowProfile((v) => !v)}
                                        className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="size-7 rounded-full bg-[#4648d4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {auth?.user?.profile_photo_url ? (
                                                <img src={auth.user.profile_photo_url} alt="" className="size-full object-cover rounded-full" />
                                            ) : (
                                                initial
                                            )}
                                        </div>
                                        <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
                                            {auth?.user?.name}
                                        </span>
                                        <ChevronDown className="size-3 text-slate-400 hidden lg:block" />
                                    </button>

                                    {showProfile && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{auth?.user?.name}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{auth?.user?.email}</p>
                                                </div>
                                                {isCustomer && (
                                                    <Link href="/customer/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setShowProfile(false)}>
                                                        <Settings className="size-4" />
                                                        Dashboard
                                                    </Link>
                                                )}
                                                {hasStore && (
                                                    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setShowProfile(false)}>
                                                        <Store className="size-4" />
                                                        Toko Saya
                                                    </Link>
                                                )}
                                                <hr className="border-gray-100 dark:border-slate-800 my-1" />
                                                <button onClick={() => router.post('/logout')} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors">
                                                    <LogOut className="size-4" />
                                                    Keluar
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href={login()} className="px-4 py-2 border border-[#4648d4] text-[#4648d4] font-semibold hover:bg-[#eef0ff] dark:hover:bg-[#4648d4]/20 transition-colors rounded-lg text-sm">
                                        Masuk
                                    </Link>
                                    <Link href={register()} className="px-4 py-2 bg-[#4648d4] text-white font-semibold hover:bg-[#3b3db8] transition-colors rounded-lg text-sm">
                                        Daftar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

              

                {/* ── HERO SECTION ── */}
                <section className="relative overflow-hidden px-4 pt-16 pb-24 md:px-8 md:pt-24 md:pb-32">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">
                        {/* Hero Content */}
                        <div className="z-10 flex flex-col gap-6">
                            <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#e1e0ff] bg-[#e1e0ff]/30 px-3 py-1.5 text-sm font-medium text-[#2f2ebe]">
                                <Rocket className="size-4" />
                                Solusi Digital untuk UMKM
                            </div>
                            <h1 className="text-4xl font-bold leading-tight md:text-5xl md:leading-tight text-[#191c1d]">
                                Kelola{' '}
                                <span className="text-[#4648d4]">Bisnis</span>{' '}
                                Lebih Mudah &{' '}
                                <span className="text-[#4648d4]">Pintar</span>
                            </h1>
                            <p className="max-w-lg text-base leading-relaxed text-gray-600">
                                Aplikasi POS & Marketplace UMKM #1 di Indonesia. Atur stok, catat transaksi, 
                                dan jangkau lebih banyak pelanggan dalam satu platform.
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <Link
                                    href={register()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#4648d4] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3b3db8] transition-colors"
                                >
                                    Mulai Gratis
                                    <ArrowRight className="size-4" />
                                </Link>
                                <Link
                                    href="/stores"
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Store className="size-4" />
                                    Jelajahi Toko
                                </Link>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-gray-500 pt-2">
                                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-green-500"></span> Gratis Selamanya</span>
                                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-green-500"></span> Tanpa Kode Kartu</span>
                                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-green-500"></span> 24/7 Support</span>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative z-10 flex items-center justify-center">
                            <div className="relative w-full max-w-md">
                                <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-[#4648d4]/10 to-[#818cf8]/10 border border-[#4648d4]/20 flex items-center justify-center shadow-2xl shadow-[#4648d4]/10">
                                    <div className="text-center p-8">
                                        <BarChart3 className="size-16 text-[#4648d4]/40 mx-auto mb-4" />
                                        <p className="text-sm text-gray-500">Dashboard Interaktif</p>
                                        <p className="text-2xl font-bold text-[#4648d4] mt-2">Rp 12.8 Juta</p>
                                        <p className="text-xs text-gray-400 mt-1">Pendapatan Bulan Ini</p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#4648d4]/5 rounded-2xl border border-[#4648d4]/10 flex items-center justify-center">
                                    <TrendingUp className="size-8 text-green-500" />
                                </div>
                                <div className="absolute -top-4 -left-4 w-20 h-20 bg-orange-50 rounded-2xl border border-orange-200 flex items-center justify-center">
                                    <CreditCard className="size-8 text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── REMAINING CONTENT (kept from original) ── */}
                {/* Features Section */}
                <section className="px-4 pb-24 md:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-[#191c1d] mb-4">Fitur Lengkap untuk UMKM</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">
                                Semua yang Anda butuhkan untuk mengelola toko dan menjangkau lebih banyak pelanggan.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: Package, title: 'Manajemen Stok', desc: 'Kelola inventaris dengan mudah, atur varian produk, dan pantau stok secara real-time.' },
                                { icon: QrCode, title: 'POS Digital', desc: 'Catat transaksi dengan cepat via QR Code, scan barcode, dan cetak struk otomatis.' },
                                { icon: BarChart3, title: 'Laporan & Analitik', desc: 'Pantau pertumbuhan bisnis dengan laporan penjualan harian, bulanan, dan tahunan.' },
                                { icon: Store, title: 'Marketplace UMKM', desc: 'Jual produk Anda di marketplace khusus UMKM dengan jangkauan pelanggan luas.' },
                                { icon: MessageCircle, title: 'Chat & Notifikasi', desc: 'Komunikasi langsung dengan pelanggan dan dapatkan notifikasi real-time.' },
                                { icon: TrendingUp, title: 'Multi-Toko', desc: 'Kelola beberapa toko dalam satu akun dengan dashboard terpisah.' },
                            ].map((f) => (
                                <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-[#4648d4]/20 transition-all duration-300 group">
                                    <div className="size-12 rounded-xl bg-[#4648d4]/5 flex items-center justify-center mb-5 group-hover:bg-[#4648d4]/10 transition-colors">
                                        <f.icon className="size-6 text-[#4648d4]" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-[#191c1d]">{f.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-4 pb-24 md:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4648d4] to-[#3b3db8] px-8 py-16 md:px-16 md:py-20 text-center">
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    Siap Mengembangkan Bisnis?
                                </h2>
                                <p className="text-[#c7d2fe] max-w-xl mx-auto mb-8">
                                    Bergabung dengan ribuan UMKM lainnya. Gratis selamanya, tanpa biaya tersembunyi.
                                </p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#4648d4] hover:bg-gray-50 transition-colors shadow-xl"
                                    >
                                        Daftar Sekarang
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <Link
                                        href="/stores"
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                                    >
                                        Lihat Demo
                                    </Link>
                                </div>
                            </div>
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-100 py-12 px-4 md:px-8">
                    <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Store className="text-[#4648d4]" size={24} fill="currentColor" />
                            <span className="font-bold text-[#4648d4]">LINKASPACE</span>
                        </div>
                        <p className="text-xs text-gray-400">&copy; 2026 LINKASPACE. All rights reserved.</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <Link href="/stores" className="hover:text-[#4648d4]">Kebijakan Privasi</Link>
                            <Link href="/stores" className="hover:text-[#4648d4]">Syarat Ketentuan</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
