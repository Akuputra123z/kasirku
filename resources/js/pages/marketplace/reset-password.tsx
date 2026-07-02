'use client';

import { Head, Link, router } from '@inertiajs/react';
import { Store, Lock } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MarketplaceResetPassword({ token, email }: { token: string; email: string }) {
    const [form, setForm] = useState({ password: '', password_confirmation: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/customer/reset-password', { ...form, token, email }, {
            preserveScroll: true,
            onSuccess: () => setDone(true),
            onError: (err) => {
                const mapped: Record<string, string> = {};
                for (const [key, msgs] of Object.entries(err)) {
                    mapped[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
                }
                setErrors(mapped);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    }

    if (done) {
        return (
            <>
                <Head title="Password Berhasil Diubah - Kasirku Marketplace" />
                <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f0f0ff] via-white to-[#fff8ee] px-4">
                    <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg text-center">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
                            <Lock className="size-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Password Berhasil Diubah</h1>
                        <p className="mt-2 text-sm text-gray-500">Silakan masuk dengan password baru Anda.</p>
                        <Link href="/customer/login" className="mt-6 inline-block rounded-xl bg-[#4648d4] px-6 py-3 text-sm font-bold text-white hover:bg-[#3b3db8]">
                            Masuk Sekarang
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Reset Password - Kasirku Marketplace" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f0f0ff] via-white to-[#fff8ee] px-4">
                <Link href="/" className="mb-8 flex items-center gap-2">
                    <Store className="text-[#4648d4]" size={32} fill="currentColor" />
                    <span className="text-2xl font-bold text-[#4648d4]">Kasirku UMKM</span>
                </Link>

                <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                    <p className="mt-1 text-sm text-gray-500">Masukkan password baru Anda.</p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} disabled className="bg-gray-50" />
                        </div>
                        <div>
                            <Label htmlFor="password">Password Baru</Label>
                            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Minimal 8 karakter" />
                            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                        </div>
                        <div>
                            <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                            <Input id="password_confirmation" type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required placeholder="Ulangi password" />
                            {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>}
                        </div>

                        <Button type="submit" disabled={processing} className="w-full bg-[#4648d4] hover:bg-[#3b3db8]">
                            {processing ? 'Memproses...' : 'Reset Password'}
                        </Button>

                        {errors.form && <p className="text-center text-sm text-red-500">{errors.form}</p>}
                        {errors.email && <p className="text-center text-sm text-red-500">{errors.email}</p>}

                        <p className="text-center text-sm text-gray-500">
                            <Link href="/customer/login" className="text-[#4648d4] hover:underline">Kembali ke login</Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
