'use client';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, User, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerRegisterSchema, type CustomerRegister } from '@/lib/schemas';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function MarketplaceRegister({ redirect }: { redirect?: string }) {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CustomerRegister>({
        resolver: zodResolver(customerRegisterSchema),
        defaultValues: { name: '', email: '', phone: '', password: '', password_confirmation: '', redirect: redirect || '' },
    });

    const passwordVal = watch('password');
    const passwordConf = watch('password_confirmation');
    const passwordsMatch = passwordVal && passwordConf && passwordVal === passwordConf;
    const passwordMinLen = passwordVal.length >= 8;

    function onSubmit(data: CustomerRegister) {
        router.post('/customer/register', data, {
            onError: (err) => {},
        });
    }

    return (
        <>
            <Head title="Daftar sebagai Pembeli" />

            {/* Back to role selection */}
            <Link
                href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="mb-4 flex items-center gap-1 text-[13px] font-medium text-[#464554] transition-colors hover:text-[#4648d4]"
            >
                <ArrowLeft className="size-4" />
                Ganti peran
            </Link>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="name" className="text-[13px] font-semibold text-[#191c1d]">
                        Nama Lengkap
                    </Label>
                    <Input
                        id="name"
                        {...register('name')}
                        required
                        autoFocus
                        autoComplete="name"
                        placeholder="Nama lengkap"
                        className="h-auto rounded-lg border border-[#d7d4e7] bg-white py-2 pr-3 pl-3 text-sm placeholder:text-[#767586]/60 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                    />
                    <InputError message={errors.name?.message} />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="email" className="text-[13px] font-semibold text-[#191c1d]">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        required
                        autoComplete="email"
                        placeholder="email@example.com"
                        className="h-auto rounded-lg border border-[#d7d4e7] bg-white py-2 pr-3 pl-3 text-sm placeholder:text-[#767586]/60 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                    />
                    <InputError message={errors.email?.message} />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="phone" className="text-[13px] font-semibold text-[#191c1d]">
                        Nomor Telepon{' '}
                        <span className="text-[#767586] font-normal">(opsional)</span>
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        autoComplete="tel"
                        placeholder="08xxxxxxxxxx"
                        className="h-auto rounded-lg border border-[#d7d4e7] bg-white py-2 pr-3 pl-3 text-sm placeholder:text-[#767586]/60 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                    />
                    <InputError message={errors.phone?.message} />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="password" className="text-[13px] font-semibold text-[#191c1d]">
                        Password
                    </Label>
                    <PasswordInput
                        id="password"
                        {...register('password')}
                        required
                        autoComplete="new-password"
                        placeholder="Minimal 8 karakter"
                    />
                    {passwordVal.length > 0 && (
                        <ul className="mt-1 space-y-1">
                            <li className="flex items-center gap-1.5 text-xs">
                                {passwordMinLen ? <Check className="size-3.5 text-green-600" /> : <X className="size-3.5 text-red-500" />}
                                <span className={passwordMinLen ? 'text-green-700' : 'text-[#767586]'}>Minimal 8 karakter</span>
                            </li>
                            <li className="flex items-center gap-1.5 text-xs">
                                {passwordsMatch ? <Check className="size-3.5 text-green-600" /> : <X className="size-3.5 text-red-500" />}
                                <span className={passwordsMatch ? 'text-green-700' : 'text-[#767586]'}>Password cocok</span>
                            </li>
                        </ul>
                    )}
                    <InputError message={errors.password?.message} />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="password_confirmation" className="text-[13px] font-semibold text-[#191c1d]">
                        Konfirmasi Password
                    </Label>
                    <PasswordInput
                        id="password_confirmation"
                        {...register('password_confirmation')}
                        required
                        autoComplete="new-password"
                        placeholder="Ulangi password"
                    />
                    <InputError message={errors.password_confirmation?.message} />
                </div>

                <Button
                    type="submit"
                    className="h-auto w-full rounded-lg bg-[#fea619] py-2.5 text-[13px] font-semibold text-[#684000] shadow-[0_4px_20px_rgba(254,166,25,0.2)] transition-all hover:bg-[#ffb95f] active:scale-[0.98]"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Spinner /> : <User className="size-4" />}
                    {isSubmitting ? 'Memproses...' : 'Daftar'}
                </Button>

                {errors.root && (
                    <p className="text-center text-[13px] font-medium text-[#ba1a1a]">{errors.root.message}</p>
                )}

                <p className="text-center text-[13px] text-[#464554]">
                    Sudah punya akun?{' '}
                    <Link href={`/customer/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-bold text-[#4648d4] hover:underline">
                        Masuk
                    </Link>
                </p>
            </form>
        </>
    );
}

MarketplaceRegister.layout = {
    title: 'Daftar sebagai Pembeli',
    description: 'Buat akun untuk mulai berbelanja produk UMKM.',
};
