'use client';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, LogIn, Store, User } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    role?: 'store' | 'customer' | null;
};

type Step = 'select' | 'store' | 'customer';

export default function Login({
    status,
    canResetPassword,
    canRegister,
    redirect,
}: Props & { redirect?: string }) {
    const [step, setStep] = useState<Step>('select');
    const [form, setForm] = useState({
        email: '',
        password: '',
        remember: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/login', form, {
            onError: (errs) => {
                const mapped: Record<string, string> = {};
                for (const [key, msg] of Object.entries(errs)) {
                    mapped[key] = String(msg);
                }
                setErrors(mapped);
            },
            onFinish: () => setProcessing(false),
        });
    };

    if (step === 'select') {
        return (
            <>
                <Head title="Pilih Peran" />

                <div className="flex flex-col gap-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-[#191c1d]">
                            Masuk sebagai siapa?
                        </h2>
                        <p className="mt-1 text-sm text-[#464554]">
                            Pilih peran Anda untuk melanjutkan
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            type="button"
                            onClick={() => setStep('store')}
                            className="flex items-center gap-4 rounded-xl border-2 border-[#d7d4e7] bg-white p-5 text-left transition-all hover:border-[#4648d4] hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#e1e0ff] text-[#4648d4]">
                                <Store className="size-7" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[15px] font-bold text-[#191c1d]">
                                    Pemilik Toko
                                </p>
                                <p className="text-[13px] text-[#464554]">
                                    Kelola toko, POS, stok, dan laporan bisnis
                                </p>
                            </div>
                            <LogIn className="size-5 text-[#464554]" />
                        </button>

                        <button
                            type="button"
                            onClick={() => router.visit(`/customer/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`)}
                            className="flex items-center gap-4 rounded-xl border-2 border-[#d7d4e7] bg-white p-5 text-left transition-all hover:border-[#4648d4] hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#ffddb8] text-[#684000]">
                                <User className="size-7" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[15px] font-bold text-[#191c1d]">
                                    Pembeli
                                </p>
                                <p className="text-[13px] text-[#464554]">
                                    Belanja produk UMKM di marketplace
                                </p>
                            </div>
                            <LogIn className="size-5 text-[#464554]" />
                        </button>
                    </div>

                    {canRegister && (
                        <p className="text-center text-sm text-[#464554]">
                            Belum punya akun?{' '}
                            <Link
                                href="/register"
                                className="font-bold text-[#4648d4] hover:underline"
                            >
                                Daftar di sini
                            </Link>
                        </p>
                    )}

                    <div className="rounded-lg border border-dashed border-[#d7d4e7] bg-[#f3f4f5]/50 p-2.5 text-center">
                        <p className="text-[11px] text-[#464554]">
                            Admin pusat?{' '}
                            <a
                                href="/admin/login"
                                className="font-bold text-[#4648d4] hover:underline"
                            >
                                Login di sini
                            </a>
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Masuk" />

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Back to selection */}
                <button
                    type="button"
                    onClick={() => {
                        setStep('select');
                        setErrors({});
                    }}
                    className="flex items-center gap-1 text-[13px] font-medium text-[#464554] transition-colors hover:text-[#4648d4]"
                >
                    <ArrowLeft className="size-4" />
                    Ganti peran
                </button>

                {/* Email */}
                <div className="space-y-1">
                    <Label
                        htmlFor="email"
                        className="text-[13px] font-semibold text-[#191c1d]"
                    >
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoFocus
                        autoComplete="email"
                        placeholder="nama@email.com"
                        className="h-auto rounded-lg border border-[#d7d4e7] bg-white py-2 pr-3 pl-3 text-sm placeholder:text-[#767586]/60 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                    />
                    <InputError message={errors.email} />
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="password"
                            className="text-[13px] font-semibold text-[#191c1d]"
                        >
                            Password
                        </Label>
                        {canResetPassword && (
                            <Link
                                href="/forgot-password"
                                className="text-[11px] font-medium text-[#4648d4] hover:underline"
                            >
                                Lupa Password?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            placeholder="Masukkan password Anda"
                            className="h-auto w-full rounded-lg border border-[#d7d4e7] bg-white py-2 pr-10 pl-3 text-sm placeholder:text-[#767586]/60 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#767586] transition-colors hover:text-[#191c1d]"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                    <label className="group flex cursor-pointer items-center gap-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={form.remember}
                            onCheckedChange={(checked) =>
                                setForm((prev) => ({
                                    ...prev,
                                    remember: checked === true,
                                }))
                            }
                            className="size-4 data-[state=checked]:border-[#4648d4] data-[state=checked]:bg-[#4648d4]"
                        />
                        <span className="text-[13px] font-medium text-[#464554] transition-colors group-hover:text-[#191c1d]">
                            Ingat Saya
                        </span>
                    </label>
                </div>

                {/* Status & Error */}
                {status && (
                    <div className="rounded-lg bg-[#6ffbbe]/20 py-2 text-center text-[13px] font-medium text-[#006c49]">
                        {status}
                    </div>
                )}

                {typeof errors === 'string' && (
                    <p className="text-center text-[13px] font-medium text-[#ba1a1a]">
                        {errors}
                    </p>
                )}

                {/* Submit */}
                <Button
                    type="submit"
                    className="h-auto w-full rounded-lg bg-[#4648d4] py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-[#4648d4]/20 transition-all hover:bg-[#6063ee] active:scale-[0.98]"
                    disabled={processing}
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <LogIn className="size-4" />
                    )}
                    {processing
                        ? 'Memproses...'
                        : 'Masuk ke Dashboard'}
                </Button>

                {/* Divider */}
                <div className="relative flex items-center">
                    <div className="flex-grow border-t border-[#d7d4e7]" />
                    <span className="mx-3 shrink-0 text-[11px] font-medium tracking-widest text-[#767586] uppercase">
                        Atau
                    </span>
                    <div className="flex-grow border-t border-[#d7d4e7]" />
                </div>

                {/* Google Login */}
                <a
                    href="/auth/google/redirect"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d7d4e7] py-2.5 text-[13px] font-semibold text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
                >
                    <svg
                        height="18"
                        viewBox="0 0 24 24"
                        width="18"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Masuk dengan Google
                </a>

                {canRegister && (
                    <div className="text-sm text-[#464554]">
                        Belum punya akun?{' '}
                        <Link
                            href="/register"
                            className="ml-1 text-[13px] font-bold text-[#4648d4] hover:underline"
                        >
                            Daftar gratis sekarang
                        </Link>
                    </div>
                )}
            </form>
        </>
    );
}

Login.layout = {
    title: 'Selamat Datang Kembali',
    description: 'Masuk untuk mengelola bisnis atau berbelanja di marketplace.',
};
