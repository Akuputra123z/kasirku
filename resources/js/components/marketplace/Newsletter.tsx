'use client';

import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function Newsletter() {
    const [email, setEmail] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (email.trim()) {
            // Jangan membuat akun otomatis lewat endpoint registrasi dengan
            // password kosong — arahkan ke halaman pendaftaran yang benar.
            router.visit(`/customer/register?email=${encodeURIComponent(email.trim())}`);
        }
    }

    return (
        <section className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Dapatkan Promo Menarik!</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Daftarkan email Anda untuk info diskon eksklusif dan update produk terbaru dari partner UMKM kami.
                </p>
            </div>
            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2">
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-5 py-3 rounded-xl border-none ring-1 ring-gray-200 dark:ring-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Masukkan alamat email"
                    type="email"
                    required
                />
                <button type="submit" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                    Berlangganan
                </button>
            </form>
        </section>
    );
}
