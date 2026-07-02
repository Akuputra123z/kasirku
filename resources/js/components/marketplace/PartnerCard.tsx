'use client';

import { Link } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';

export default function PartnerCard() {
    return (
        <div className="bg-gradient-to-br from-emerald-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10">
            <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                    <BadgeCheck className="size-6" />
                </div>
                <span className="text-[10px] bg-yellow-400 text-slate-900 px-2 py-0.5 rounded font-bold">
                    TERPERCAYA
                </span>
            </div>
            <h4 className="font-bold text-lg mb-1 leading-tight">Partner Strategis UMKM</h4>
            <p className="text-xs text-white/80 mb-4">
                Dukung produk lokal untuk ekonomi Indonesia yang lebih kuat.
            </p>
            <Link href="/stores" className="inline-block text-xs font-bold bg-white text-emerald-900 px-4 py-2 rounded-lg hover:bg-white/90 transition-colors">
                Jelajahi Toko
            </Link>
        </div>
    );
}
