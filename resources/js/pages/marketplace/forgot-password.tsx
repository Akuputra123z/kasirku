'use client';

import { Head, Link, router } from '@inertiajs/react';
import { Store, Mail, ArrowLeft } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MarketplaceForgotPassword({ status }: { status?: string }) {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [sent, setSent] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/customer/forgot-password', { email }, {
            preserveScroll: true,
            onSuccess: () => setSent(true),
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

    return (
        <>
            <Head title="Lupa Password - Kasirku Marketplace" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f0f0ff] via-white to-[#fff8ee] px-4">
                <Link href="/" className="mb-8 flex items-center gap-2">
                    <Store className="text-[#4648d4]" size={32} fill="currentColor" />
                    <span className="text-2xl font-bold text-[#4648d4]">Kasirku UMKM</span>
                </Link>

                <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg">
                    {sent ? (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900">Cek Email Anda</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Jika email terdaftar, kami telah mengirimkan tautan reset password ke <strong>{email}</strong>.
                            </p>
                            <Link href="/customer/login" className="mt-6 inline-flex items-center gap-1 text-sm text-[#4648d4] hover:underline">
                                <ArrowLeft className="size-4" /> Kembali ke login
                            </Link>
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900">Lupa Password</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset password.
                            </p>

                            {status && (
                                <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{status}</div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" />
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                </div>

                                <Button type="submit" disabled={processing} className="w-full bg-[#4648d4] hover:bg-[#3b3db8]">
                                    {processing ? 'Mengirim...' : 'Kirim Tautan Reset'}
                                </Button>

                                {errors.form && <p className="text-center text-sm text-red-500">{errors.form}</p>}

                                <p className="text-center text-sm text-gray-500">
                                    <Link href="/customer/login" className="text-[#4648d4] hover:underline">Kembali ke login</Link>
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
