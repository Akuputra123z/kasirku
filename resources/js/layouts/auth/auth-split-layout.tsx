import { Link } from '@inertiajs/react';
import { ShoppingCart, Store, TrendingUp } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-dvh flex-col lg:flex-row">
            {/* Left — Form Panel (scrollable) */}
            <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto bg-[#f8f9fa] px-5 py-6 lg:px-16 lg:py-10">
                <div className="w-full max-w-[440px] space-y-6">
                    {/* Brand */}
                    <Link href={home()} className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#4648d4] shadow-lg shadow-[#4648d4]/20 lg:size-10">
                            <Store className="size-4 text-white lg:size-5" />
                        </div>
                        <span className="text-xl leading-none font-bold text-[#4648d4] lg:text-2xl">
                            Kasirku
                            <span className="text-[#fea619]"> UMKM</span>
                        </span>
                    </Link>

                    {/* Page header */}
                    {title && (
                        <div className="space-y-1">
                            <h1 className="text-2xl leading-tight font-bold text-[#191c1d]">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm leading-relaxed text-[#464554]">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    {children}
                </div>
            </div>

            {/* Right — Visual Panel */}
            <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-[#4648d4] to-[#6063ee] lg:flex">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Merchant Illustration"
                        className="h-full w-full object-cover object-center opacity-80"
                        src="/screen.png"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#4648d4]/60 to-transparent" />
                </div>

                <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/2 rounded-full bg-[#fea619]/20 blur-3xl" />

                <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
                    <div className="flex justify-end">
                        <div className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                            <div className="flex size-10 items-center justify-center rounded-full bg-[#fea619] shadow-lg">
                                <TrendingUp className="size-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white/80 uppercase">
                                    Laba Hari Ini
                                </p>
                                <p className="text-[18px] font-bold text-white">
                                    Rp 2.450.000
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-[400px]">
                        <div className="mb-8 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                            <h2 className="mb-2 text-[24px] font-bold text-white">
                                Solusi Digital UMKM
                            </h2>
                            <p className="text-[16px] leading-[24px] text-white/80">
                                Satu platform untuk semua kebutuhan kasir, stok,
                                dan laporan keuangan Anda.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#00885d]">
                                    <ShoppingCart className="size-4 text-white" />
                                </div>
                                <span className="text-[14px] font-semibold text-white">
                                    Stok Aman
                                </span>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#494bd6]">
                                    <Store className="size-4 text-white" />
                                </div>
                                <span className="text-[14px] font-semibold text-white">
                                    QRIS Ready
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
