'use client';

import { Link } from '@inertiajs/react';
import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FlashItem {
    image: string;
    price: number;
    originalPrice: number;
    soldPercent: number;
}

const flashItems: FlashItem[] = [
    { image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5_HzX6jytmLLm_QrrDu1AiUQYq7aVjhxwHYWMrsumpgR9RRA9NkGCyVIGV8rk4ZAguoWYbj8saWPD2eTBTMsKBgozerOXqJSDUKj6G5pBBjCQFrFzZNNXs_0a7ma167aQgwZXT1LLqidfUPYezVUYlBef54SW-CST5g-k0vPra1Wu_4VvNUlLRoFuKFCV_Vge3iFVOps5eL9g5lhkrGLQ96MnpIxoOt9EfJrSOj8GLRtAjBxBHCsmDgKrhYGKN2ry0YxdyWK620vI', price: 45000, originalPrice: 120000, soldPercent: 85 },
    { image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUUlcAPXGYplJY_z5XQHd0MhjMCJslSSYo0GiF7Gh2IkNXYKmJIUec_IxAQtvZyGh4gTP-HBKGlGcPN89lUgnj5u30Ngg4nXT3a10DIh98Ajqf4OaT8EL7BKilceyfbKS-ye-mo4GahpL5jQ1BBEFH_oi0XG-fXBYrDvW3AV-gP-UUwHj5_DsTBAUd5h8MjCFI8EBYdpRsGaNDima68pZ8rM7Q2aeRtBwEy0Cu8cV4KFnTS6yMw_pg5rNOfmDks06AD0sAZ_X6K-11', price: 199000, originalPrice: 450000, soldPercent: 40 },
    { image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBP8yhkvPrWYSzFfjm7AanYV8vMDcwxZntYbcYbdjPtQLL8mbpskvuxstskgrX9l-nCXBvjdlgM9jZIKL6jPtdsJNhjJpplfCg5t_EvB_DdCPL-JBcf47ycqKwzEfQhRWaJxR6hIJD1i59dMiVvh0PYasS98Gac2QSqYWxSi_pgwjkScWybU9E98mDSUJkiaYowjOaZhv3nAnBXXnm5s4dEQF8VwwiCpCYuGdcxfMv1AFk-uw-qQwB1htVWLgZETiQtxGd5ua9BCQIe', price: 250000, originalPrice: 750000, soldPercent: 60 },
    { image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBU8gi6nXEfT7lK-ojQQ0qJsS9kngJDcP7-Cdr3K1cnrUuCeAgBOQPPsCslKeibwepIHLO9L__JNty62zGbZwGGkV2vdWWYFBLqeNUQyi-0aSWf2qko3k07uMf75plOXeJlI9X9-Xoeee_DLcrLRAmJJ_Trl7ktURm0oJD_byMYA7rLllmO6CwFbvyRZREnl2XbbWAe1kP8_JzgbqWLKkZNE-OiJb3d8a9LdSY8RxYlz5pemgbSpIhbdtAXQA7lFVdZh7KzOAVucZra', price: 125000, originalPrice: 300000, soldPercent: 95 },
];

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

function Timer() {
    const [time, setTime] = useState({ h: 2, m: 45, s: 12 });

    useEffect(() => {
        const interval = setInterval(() => {
            setTime((prev) => {
                if (prev.s > 0) return { ...prev, s: prev.s - 1 };
                if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
                if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex gap-1.5">
            <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-sm font-bold">
                {String(time.h).padStart(2, '0')}
            </span>
            <span>:</span>
            <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-sm font-bold">
                {String(time.m).padStart(2, '0')}
            </span>
            <span>:</span>
            <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-sm font-bold">
                {String(time.s).padStart(2, '0')}
            </span>
        </div>
    );
}

export default function FlashSale() {
    return (
        <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="size-[120px]" />
            </div>
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Flash Sale</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium opacity-90">Berakhir dalam:</span>
                        <Timer />
                    </div>
                </div>
                <Link className="text-sm font-bold hover:underline" href="/stores">Lihat Semua</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {flashItems.map((item, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-xl p-3 text-slate-900 dark:text-white ${i >= 2 ? 'hidden md:block' : ''}`}>
                        <img alt={`Flash Sale ${i + 1}`} className="w-full aspect-square object-cover rounded-lg mb-2" src={item.image} />
                        <div className="text-xs font-bold text-rose-500">{formatPrice(item.price)}</div>
                        <div className="text-[10px] text-slate-400 line-through">{formatPrice(item.originalPrice)}</div>
                        <div className="mt-2 w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full" style={{ width: `${item.soldPercent}%` }} />
                        </div>
                        <div className="text-[9px] mt-1 text-slate-500 font-medium italic text-right">
                            {item.soldPercent >= 90 ? 'Hampir Habis' : `${item.soldPercent}% Terjual`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
