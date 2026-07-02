'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { Smartphone } from 'lucide-react';
import DashboardSidebar from '@/components/marketplace/DashboardSidebar';

const categoryIcons: Record<string, string> = {
    Pulsa: '📱',
    Data: '📶',
    PLN: '⚡',
    BPJS: '❤️',
    PDAM: '💧',
    Telkom: '📞',
    'E-Money': '💳',
    Game: '🎮',
    Voucher: '🎟️',
};

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function PpobIndex({ categories }: { categories: { name: string; slug: string; total: number }[] }) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    function handleSidebarNavigate(key: string) {
        if (key === 'ppob') return;
        if (key === 'transaksi') router.get('/customer/orders');
        else if (key === 'pengaturan') router.get('/customer/settings');
        else if (key === 'chat') router.get('/customer/conversations');
        else if (key === 'beranda') router.get('/customer/dashboard');
        else router.get(`/customer/dashboard?section=${key}`);
    }

    return (
        <>
            <Head title="PPOB - Pulsa & Tagihan" />
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <DashboardSidebar
                        user={user}
                        memberLevel="Silver"
                        pointsToNextLevel={0}
                        activeSection="ppob"
                        onNavigate={handleSidebarNavigate}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">PPOB & Digital Products</h1>
                            <p className="text-slate-500">Pulsa, Paket Data, Token Listrik, dan Pembayaran Tagihan</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href={`/ppob/${cat.slug}`}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-200 group text-center"
                                >
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                                        {categoryIcons[cat.name] || '🛍️'}
                                    </div>
                                    <h3 className="font-bold text-sm text-[#1e3a8a] mb-1">{cat.name}</h3>
                                    <p className="text-xs text-slate-400">{cat.total} produk</p>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-10 text-center">
                            <Link
                                href="/ppob/orders/history"
                                className="inline-flex items-center gap-2 text-sm text-emerald-600 font-semibold hover:text-emerald-700"
                            >
                                Lihat Riwayat Transaksi PPOB →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
