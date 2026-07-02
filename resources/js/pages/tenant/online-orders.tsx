'use client';

import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Package, ShoppingBag, Zap, ChevronRight, X, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

const statusConfig: Record<string, { label: string; variant: 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'default' }> = {
    pending: { label: 'Menunggu', variant: 'yellow' },
    confirmed: { label: 'Dikonfirmasi', variant: 'blue' },
    shipped: { label: 'Dikirim', variant: 'purple' },
    completed: { label: 'Selesai', variant: 'green' },
    cancelled: { label: 'Dibatalkan', variant: 'red' },
};

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || { label: status, variant: 'default' as const };
    const colors: Record<string, string> = {
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        default: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colors[config.variant]}`}>
            {config.label}
        </span>
    );
}

function PaymentBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        unpaid: { label: 'Belum Bayar', className: 'bg-yellow-50 text-yellow-700' },
        paid: { label: 'Lunas', className: 'bg-emerald-50 text-emerald-700' },
        pending: { label: 'Menunggu', className: 'bg-blue-50 text-blue-700' },
        failed: { label: 'Gagal', className: 'bg-red-50 text-red-700' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-50 text-gray-700' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${c.className}`}>
            {c.label}
        </span>
    );
}

interface OrderItem {
    product_name: string;
    variant_name: string | null;
    quantity: number;
    price: number;
    subtotal: number;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    total: number;
    payment_status: string;
    subtotal: number;
    shipping_cost: number;
    shipping_courier: string | null;
    shipping_service: string | null;
    shipping_address: string | null;
    tracking_number: string | null;
    item_count: number;
    customer_name: string;
    customer_email: string;
    recipient_name: string;
    recipient_phone: string;
    type: string | null;
    created_at: string;
    items: OrderItem[];
}

