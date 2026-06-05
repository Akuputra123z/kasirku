'use client';

import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Bell,
    ChevronRight,
    CreditCard,
    Github,
    MessageCircle,
    Package,
    Play,
    QrCode,
    Rocket,
    ShoppingCart,
    Store,
    TrendingUp,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const isAuthenticated = !!auth?.user;
    const [showVideo, setShowVideo] = useState(false);

    return (
        <>
            <Head title="Kasirku - Solusi POS Digital UMKM" />

            <style>{'html { scroll-behavior: smooth; }'}</style>
            <div className="flex min-h-screen flex-col bg-[#f8f9fa] text-[#191c1d] antialiased">
                {/* ── STICKY NAVBAR ── */}
                <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[#c7c4d7]/30 bg-[#f8f9fa] px-4 py-3 shadow-sm transition-all duration-300 md:px-8 md:py-4">
                    <div className="flex items-center gap-2">
                        <Store
                            className="text-[#4648d4]"
                            size={28}
                            fill="currentColor"
                        />
                        <span className="text-2xl font-bold text-[#4648d4]">
                            Kasirku UMKM
                        </span>
                    </div>
                    <nav className="hidden items-center gap-6 md:flex">
                        {[
                            { label: 'Fitur', href: '#fitur' },
                            { label: 'Harga', href: '#harga' },
                            { label: 'Tentang Kami', href: '#tentang' },
                        ].map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="rounded-md px-3 py-2 text-[14px] font-semibold text-[#464554] transition-all duration-200 hover:bg-[#f3f4f5] hover:text-[#4648d4]"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Link
                                href={dashboard()}
                                className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-[#4648d4]/20 transition-all hover:bg-[#6063ee] active:scale-95"
                            >
                                Dashboard
                                <ArrowRight className="size-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="hidden rounded-md px-4 py-2 text-[14px] font-semibold text-[#191c1d] transition-colors hover:text-[#4648d4] md:block"
                                >
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-[#fea619] px-6 py-2.5 text-[14px] font-semibold text-[#684000] shadow-[0_4px_20px_rgba(254,166,25,0.2)] transition-colors duration-150 hover:bg-[#ffb95f] active:scale-95"
                                    >
                                        Coba Gratis
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </header>

                {/* ── HERO SECTION ── */}
                <section className="relative overflow-hidden px-4 pt-16 pb-24 md:px-8 md:pt-24 md:pb-32">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">
                        {/* Hero Content */}
                        <div className="z-10 flex flex-col gap-6">
                            <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#e1e0ff] bg-[#e1e0ff]/30 px-3 py-1.5 text-sm font-medium text-[#2f2ebe]">
                                <Rocket className="size-4" />
                                Revolusi Kasir Digital
                            </div>

                            <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-tight text-[#191c1d] md:text-[56px]">
                                Kelola Penjualan Toko, <br />
                                <span className="relative inline-block text-[#4648d4]">
                                    Pantau dari Mana Saja.
                                    <svg
                                        className="absolute -bottom-1 left-0 h-3 w-full text-[#fea619] opacity-50"
                                        viewBox="0 0 200 9"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M2.00049 6.84021C61.423 1.94294 135.251 -1.4116 198.001 6.84021"
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeWidth="3"
                                        />
                                    </svg>
                                </span>
                            </h1>

                            <p className="max-w-lg text-[18px] leading-7 text-[#464554]">
                                Solusi POS digital paling simpel untuk UMKM.
                                Catat transaksi, kelola stok, dan terima
                                pembayaran QRIS dengan mudah, aman, dan cepat.
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                <Link
                                    href={canRegister ? register() : login()}
                                    className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-8 py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_20px_rgba(70,72,212,0.25)] transition-colors hover:bg-[#2f2ebe]"
                                >
                                    Mulai Sekarang
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setShowVideo(true)}
                                    className="flex items-center gap-2 rounded-xl border border-[#c7c4d7]/50 bg-[#f3f4f5] px-6 py-3.5 text-[14px] font-semibold text-[#191c1d] transition-colors hover:bg-[#edeeef]"
                                >
                                    <Play className="size-4" />
                                    Tonton Demo
                                </button>
                            </div>

                            <div className="mt-6 flex items-center gap-4 text-sm text-[#464554]">
                                <div className="flex -space-x-2">
                                    {['K', 'M', 'U'].map((letter, i) => (
                                        <div
                                            key={i}
                                            className={`flex size-8 items-center justify-center rounded-full border-2 border-[#f8f9fa] text-xs font-bold ${
                                                i === 0
                                                    ? 'bg-[#e1e0ff] text-[#07006c]'
                                                    : i === 1
                                                      ? 'bg-[#ffddb8] text-[#2a1700]'
                                                      : 'bg-[#6ffbbe] text-[#002113]'
                                            }`}
                                        >
                                            {letter}
                                        </div>
                                    ))}
                                </div>
                                <p>
                                    Dipercaya oleh <strong>10.000+</strong> UMKM
                                    Indonesia
                                </p>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative z-10 flex items-center justify-center">
                            <div
                                className="absolute inset-0 -z-10 animate-pulse rounded-full bg-gradient-to-tr from-[#e1e0ff]/50 to-[#6ffbbe]/30 blur-[80px]"
                                style={{ animationDuration: '4s' }}
                            />

                            <img
                                alt="SME owner with smartphone dashboard"
                                className="relative z-10 aspect-square w-full max-w-md rounded-2xl [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] object-cover mix-blend-multiply drop-shadow-2xl"
                                src="/landingpage.png"
                            />

                            <div
                                className="absolute top-1/4 -left-6 z-20 scale-90 animate-bounce rounded-xl bg-white/70 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md"
                                style={{ animationDuration: '3s' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                        <TrendingUp className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-[#464554]">
                                            Penjualan Hari Ini
                                        </p>
                                        <p className="text-sm font-bold text-[#191c1d]">
                                            +Rp 2.450k
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="absolute -right-4 bottom-1/4 z-20 scale-90 animate-bounce rounded-xl bg-white/70 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md"
                                style={{ animationDuration: '4s' }}
                            >
                                <div className="flex items-center gap-2">
                                    <QrCode className="size-5 text-[#4648d4]" />
                                    <p className="text-sm font-bold text-[#191c1d]">
                                        QRIS Ready
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── TRUSTED BY SECTION ── */}
                <section className="border-y border-[#c7c4d7]/20 bg-[#f8f9fa] py-12">
                    <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
                        <p className="mb-8 text-[14px] font-semibold tracking-widest text-[#464554] uppercase">
                            Terintegrasi dengan platform terbaik
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 md:gap-16">
                            {[
                                { icon: 'account_balance', name: 'Bank A' },
                                { icon: 'wallet', name: 'E-Wallet B' },
                                { icon: 'truck', name: 'Logistik C' },
                                { icon: 'package', name: 'Supply D' },
                            ].map((item) => (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-2 text-xl font-bold text-[#191c1d]"
                                >
                                    <Store className="size-8" />
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FEATURES SECTION ── */}
                <section
                    id="fitur"
                    className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-32"
                >
                    <div className="mx-auto mb-16 max-w-2xl text-center">
                        <h2 className="mb-4 text-[32px] font-bold text-[#191c1d]">
                            Solusi Pintar untuk Bisnis Modern
                        </h2>
                        <p className="text-[16px] leading-6 text-[#464554]">
                            Akselerasi pertumbuhan bisnis Anda dengan ekosistem
                            digital yang dirancang untuk efisiensi maksimal dan
                            pengambilan keputusan berbasis data.
                        </p>
                    </div>

                    <div className="mt-16 flex flex-col gap-24 md:gap-32">
                        {/* Feature 1: Kasir Kilat & QRIS */}
                        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-20">
                            <div className="order-2 flex-1 md:order-1">
                                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-[#e1e0ff] text-[#4648d4]">
                                    <ShoppingCart className="size-6" />
                                </div>
                                <h3 className="mb-4 text-[28px] font-bold text-[#191c1d]">
                                    Kasir Kilat & QRIS
                                </h3>
                                <p className="mb-6 text-[18px] leading-7 text-[#464554]">
                                    Proses transaksi dalam hitungan detik dengan
                                    antarmuka kasir yang intuitif. Terima
                                    pembayaran QRIS, tunai, dan nontunai dalam
                                    satu layar.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        {
                                            icon: ShoppingCart,
                                            text: 'Scan QRIS langsung dari aplikasi',
                                        },
                                        {
                                            icon: ArrowRight,
                                            text: 'Cetak struk otomatis',
                                        },
                                        {
                                            icon: BarChart3,
                                            text: 'Riwayat transaksi real-time',
                                        },
                                    ].map((item) => (
                                        <li
                                            key={item.text}
                                            className="flex items-center gap-3 text-[#191c1d]"
                                        >
                                            <item.icon className="size-5 text-[#fea619]" />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="order-1 flex flex-1 items-center justify-center md:order-2">
                                <img
                                    src="/qris.png"
                                    alt="QRIS"
                                    className="w-full max-w-sm object-contain"
                                />
                            </div>
                        </div>

                        {/* Feature 2: Manajemen Stok Otomatis */}
                        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-20">
                            <div className="order-1 flex flex-1 items-center justify-center">
                                <div className="w-full max-w-sm rounded-xl border border-[#c7c4d7]/30 bg-[#f3f4f5] p-8 shadow-xl">
                                    <div className="flex flex-col gap-4">
                                        {[
                                            {
                                                name: 'Kopi Susu Gula Aren',
                                                status: 'Sisa 5',
                                                urgent: true,
                                            },
                                            {
                                                name: 'Es Teh Manis',
                                                status: 'Aman',
                                                urgent: false,
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.name}
                                                className="flex h-12 w-full items-center justify-between rounded-lg bg-[#e1e3e4] px-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-6 rounded-sm bg-[#ffddb8]" />
                                                    <span className="text-sm text-[#191c1d]">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                                        item.urgent
                                                            ? 'bg-[#ffdad6] text-[#93000a]'
                                                            : 'bg-[#e1e0ff] text-[#07006c]'
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="order-2 flex-1">
                                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-[#ffddb8] text-[#684000]">
                                    <Package className="size-6" />
                                </div>
                                <h3 className="mb-4 text-[28px] font-bold text-[#191c1d]">
                                    Manajemen Stok Otomatis
                                </h3>
                                <p className="mb-6 text-[18px] leading-7 text-[#464554]">
                                    Nikmati ketenangan dengan fitur "Stok
                                    Anti-Lupa". Terima peringatan instan saat
                                    produk favorit mulai menipis agar penjualan
                                    tidak pernah terhenti.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-[#191c1d]">
                                        <Bell className="size-5 text-[#fea619]" />
                                        Notifikasi Low-stock
                                    </li>
                                    <li className="flex items-center gap-3 text-[#191c1d]">
                                        <ChevronRight className="size-5 text-[#fea619]" />
                                        Update Stok Real-time
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 3: Laporan Bisnis Real-time */}
                        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-20">
                            <div className="order-2 flex-1 md:order-1">
                                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-[#6ffbbe] text-[#005236]">
                                    <BarChart3 className="size-6" />
                                </div>
                                <h3 className="mb-4 text-[28px] font-bold text-[#191c1d]">
                                    Laporan Bisnis Real-time
                                </h3>
                                <p className="mb-6 text-[18px] leading-7 text-[#464554]">
                                    Pantau performa bisnis dari mana saja. Lihat
                                    grafik laba rugi yang cantik dan ringkasan
                                    harian untuk strategi bisnis yang lebih
                                    tajam.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-[#191c1d]">
                                        <TrendingUp className="size-5 text-[#00885d]" />
                                        Analisis Pertumbuhan
                                    </li>
                                    <li className="flex items-center gap-3 text-[#191c1d]">
                                        <ArrowRight className="size-5 text-[#00885d]" />
                                        Ekspor Laporan Sekali Klik
                                    </li>
                                </ul>
                            </div>
                            <div className="order-1 flex flex-1 items-center justify-center md:order-2">
                                <div className="w-full max-w-sm rounded-xl border border-[#c7c4d7]/30 bg-[#f3f4f5] p-8 shadow-xl">
                                    <div className="flex h-56 w-full flex-col justify-end rounded-lg bg-[#e1e3e4] p-4">
                                        <div className="flex h-full items-end gap-2">
                                            {[35, 55, 40, 70, 50, 80, 65].map(
                                                (h) => (
                                                    <div
                                                        key={h}
                                                        className="w-1/4 rounded-t-sm bg-[#00885d]"
                                                        style={{
                                                            height: `${h}%`,
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                        <div className="mt-2 border-t border-[#c7c4d7]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA / HARGA ── */}
                <section
                    id="harga"
                    className="mt-10 mb-20 bg-[#4648d4] px-4 py-20 md:px-8"
                >
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-[clamp(1.3rem,2.5vw,2rem)] font-extrabold text-white">
                            Siap Mengelola Bisnis Lebih Mudah?
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/80">
                            Bergabung dengan ribuan UMKM Indonesia yang sudah
                            beralih ke Kasirku. Gratis 14 hari, tanpa komitmen.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <Link
                                href={canRegister ? register() : login()}
                                className="inline-flex h-13 items-center gap-2 rounded-xl bg-white px-8 text-[14px] font-bold text-[#4648d4] shadow-lg shadow-[#4648d4]/20 transition-all hover:bg-indigo-50 active:scale-[0.97]"
                            >
                                Mulai Coba Gratis
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER / TENTANG KAMI ── */}
                <footer
                    id="tentang"
                    className="border-t border-[#c7c4d7]/30 bg-[#f8f9fa] px-4 pt-20 pb-12 md:px-8"
                >
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-6">
                            {/* Brand */}
                            <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-3">
                                <div className="flex items-center gap-2">
                                    <Store
                                        className="text-[#4648d4]"
                                        size={28}
                                        fill="currentColor"
                                    />
                                    <span className="text-2xl font-bold text-[#4648d4]">
                                        Kasirku UMKM
                                    </span>
                                </div>
                                <p className="max-w-sm text-[16px] leading-6 text-[#464554]">
                                    Solusi POS digital paling simpel dan
                                    terpercaya untuk pemberdayaan UMKM di
                                    seluruh Indonesia.
                                </p>
                                <div className="mt-4 flex items-center gap-4">
                                    {[
                                        {
                                            icon: Github,
                                            href: '#',
                                        },
                                        {
                                            icon: X,
                                            href: '#',
                                        },
                                        {
                                            icon: MessageCircle,
                                            href: '#',
                                        },
                                    ].map(({ icon: Icon, href }) => (
                                        <a
                                            key={href}
                                            href={href}
                                            className="flex size-10 items-center justify-center rounded-full border border-[#c7c4d7] text-[#464554] transition-all hover:border-[#4648d4] hover:text-[#4648d4]"
                                        >
                                            <Icon className="size-5" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Links */}
                            {[
                                {
                                    title: 'Resources',
                                    links: ['Roadmap', 'Docs', 'Blog'],
                                },
                                {
                                    title: 'Legal',
                                    links: [
                                        'Kebijakan Privasi',
                                        'Syarat & Ketentuan',
                                    ],
                                },
                                {
                                    title: 'Help & Support',
                                    links: ['Bantuan', 'Kontak Kami'],
                                },
                            ].map((col) => (
                                <div
                                    key={col.title}
                                    className="flex flex-col gap-6"
                                >
                                    <h4 className="text-[14px] font-bold tracking-wider text-[#191c1d] uppercase">
                                        {col.title}
                                    </h4>
                                    <nav className="flex flex-col gap-3">
                                        {col.links.map((link) => (
                                            <a
                                                key={link}
                                                href="#"
                                                className="text-[16px] leading-6 text-[#464554] transition-colors hover:text-[#4648d4]"
                                            >
                                                {link}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            ))}
                        </div>

                        {/* Large brand */}
                        <div className="pt-20">
                            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                                <div className="flex flex-col">
                                    <span className="mb-2 text-xs font-bold text-[#464554]">
                                        &copy; {new Date().getFullYear()}{' '}
                                        Kasirku UMKM.
                                    </span>
                                    <h2 className="text-[64px] leading-none font-black tracking-tighter text-[#191c1d]/5 select-none md:text-[120px] lg:text-[180px]">
                                        Kasirku.
                                    </h2>
                                </div>
                                <div className="flex gap-4 pb-4">
                                    <button className="flex size-10 items-center justify-center rounded-full bg-[#fea619] text-[#684000] shadow-lg">
                                        <Rocket className="size-5" />
                                    </button>
                                    <button className="flex size-10 items-center justify-center rounded-full bg-[#191c1d] text-[#f8f9fa] shadow-lg">
                                        <MessageCircle className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Video Modal */}
            {showVideo && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() => setShowVideo(false)}
                >
                    <div
                        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowVideo(false)}
                            className="absolute -top-0.5 -right-0.5 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#191c1d] shadow-md transition-colors hover:bg-white"
                        >
                            <X className="size-4" />
                        </button>
                        <div className="aspect-video w-full">
                            <iframe
                                className="h-full w-full"
                                src="https://www.youtube-nocookie.com/embed/_Xi_I9x1yuU?autoplay=1"
                                title="Video Demo"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
