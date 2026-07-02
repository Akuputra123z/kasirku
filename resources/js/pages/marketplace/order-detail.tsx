import { useEffect, useState, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Store, ChevronLeft, MapPin, Phone, CreditCard, Loader2, QrCode, Copy, Check, RefreshCw, Banknote, Clock, ShieldCheck, HelpCircle, ChevronDown, ShoppingBag, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

function statusBadge(status: string) {
    const variants: Record<string, string> = {
        pending: 'bg-[#FBBF24]/10 text-[#FBBF24]',
        confirmed: 'bg-blue-50 text-blue-600',
        shipped: 'bg-purple-50 text-purple-600',
        completed: 'bg-emerald-50 text-emerald-600',
        cancelled: 'bg-red-50 text-red-500',
    };
    const labels: Record<string, string> = {
        pending: 'Menunggu', confirmed: 'Dikonfirmasi', shipped: 'Dikirim', completed: 'Selesai', cancelled: 'Dibatalkan',
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-600'}>{labels[status] || status}</Badge>;
}

function paymentBadge(status: string) {
    const variants: Record<string, string> = {
        unpaid: 'bg-[#FBBF24]/10 text-[#FBBF24]',
        paid: 'bg-emerald-50 text-emerald-600',
        pending: 'bg-blue-50 text-blue-600',
        failed: 'bg-red-50 text-red-500',
    };
    const labels: Record<string, string> = {
        unpaid: 'Belum Bayar', paid: 'Lunas', pending: 'Menunggu', failed: 'Gagal',
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-600'}>{labels[status] || status}</Badge>;
}

const bankLabels: Record<string, string> = {
    bca: 'BCA', bni: 'BNI', bri: 'BRI', mandiri: 'Mandiri',
};

function PaymentCountdown({ timestamp }: { timestamp?: number }) {
    const [h, setH] = useState(0); const [m, setM] = useState(0); const [s, setS] = useState(0);
    useEffect(() => {
        function tick() {
            const created = timestamp || Date.now() / 1000;
            const deadline = (created + 86400) * 1000;
            const diff = Math.max(0, deadline - Date.now());
            setH(Math.floor(diff / 3600000));
            setM(Math.floor((diff % 3600000) / 60000));
            setS(Math.floor((diff % 60000) / 1000));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [timestamp]);
    return (
        <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-[#92400e] font-semibold">
                <Clock className="size-5" />
                <p>Selesaikan pembayaran sebelum:</p>
            </div>
            <div className="flex gap-2">
                {[{ v: h, l: 'Jam' }, { v: m, l: 'Menit' }, { v: s, l: 'Detik' }].map((x, i) => (
                    <div key={x.l} className="flex items-center">
                        {i > 0 && <span className="text-[#FBBF24] font-bold text-xl mx-1 mb-4">:</span>}
                        <div className="flex flex-col items-center">
                            <div className="bg-white shadow-sm px-3 py-1 rounded-md text-[#FBBF24] font-bold text-lg min-w-[40px] text-center">{String(x.v).padStart(2, '0')}</div>
                            <span className="text-[10px] uppercase font-bold text-[#92400e]">{x.l}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="divide-y divide-[#e7f3ef]">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f6f8f7] transition-colors">
                <span className="font-semibold">{title}</span>
                <ChevronDown className={`size-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed bg-[#f6f8f7]/50">{children}</div>}
        </div>
    );
}

export default function OrderDetail({ order, pendingPayment }: {
    order: any; pendingPayment?: { type: string; qr_url?: string; bank?: string; va_number?: string; transaction_id?: string } | null;
}) {
    const [copied, setCopied] = useState(false);

    const isQris = pendingPayment?.type === 'qris';
    const isVa = pendingPayment?.type === 'bank_transfer';
    const qrisQrUrl = pendingPayment?.qr_url;
    const vaNumber = pendingPayment?.va_number;
    const vaBank = pendingPayment?.bank;
    const orderCreatedTs = order.created_timestamp;

    useEffect(() => {
        if (!isQris) return;
        const interval = setInterval(() => { router.reload({ only: ['order'] }); }, 5000);
        return () => clearInterval(interval);
    }, [isQris]);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    }, []);

    return (
        <>
            <Head title={`Pesanan ${order.order_number}`} />
            <div className="min-h-screen bg-[#f6f8f7]">

                {order.payment_status === 'unpaid' && (
                    <div className="bg-[#FBBF24]/15 border-b border-[#FBBF24]/30 py-3">
                        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                            <PaymentCountdown timestamp={orderCreatedTs} />
                        </div>
                    </div>
                )}

                <main className="max-w-[1200px] mx-auto px-4 py-8">
                    {order.payment_status === 'paid' && (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-[#1e3a8a]">Pesanan #{order.order_number}</h1>
                                {statusBadge(order.status)}
                            </div>
                            {paymentBadge(order.payment_status)}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">
                            {/* Main Payment Card */}
                            {order.payment_status === 'unpaid' && !isQris && !isVa && (
                                <Card className="border-2 border-[#FBBF24]/30 bg-white shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="rounded-full bg-[#FBBF24]/10 p-2">
                                                <CreditCard className="size-6 text-[#FBBF24]" />
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="font-semibold text-[#1e3a8a]">Pembayaran Belum Selesai</h2>
                                                <p className="text-sm text-gray-500">Pilih metode pembayaran untuk menyelesaikan pesanan ini.</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-[#1e3a8a]">{formatPrice(order.total)}</p>
                                            </div>
                                        </div>
                                        <Link href={`/customer/orders/${order.id}/payment`}>
                                            <Button className="w-full bg-[#10b77f] hover:bg-[#059669] py-4 text-base font-bold">
                                                <CreditCard className="size-5 mr-2" /> Pilih Pembayaran
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}

                            {isQris && (
                                <section className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                                    <div className="p-6 border-b border-[#e7f3ef]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h1 className="text-[#1e3a8a] text-3xl font-bold">{formatPrice(order.total)}</h1>
                                                <p className="text-[#4c9a80] text-sm mt-1">Order ID: <span className="font-mono font-semibold">{order.order_number}</span></p>
                                            </div>
                                            <div className="bg-primary/10 text-[#10b77f] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <QrCode className="size-4" /> QRIS
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 text-center space-y-4">
                                        <img src={qrisQrUrl} alt="QRIS" className="mx-auto h-64 w-64 rounded-lg border bg-white" />
                                        <div className="flex items-center justify-center gap-2 rounded-lg bg-[#f6f8f7] p-3">
                                            <code className="text-xs text-gray-600 truncate max-w-[300px]">{qrisQrUrl}</code>
                                            <Button size="sm" variant="outline" className="shrink-0 gap-1 border-[#10b77f] text-[#10b77f]" onClick={() => copyToClipboard(qrisQrUrl!)}>
                                                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                                {copied ? 'Tersalin' : 'Salin URL'}
                                            </Button>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 text-left">
                                            <p className="font-medium">Testing di simulator:</p>
                                            <ol className="mt-1 list-inside list-decimal space-y-1 text-xs">
                                                <li>Klik <strong>Salin URL</strong> di atas</li>
                                                <li>Buka <a href="https://simulator.sandbox.midtrans.com/v2/qris/index" target="_blank" rel="noopener noreferrer" className="underline">QRIS Simulator</a></li>
                                                <li>Paste URL dan klik bayar</li>
                                                <li>Halaman ini auto-refresh setelah terbayar</li>
                                            </ol>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                            <Loader2 className="size-4 animate-spin" /> Menunggu pembayaran...
                                            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => router.reload()}>
                                                <RefreshCw className="size-3" /> Refresh
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {isVa && (
                                <section className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                                    <div className="p-6 border-b border-[#e7f3ef]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h1 className="text-[#1e3a8a] text-3xl font-bold">{formatPrice(order.total)}</h1>
                                                <p className="text-[#4c9a80] text-sm mt-1">Order ID: <span className="font-mono font-semibold">{order.order_number}</span></p>
                                            </div>
                                            <div className="bg-primary/10 text-[#10b77f] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Banknote className="size-4" /> VIRTUAL ACCOUNT
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-10 bg-white border border-[#e7f3ef] rounded flex items-center justify-center p-2">
                                                <span className="text-sm font-bold text-gray-700 uppercase">{vaBank}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Virtual Account {bankLabels[vaBank || ''] || vaBank}</h3>
                                                <p className="text-sm text-gray-500">Transfer tepat ke nomor Virtual Account di bawah</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#f6f8f7] p-6 rounded-xl border border-dashed border-primary/40 text-center space-y-3">
                                            <p className="text-sm font-medium text-gray-500">Nomor Virtual Account</p>
                                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                                <span className="text-2xl md:text-3xl font-bold tracking-widest text-[#1e3a8a]">{vaNumber}</span>
                                                <Button className="gap-2 bg-[#10b77f] hover:bg-[#059669]" onClick={() => copyToClipboard(vaNumber || '')}>
                                                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                                    {copied ? 'Tersalin' : 'Salin'}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                                            <Loader2 className="size-4 animate-spin" /> Menunggu pembayaran...
                                            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => router.reload()}>
                                                <RefreshCw className="size-3" /> Refresh
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* How to Pay Accordion */}
                            {isVa && (
                                <section className="space-y-4">
                                    <h3 className="font-bold text-xl px-2 flex items-center gap-2 text-[#1e3a8a]">
                                        <HelpCircle className="size-5 text-[#10b77f]" /> Tata Cara Pembayaran
                                    </h3>
                                    <div className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] divide-y divide-[#e7f3ef]">
                                        <Accordion title={`ATM ${bankLabels[vaBank || ''] || vaBank}`}>
                                            <ol className="list-decimal ml-5 space-y-2 py-2">
                                                <li>Masukkan kartu ATM dan PIN Anda</li>
                                                <li>Pilih menu <span className="font-bold">Bayar/Beli</span></li>
                                                <li>Pilih menu <span className="font-bold">Multi Payment</span></li>
                                                <li>Masukkan kode perusahaan UMKM Marketplace (8873)</li>
                                                <li>Masukkan <span className="font-bold text-[#10b77f]">Nomor Virtual Account</span></li>
                                                <li>Konfirmasi pembayaran dan simpan struk</li>
                                            </ol>
                                        </Accordion>
                                        <Accordion title={`${bankLabels[vaBank || ''] || vaBank} Mobile Banking`}>
                                            <ol className="list-decimal ml-5 space-y-2 py-2">
                                                <li>Buka aplikasi mobile banking {bankLabels[vaBank || ''] || vaBank}</li>
                                                <li>Pilih menu pembayaran / transfer</li>
                                                <li>Pilih Virtual Account</li>
                                                <li>Masukkan nomor VA</li>
                                                <li>Konfirmasi dan simpan bukti transfer</li>
                                            </ol>
                                        </Accordion>
                                        <Accordion title={`${bankLabels[vaBank || ''] || vaBank} Internet Banking`}>
                                            <ol className="list-decimal ml-5 space-y-2 py-2">
                                                <li>Login ke internet banking {bankLabels[vaBank || ''] || vaBank}</li>
                                                <li>Pilih menu Transfer</li>
                                                <li>Pilih Virtual Account</li>
                                                <li>Masukkan nomor VA</li>
                                                <li>Konfirmasi pembayaran</li>
                                            </ol>
                                        </Accordion>
                                    </div>
                                </section>
                            )}

                            {/* PPOB Info */}
                            {order.type === 'ppob' && (
                                <section className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                                    <div className="p-6 border-b border-[#e7f3ef]">
                                        <h2 className="font-bold text-lg text-[#1e3a8a]">Informasi PPOB</h2>
                                    </div>
                                    <div className="p-6 space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Kategori</span>
                                            <span className="font-semibold text-[#1e3a8a]">{order.ppob_category}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Nomor Tujuan</span>
                                            <span className="font-semibold text-[#1e3a8a]">{order.customer_phone}</span>
                                        </div>
                                        {order.ppob_customer_name && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Nama Pelanggan</span>
                                                <span className="font-semibold text-[#1e3a8a]">{order.ppob_customer_name}</span>
                                            </div>
                                        )}
                                        {order.digiflazz_sn && (
                                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-emerald-700">Kode Token / SN</span>
                                                    {order.digiflazz_status && (
                                                        <Badge className={
                                                            order.digiflazz_status === 'Sukses' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                                                        }>
                                                            {order.digiflazz_status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-lg font-bold text-emerald-800 bg-white px-3 py-2 rounded-lg border border-emerald-200 font-mono select-all">
                                                        {order.digiflazz_sn}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="shrink-0 gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                                        onClick={() => copyToClipboard(order.digiflazz_sn)}
                                                    >
                                                        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {!order.digiflazz_sn && order.payment_status === 'paid' && order.type === 'ppob' && (
                                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                                    <Loader2 className="size-4 animate-spin" />
                                                    <span>Token sedang diproses, silakan cek kembali nanti</span>
                                                </div>
                                                {order.digiflazz_message && (
                                                    <p className="mt-1 text-xs text-blue-500">{order.digiflazz_message}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Order Items (for non-unpaid) */}
                            {order.payment_status !== 'unpaid' && (
                                <section className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                                    <div className="p-6 border-b border-[#e7f3ef] flex items-center justify-between">
                                        <h2 className="font-bold text-lg text-[#1e3a8a]">Item Pesanan</h2>
                                        {statusBadge(order.status)}
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {order.items.map((item: any) => (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="size-16 rounded-lg bg-[#f6f8f7] flex-shrink-0 flex items-center justify-center border border-[#e7f3ef]">
                                                    <ShoppingBag className="size-6 text-gray-300" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{item.product_name}</p>
                                                    {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                                                    <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.price)}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-[#1e3a8a]">{formatPrice(item.subtotal)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Review */}
                            {order.status === 'completed' && (
                                <section className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                                    <div className="p-6">
                                        {order.has_review ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h2 className="font-bold text-lg text-[#1e3a8a]">Ulasan Kamu</h2>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <svg key={s} className={`size-5 ${s <= order.review.rating ? 'text-yellow-400' : 'text-gray-200'}`} viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                </div>
                                                {order.review.review && (
                                                    <p className="text-sm text-gray-600">{order.review.review}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">{order.review.created_at}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <h2 className="font-bold text-lg text-[#1e3a8a] mb-2">Beri Ulasan</h2>
                                                <p className="text-sm text-gray-500 mb-4">Bagaimana pengalaman belanjamu dengan toko ini?</p>
                                                <Link href={`/customer/orders/${order.id}/review`}>
                                                    <Button className="bg-[#10b77f] hover:bg-[#059669] font-semibold">
                                                        Tulis Ulasan
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Payments History */}
                            {order.payments?.length > 0 && (
                                <section className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                                    <div className="p-6 border-b border-[#e7f3ef]">
                                        <h2 className="font-bold text-lg text-[#1e3a8a]">Riwayat Pembayaran</h2>
                                    </div>
                                    <div className="p-6 space-y-3">
                                        {order.payments.map((p: any, i: number) => (
                                            <div key={i} className="rounded-lg border bg-[#f6f8f7] p-3 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium capitalize text-[#1e3a8a]">{p.payment_type?.replace(/_/g, ' ')}</span>
                                                    <span className="text-xs text-gray-500">{p.created_at}</span>
                                                </div>
                                                <p className="mt-1 font-semibold text-[#10b77f]">{formatPrice(p.gross_amount)}</p>
                                                {p.bank && p.va_number && (
                                                    <div className="mt-2 flex items-center gap-2 rounded bg-white px-3 py-2 text-xs">
                                                        <span className="uppercase font-bold text-gray-600">{p.bank}</span>
                                                        <code className="font-mono text-sm tracking-wider text-gray-900">{p.va_number}</code>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {order.notes && (
                                <section className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                                    <div className="p-6">
                                        <h2 className="font-bold text-lg text-[#1e3a8a] mb-2">Catatan</h2>
                                        <p className="text-sm text-gray-600">{order.notes}</p>
                                    </div>
                                </section>
                            )}

                            {/* Cancel */}
                            {order.payment_status === 'unpaid' && !isQris && !isVa && (
                                <div className="text-center">
                                    <button onClick={() => { if (confirm('Yakin ingin membatalkan pesanan ini?')) router.post(`/customer/orders/${order.id}/cancel`); }}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Batalkan Pesanan
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar */}
                        <div className="lg:col-span-4">
                            <aside className="sticky top-24 space-y-6">
                                <div className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] p-6">
                                    <h3 className="font-bold text-lg text-[#1e3a8a] mb-4">Ringkasan Pesanan</h3>
                                    <div className="space-y-4 mb-6">
                                        {order.items.slice(0, 2).map((item: any) => (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="size-16 rounded-lg bg-[#f6f8f7] flex-shrink-0 flex items-center justify-center border border-[#e7f3ef]">
                                                    <ShoppingBag className="size-6 text-gray-300" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold line-clamp-2 text-[#1e3a8a]">{item.product_name}</p>
                                                    {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                                                    <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {order.items.length > 2 && (
                                            <Link href="#items" className="text-xs text-[#10b77f] font-semibold">+{order.items.length - 2} item lainnya</Link>
                                        )}
                                    </div>
                                    <div className="border-t border-[#e7f3ef] pt-4 space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                                        {order.shipping_courier && (
                                            <div className="flex justify-between text-xs"><span className="text-gray-500">Kurir</span><span className="uppercase text-[#10b77f]">{order.shipping_courier} {order.shipping_service}</span></div>
                                        )}
                                        <div className="flex justify-between text-sm"><span className="text-gray-500">Ongkos Kirim</span><span>{formatPrice(order.shipping_cost)}</span></div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#e7f3ef] mt-2">
                                            <span>Total</span>
                                            <span className="text-[#1e3a8a]">{formatPrice(order.total)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 space-y-3">
                                        <Button onClick={() => router.reload()} className="w-full bg-[#10b77f] hover:bg-[#059669] font-bold py-3 shadow-lg">
                                            <RefreshCw className="size-4 mr-2" /> Cek Status Pembayaran
                                        </Button>
                                        {order.payment_status === 'unpaid' && (
                                            <Link href={`/customer/orders/${order.id}/payment`}>
                                                <Button variant="outline" className="w-full border-gray-200 text-gray-700 font-semibold py-3">
                                                    Ubah Metode Pembayaran
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Store Info */}
                                <div className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-10 rounded-lg bg-[#f6f8f7] flex items-center justify-center">
                                            <Store className="size-5 text-[#10b77f]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1e3a8a]">{order.store.name}</p>
                                            {order.store.phone && <p className="text-xs text-gray-500">{order.store.phone}</p>}
                                            <Link
                                                href={`/customer/conversations/start/${order.store.slug}`}
                                                method="post"
                                                as="button"
                                                className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:text-emerald-700"
                                            >
                                                <MessageSquare className="size-3" /> Chat Toko
                                            </Link>
                                        </div>
                                    </div>
                                    {order.store.address && (
                                        <p className="flex items-start gap-1 text-xs text-gray-500">
                                            <MapPin className="mt-0.5 size-3 shrink-0" /> {order.store.address}{order.store.city ? `, ${order.store.city}` : ''}
                                        </p>
                                    )}
                                </div>

                                {order.type === 'ppob' ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] p-4">
                                        <h4 className="font-bold text-sm text-[#1e3a8a] mb-2">Detail PPOB</h4>
                                        <p className="text-sm font-medium">{order.ppob_buyer_sku_code || 'Produk PPOB'}</p>
                                        <p className="text-xs text-gray-500">{order.customer_phone}</p>
                                        {order.ppob_customer_name && (
                                            <p className="text-xs text-gray-500 mt-1">a.n. {order.ppob_customer_name}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] p-4">
                                        <h4 className="font-bold text-sm text-[#1e3a8a] mb-2">Alamat Pengiriman</h4>
                                        <p className="text-sm font-medium">{order.recipient_name}</p>
                                        <p className="text-xs text-gray-500">{order.recipient_phone}</p>
                                        <p className="text-xs text-gray-500 mt-1">{order.shipping_address}</p>
                                    </div>
                                )}

                                {/* Security Note */}
                                <div className="bg-[#10b77f]/5 rounded-xl p-4 border border-[#10b77f]/10 flex gap-3">
                                    <ShieldCheck className="size-5 text-[#10b77f] shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-[#10b77f] uppercase">Jaminan Keamanan</p>
                                        <p className="text-[11px] text-[#4c9a80]">Pembayaran Anda dienkripsi dengan standar keamanan tinggi.</p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </main>

                <footer className="border-t border-[#e7f3ef] bg-white py-8">
                    <div className="max-w-[1200px] mx-auto px-4 text-center text-sm text-gray-500">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Store className="size-5 text-[#10b77f]" fill="currentColor" />
                            <span className="font-bold text-[#1e3a8a]">Kasirku UMKM</span>
                        </div>
                        <p>&copy; 2024 Kasirku UMKM Marketplace. Karya Anak Bangsa Mendunia.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
