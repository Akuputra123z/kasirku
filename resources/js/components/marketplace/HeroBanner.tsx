'use client';

import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function HeroBanner() {
    return (
        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1] shadow-xl group">
            <img
                alt="Promotional Banner"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI3UMv0zVZq6TwK-3VNjm47c5TeNZOf0V4YU8VcaPrQn33A6yNwN34PwjQ8kmsIYKSV1QIQUwLEk5dPMMxV7GD4Is_eQ6ejZZ34dJyeET_koaCnfMpPDDhpO9Q5J-6V09GqmKp8mjjatnlLRnauUextsM8nH4F4UB2Bsw5D7Z7sU-Gb9gm977aOnBGcjxZmGhfa9F-v9af6JsC969o04Pr8zwQxt880XoskQlMZeecRT-6_9cMpMEXDK0iqIiENPrNqEfkO-RalFld"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/60 to-transparent flex flex-col justify-center p-8 md:p-16">
                <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full w-max mb-4">
                    PROMO SPESIAL
                </span>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
                    Produk UMKM Lokal<br />
                    <span className="text-emerald-300">Kualitas Dunia</span>
                </h1>
                <p className="text-emerald-50 mb-6 max-w-md">
                    Dapatkan diskon hingga 75% untuk produk kesehatan dan kecantikan pilihan hari ini.
                </p>
                <Link href="/all-products" className="bg-white text-emerald-900 px-8 py-3 rounded-xl font-bold w-max hover:bg-emerald-50 transition-all flex items-center">
                    Lihat Promo Lainnya <ArrowRight className="ml-2 size-5" />
                </Link>
            </div>
        </div>
    );
}
