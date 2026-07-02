'use client';

import { Link } from '@inertiajs/react';
import { Smartphone, Zap, Wifi, ArrowRight } from 'lucide-react';

const items = [
    { icon: Smartphone, label: 'Pulsa', slug: 'pulsa', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { icon: Wifi, label: 'Paket Data', slug: 'data', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Zap, label: 'Token PLN', slug: 'pln', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
];

export default function TopUpCard() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">Top Up & Tagihan</h3>
                <Link href="/ppob" className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
                    Lihat Semua <ArrowRight className="size-3" />
                </Link>
            </div>
            <div className="space-y-3">
                {items.map((item) => (
                    <Link
                        key={item.slug}
                        href={`/ppob/${item.slug}`}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                            <item.icon className="size-5" />
                        </div>
                        <span className="flex-1 font-semibold text-sm group-hover:text-emerald-600 transition-colors">{item.label}</span>
                        <ArrowRight className="size-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </Link>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <Link
                    href="/ppob/orders/history"
                    className="block w-full text-center text-xs text-slate-400 hover:text-emerald-600 font-semibold transition-colors"
                >
                    Lihat Riwayat Transaksi
                </Link>
            </div>
        </div>
    );
}
