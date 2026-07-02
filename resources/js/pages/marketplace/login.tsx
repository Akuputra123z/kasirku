'use client';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerLoginSchema, type CustomerLogin } from '@/lib/schemas';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function MarketplaceLogin({ status, redirect }: { status?: string; redirect?: string }) {
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<CustomerLogin>({
        resolver: zodResolver(customerLoginSchema),
        defaultValues: { email: '', password: '', redirect: redirect || '' },
    });

    function onSubmit(data: CustomerLogin) {
        router.post('/customer/login', data, {
            onError: (err) => {
                for (const [key, msgs] of Object.entries(err)) {
                    setError(key as keyof CustomerLogin, { message: Array.isArray(msgs) ? msgs[0] : String(msgs) });
                }
            },
        });
    }

    return (
        <>
            <Head title="Masuk sebagai Pembeli" />

            {/* Back to role selection */}
            <Link
                href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="mb-4 flex items-center gap-1 text-[13px] font-medium text-[#464554] transition-colors hover:text-[#4648d4]"
            >
                <ArrowLeft className="size-4" />
                Ganti peran
            </Link>

            {status && (
                <div className="mb-4 rounded-lg bg-[#6ffbbe]/20 px-4 py-3 text-[13px] font-medium text-[#006c49]">
                    {status}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="email" className="text-[13px] font-semibold text-[#191c1d]">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        required
                        autoFocus
                        autoComplete="email"
                        placeholder="nama@email.com"
                        className="h-auto rounded-lg border border-[#d7d4e7] bg-white py-2 pr-3 pl-3 text-sm placeholder:text-[#767586]/60 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                    />
                    <InputError message={errors.email?.message} />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[13px] font-semibold text-[#191c1d]">
                            Password
                        </Label>
                        <Link href="/customer/forgot-password" className="text-[11px] font-medium text-[#4648d4] hover:underline">
                            Lupa password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
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
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password?.message} />
                </div>

                <Button
                    type="submit"
                    className="h-auto w-full rounded-lg bg-[#4648d4] py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-[#4648d4]/20 transition-all hover:bg-[#6063ee] active:scale-[0.98]"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Spinner /> : <LogIn className="size-4" />}
                    {isSubmitting ? 'Memproses...' : 'Masuk'}
                </Button>

                {errors.root && (
                    <p className="text-center text-[13px] font-medium text-[#ba1a1a]">{errors.root.message}</p>
                )}

                <p className="text-center text-[13px] text-[#464554]">
                    Belum punya akun?{' '}
                    <Link href={`/customer/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-bold text-[#4648d4] hover:underline">
                        Daftar
                    </Link>
                </p>
            </form>
        </>
    );
}

MarketplaceLogin.layout = {
    title: 'Masuk sebagai Pembeli',
    description: 'Masuk ke akun marketplace Anda untuk berbelanja.',
};
