'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart, Store, TrendingUp } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PageProps = {
    auth: { user: { email: string; name: string } };
};

export default function CreateStore() {
    const { auth } = usePage<PageProps>().props;
    const [form, setForm] = useState({ store_name: '', address: '', phone: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/customer/buka-toko', form, {
            onError: (err) => {
                const mapped: Record<string, string> = {};
                for (const [key, msgs] of Object.entries(err)) {
                    mapped[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
                }
                setErrors(mapped);
                setProcessing(false);
            },
            onSuccess: () => setShowSuccess(true),
            onFinish: () => setProcessing(false),
        });
    }

    if (showSuccess) {
        return (
            <>
                <Head title="Toko Berhasil Dibuat - Kasirku Marketplace" />
                <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#4648d4] to-[#6063ee] px-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-md">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-400/30">
                            <svg className="size-8 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <h1 className="mb-2 text-2xl font-bold text-white">Toko Berhasil Dibuat!</h1>
                        <p className="mb-8 text-white/70">Selamat datang di Kasirku UMKM. Kelola toko kamu sekarang.</p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-[#4648d4] shadow-lg hover:bg-white/90 transition-all"
                        >
                            <Store className="size-5" />
                            Kelola Toko Saya
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Buka Toko - Kasirku Marketplace" />
            <div className="flex min-h-dvh flex-col lg:flex-row">
                {/* ─── Left — Form Panel ──────────────────────────────────── */}
                <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto bg-[#f8f9fa] px-5 py-6 lg:px-16 lg:py-10">
                    <div className="w-full max-w-[440px] space-y-6">
                        {/* Back */}
                        <Link
                            href="/customer/dashboard"
                            className="group inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#4648d4] transition-colors"
                        >
                            <svg className="size-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            Kembali
                        </Link>

                        {/* Brand */}
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-[#4648d4] shadow-lg shadow-[#4648d4]/20 lg:size-10">
                                <Store className="size-4 text-white lg:size-5" />
                            </div>
                            <span className="text-xl leading-none font-bold text-[#4648d4] lg:text-2xl">
                                Kasirku
                                <span className="text-[#fea619]"> UMKM</span>
                            </span>
                        </Link>

                        {/* Page header */}
                        <div className="space-y-1">
                            <h1 className="text-2xl leading-tight font-bold text-[#191c1d]">
                                Buka Toko Online
                            </h1>
                            <p className="text-sm leading-relaxed text-[#464554]">
                                Jangkau lebih banyak pelanggan dan kelola bisnis dari satu tempat.
                            </p>
                        </div>

                        {/* Form */}
                        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-sm font-semibold text-[#191c1d]">
                                Lengkapi Data Toko
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="email" className="text-xs font-medium text-[#464554]">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={auth.user.email}
                                        disabled
                                        className="mt-1.5 bg-[#f3f4f6] text-[#6b7280]"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="store_name" className="text-xs font-medium text-[#464554]">
                                        Nama Toko <span className="text-[#fea619]">*</span>
                                    </Label>
                                    <div className="relative mt-1.5">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Store className="size-4 text-[#9ca3af]" />
                                        </div>
                                        <Input
                                            id="store_name"
                                            value={form.store_name}
                                            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                                            required
                                            placeholder="Contoh: Toko Berkah"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.store_name && <p className="mt-1 text-xs text-red-500">{errors.store_name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="address" className="text-xs font-medium text-[#464554]">
                                        Alamat Toko <span className="text-[#9ca3af]">(opsional)</span>
                                    </Label>
                                    <div className="relative mt-1.5">
                                        <div className="pointer-events-none absolute left-0 top-3 flex items-start pl-3">
                                            <svg className="size-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                            </svg>
                                        </div>
                                        <textarea
                                            id="address"
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            rows={3}
                                            className="mt-0 flex w-full rounded-xl border border-[#d1d5db] bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-[#9ca3af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4648d4] focus-visible:border-[#4648d4]"
                                            placeholder="Jl. Contoh No. 123, Kecamatan, Kota"
                                        />
                                    </div>
                                    {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="phone" className="text-xs font-medium text-[#464554]">
                                        No. HP Toko <span className="text-[#9ca3af]">(opsional)</span>
                                    </Label>
                                    <div className="relative mt-1.5">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <svg className="size-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                            </svg>
                                        </div>
                                        <Input
                                            id="phone"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="08123456789"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-[#4648d4] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#4648d4]/20 hover:bg-[#3b3db8] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                                            </svg>
                                            Membuat Toko...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            Buka Toko Sekarang
                                        </span>
                                    )}
                                </Button>

                                {errors.form && (
                                    <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                                        <svg className="mt-0.5 size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                        </svg>
                                        <span>{errors.form}</span>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-xs text-[#9ca3af]">
                            Dengan mendaftar, kamu menyetujui{' '}
                            <Link href="/" className="text-[#4648d4] hover:underline">Syarat & Ketentuan</Link>
                        </p>
                    </div>
                </div>

                {/* ─── Right — Visual Panel ─────────────────────────────────── */}
                <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-[#4648d4] to-[#6063ee] lg:flex">
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
                                    Mulai Jualan Online
                                </h2>
                                <p className="text-[16px] leading-[24px] text-white/80">
                                    Dapatkan akses ke fitur kasir digital, manajemen stok,
                                    dan laporan keuangan dalam satu platform.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                                    <div className="flex size-8 items-center justify-center rounded-full bg-[#00885d]">
                                        <ShoppingCart className="size-4 text-white" />
                                    </div>
                                    <span className="text-[14px] font-semibold text-white">
                                        Gratis
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                                    <div className="flex size-8 items-center justify-center rounded-full bg-[#494bd6]">
                                        <Store className="size-4 text-white" />
                                    </div>
                                    <span className="text-[14px] font-semibold text-white">
                                        Terintegrasi
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
