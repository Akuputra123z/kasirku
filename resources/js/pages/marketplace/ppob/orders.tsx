'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DashboardSidebar from '@/components/marketplace/DashboardSidebar';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const digiflazzLabels: Record<string, { label: string; className: string }> = {
    success: { label: 'Sukses', className: 'bg-emerald-50 text-emerald-600' },
    pending: { label: 'Diproses', className: 'bg-yellow-50 text-yellow-600' },
    failed: { label: 'Gagal', className: 'bg-red-50 text-red-500' },
    error: { label: 'Error', className: 'bg-red-50 text-red-500' },
};

export default function PpobOrders({ orders }: { orders: any }) {
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
            <Head title="Riwayat PPOB" />
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
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Link href="/ppob" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <ChevronLeft className="size-5 text-slate-600" />
                                </Link>
                                <h1 className="text-xl font-bold text-[#1e3a8a]">Riwayat PPOB</h1>
                            </div>
                            <Link href="/ppob" className="text-xs text-emerald-600 font-semibold hover:underline">
                                Beli Baru
                            </Link>
                        </div>

                        {orders.data.length === 0 ? (
                            <div className="text-center py-16">
                                <Package className="size-12 mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500">Belum ada transaksi PPOB</p>
                                <Link
                                    href="/ppob"
                                    className="mt-4 inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                                >
                                    Beli Pulsa / Token
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.data.map((order: any) => (
                                    <Link
                                        key={order.id}
                                        href={`/customer/orders/${order.id}`}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow block"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{order.order_number}</p>
                                                <h3 className="font-semibold text-sm text-[#1e3a8a]">{order.ppob_product}</h3>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {order.ppob_category} &middot; {order.customer_phone}
                                                    {order.customer_name && <> &middot; {order.customer_name.trim()}</>}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-emerald-600">{formatPrice(order.total)}</p>
                                                <div className="mt-1 flex flex-col items-end gap-1">
                                                    <Badge className={order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'}>
                                                        {order.payment_status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                                                    </Badge>
                                                    {order.digiflazz_status && (
                                                        <Badge className={digiflazzLabels[order.digiflazz_status]?.className || 'bg-gray-50 text-gray-600'}>
                                                            {digiflazzLabels[order.digiflazz_status]?.label || order.digiflazz_status}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {order.digiflazz_sn && (
                                            <div className="bg-emerald-50 rounded-xl px-4 py-2 text-xs text-emerald-700 font-mono">
                                                SN: {order.digiflazz_sn}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-2">{order.created_at}</p>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {orders.links && orders.links.length > 3 && (
                            <div className="flex justify-center mt-8 gap-2">
                                {orders.links.map((link: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-[#1e3a8a] text-white'
                                                : 'bg-white text-slate-600 border border-gray-200 hover:border-emerald-300'
                                        } ${!link.url ? 'opacity-50 pointer-events-none' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