export default function OnlineOrders({
    orders,
    filters,
    summary,
}: {
    orders: any;
    filters: { status: string | null; search: string | null };
    summary: { total: number; pending: number; confirmed: number; shipped: number; completed: number; cancelled: number };
}) {
    const [searchInput, setSearchInput] = useState(filters?.search || '');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showTrackingForm, setShowTrackingForm] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingCourier, setShippingCourier] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const activeStatus = filters?.status || '';

    function applyFilters(status: string, search: string) {
        router.get('/online-orders', {
            status: status || undefined,
            search: search || undefined,
        }, { preserveState: true });
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        applyFilters(activeStatus, searchInput);
    }

    function handleFilterChange(status: string) {
        setSearchInput(filters?.search || '');
        applyFilters(status, filters?.search || '');
    }

    function updateStatus(orderId: number, newStatus: string, extra: Record<string, any> = {}) {
        router.patch(
            `/online-orders/${orderId}`,
            { status: newStatus, ...extra },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Status pesanan diperbarui');
                    setSelectedOrder(null);
                    setShowTrackingForm(false);
                },
                onError: () => toast.error('Gagal memperbarui status'),
            },
        );
    }

    function handleShip(order: Order) {
        const extra: Record<string, any> = {};
        if (trackingNumber.trim()) extra.tracking_number = trackingNumber.trim();
        if (shippingCourier.trim()) extra.shipping_courier = shippingCourier.trim();
        if (shippingAddress.trim()) extra.shipping_address = shippingAddress.trim();
        updateStatus(order.id, 'shipped', extra);
    }

    const statusTabs = [
        { key: '', label: 'Semua', count: summary?.total ?? 0 },
        { key: 'pending', label: 'Menunggu', count: summary?.pending ?? 0 },
        { key: 'confirmed', label: 'Dikonfirmasi', count: summary?.confirmed ?? 0 },
        { key: 'shipped', label: 'Dikirim', count: summary?.shipped ?? 0 },
        { key: 'completed', label: 'Selesai', count: summary?.completed ?? 0 },
        { key: 'cancelled', label: 'Dibatalkan', count: summary?.cancelled ?? 0 },
    ];

    return (
        <>
            <Head title="Pesanan Online" />

            <div className="p-4 md:p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Pesanan Online</h1>
                    <p className="text-sm text-muted-foreground">Kelola pesanan dari marketplace</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Cari nomor pesanan atau nama pelanggan..."
                            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => { setSearchInput(''); applyFilters(activeStatus, ''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </form>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleFilterChange(tab.key)}
                            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                activeStatus === tab.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-card text-muted-foreground border border-border hover:border-primary/40'
                            }`}
                        >
                            {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                activeStatus === tab.key
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* List */}
                {orders.data?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Package className="mb-4 size-16 text-muted-foreground/30" />
                        <p className="text-lg font-medium text-muted-foreground">
                            {filters.search || filters.status ? 'Pesanan tidak ditemukan' : 'Belum ada pesanan'}
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            {(filters.search || filters.status)
                                ? 'Coba ubah kata kunci atau filter'
                                : 'Pesanan dari marketplace akan muncul di sini'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {orders.data?.map((order: Order) => {
                            const firstItem = order.items[0];
                            return (
                                <Card
                                    key={order.id}
                                    className="cursor-pointer transition-all hover:shadow-md border-border/80 hover:border-primary/30"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                                                        {order.order_number}
                                                    </span>
                                                    {order.type === 'ppob' && (
                                                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                            <Zap className="size-2.5" /> PPOB
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {order.customer_name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {order.recipient_name}
                                                    {order.recipient_phone && <> &middot; {order.recipient_phone}</>}
                                                </p>
                                            </div>
                                            <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                                                {StatusBadge({ status: order.status })}
                                                {PaymentBadge({ status: order.payment_status })}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <ShoppingBag className="size-4 text-muted-foreground/60 shrink-0" />
                                                <p className="text-[12px] text-muted-foreground truncate">
                                                    {firstItem?.product_name}
                                                    {order.item_count > 1 && (
                                                        <> <span className="text-muted-foreground/50">+{order.item_count - 1} lainnya</span></>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                <div className="sm:hidden flex flex-col items-end gap-1">
                                                    {StatusBadge({ status: order.status })}
                                                </div>
                                                <p className="text-sm font-bold tabular-nums">{formatPrice(order.total)}</p>
                                                <ChevronRight className="size-4 text-muted-foreground/30" />
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-[10px] text-muted-foreground/60">{order.created_at}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {orders.links?.map((link: any, i: number) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className="min-w-[36px]"
                            >
                                {link.label.includes('Previous') ? (
                                    <span className="text-xs">&larr;</span>
                                ) : link.label.includes('Next') ? (
                                    <span className="text-xs">&rarr;</span>
                                ) : (
                                    link.label
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Detail Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setShowTrackingForm(false); }}>
                <DialogContent aria-describedby={undefined} className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Pesanan
                            <span className="text-sm font-mono font-normal text-muted-foreground">#{selectedOrder?.order_number}</span>
                            {selectedOrder?.type === 'ppob' && (
                                <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Zap className="size-2.5" /> PPOB
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-5">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                {StatusBadge({ status: selectedOrder.status })}
                                {PaymentBadge({ status: selectedOrder.payment_status })}
                            </div>

                            {/* Customer & Recipient Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-muted/30 p-4 text-sm">
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pelanggan</p>
                                    <p className="font-semibold">{selectedOrder.customer_name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{selectedOrder.customer_email}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Penerima</p>
                                    <p className="font-semibold">{selectedOrder.recipient_name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{selectedOrder.recipient_phone}</p>
                                </div>
                            </div>

                            <Separator />

                            {/* Order Items */}
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                    Item Pesanan ({selectedOrder.items.length})
                                </p>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item: OrderItem, i: number) => (
                                        <div key={i} className="flex justify-between items-start p-3 rounded-xl bg-card border border-border/60">
                                            <div className="min-w-0 flex-1 pr-3">
                                                <p className="text-sm font-semibold">{item.product_name}</p>
                                                {item.variant_name && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">Varian: {item.variant_name}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-0.5">{item.quantity}x {formatPrice(item.price)}</p>
                                            </div>
                                            <p className="text-sm font-bold shrink-0 tabular-nums">{formatPrice(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Total Summary */}
                            {selectedOrder.type !== 'ppob' && selectedOrder.shipping_cost > 0 && (
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(selectedOrder.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Ongkos Kirim</span>
                                        <span>{formatPrice(selectedOrder.shipping_cost)}</span>
                                    </div>
                                    <Separator />
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(selectedOrder.total)}</span>
                            </div>

                            {/* Tracking Info */}
                            {['shipped', 'completed'].includes(selectedOrder.status) && (selectedOrder.tracking_number || selectedOrder.shipping_courier) && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Truck className="size-3.5" /> Informasi Pengiriman
                                        </p>
                                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-2 text-sm">
                                            {selectedOrder.shipping_courier && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-600/70">Kurir</span>
                                                    <span className="font-semibold text-blue-800">{selectedOrder.shipping_courier}</span>
                                                </div>
                                            )}
                                            {selectedOrder.tracking_number && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-600/70">No. Resi</span>
                                                    <span className="font-mono font-semibold text-blue-800">{selectedOrder.tracking_number}</span>
                                                </div>
                                            )}
                                            {selectedOrder.shipping_address && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-600/70">Alamat</span>
                                                    <span className="text-right font-medium text-blue-800 max-w-[200px] text-xs">{selectedOrder.shipping_address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* Update Status */}
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Update Status</p>

                                {showTrackingForm ? (
                                    <div className="space-y-3 mb-4 p-4 rounded-xl bg-muted/40 border border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">Informasi Pengiriman</p>
                                        <input
                                            type="text"
                                            value={shippingCourier}
                                            onChange={(e) => setShippingCourier(e.target.value)}
                                            placeholder="Nama Kurir (JNE, SiCepat, dll)"
                                            className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                                        />
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="No. Resi"
                                            className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                                        />
                                        <textarea
                                            value={shippingAddress}
                                            onChange={(e) => setShippingAddress(e.target.value)}
                                            placeholder="Alamat Pengiriman"
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
                                        />
                                        <div className="flex gap-2 pt-1">
                                            <Button size="sm" variant="outline" onClick={() => { setShowTrackingForm(false); setTrackingNumber(''); setShippingCourier(''); setShippingAddress(''); }}>
                                                Batal
                                            </Button>
                                            <Button size="sm" onClick={() => handleShip(selectedOrder)}>
                                                Simpan & Kirim
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { key: 'confirmed', label: 'Konfirmasi', disabledFrom: ['confirmed', 'shipped', 'completed', 'cancelled'] },
                                            { key: 'shipped', label: 'Kirim', disabledFrom: ['shipped', 'completed', 'cancelled'] },
                                            { key: 'completed', label: 'Selesai', disabledFrom: ['completed', 'cancelled'] },
                                            { key: 'cancelled', label: 'Batalkan', disabledFrom: ['cancelled'] },
                                        ].map((s) => (
                                            <Button
                                                key={s.key}
                                                size="sm"
                                                variant={selectedOrder.status === s.key ? 'default' : 'outline'}
                                                disabled={selectedOrder.status === s.key || s.disabledFrom.includes(selectedOrder.status)}
                                                onClick={() => {
                                                    if (s.key === 'shipped') {
                                                        setTrackingNumber(selectedOrder.tracking_number || '');
                                                        setShippingCourier(selectedOrder.shipping_courier || '');
                                                        setShippingAddress(selectedOrder.shipping_address || '');
                                                        setShowTrackingForm(true);
                                                    } else {
                                                        updateStatus(selectedOrder.id, s.key);
                                                    }
                                                }}
                                            >
                                                {s.label}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}