import { Head, router } from '@inertiajs/react';
import { Check, Crown, CreditCard, Loader2, QrCode, Copy, CheckCheck, X, ArrowRight, Eye, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Heading from '@/components/heading';
import billing from '@/routes/billing';
import { home } from '@/routes';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const paymentMethods = [
    { id: 'qris', name: 'QRIS', description: 'Bayar via aplikasi bank / e-wallet', icon: QrCode },
    { id: 'bca_va', name: 'BCA Virtual Account', description: 'Transfer ke nomor Virtual Account BCA', icon: CreditCard },
    { id: 'bni_va', name: 'BNI Virtual Account', description: 'Transfer ke nomor Virtual Account BNI', icon: CreditCard },
    { id: 'bri_va', name: 'BRI Virtual Account', description: 'Transfer ke nomor Virtual Account BRI', icon: CreditCard },
    { id: 'mandiri_va', name: 'Mandiri Bill Payment', description: 'Bayar via Mandiri Bill Payment', icon: CreditCard },
];

const bankColors: Record<string, string> = {
    qris: 'bg-green-100 text-green-600',
    bca_va: 'bg-red-100 text-red-600',
    bni_va: 'bg-orange-100 text-orange-600',
    bri_va: 'bg-blue-100 text-blue-600',
    mandiri_va: 'bg-yellow-100 text-yellow-600',
};

const paymentMethodLabels: Record<string, string> = {
    qris: 'QRIS',
    bca_va: 'BCA Virtual Account',
    bni_va: 'BNI Virtual Account',
    bri_va: 'BRI Virtual Account',
    mandiri_va: 'Mandiri Bill Payment',
};

type PaymentPayload = {
    qr_url?: string;
    va_number?: string;
    bank?: string;
    transaction_id?: string;
};

type Subscription = {
    id: number;
    package: string;
    amount: number;
    status: string;
    payment_method: string | null;
    payment_payload: PaymentPayload | null;
    midtrans_transaction_id: string | null;
    started_at: string | null;
    expires_at: string | null;
    created_at: string;
    paid_at: string | null;
};

export default function Billing({
    isPremium,
    isTrial,
    currentPackage,
    expiresAt,
    daysLeft,
    subscriptions,
    pendingSubscription,
    pricing,
}: {
    isPremium: boolean;
    isTrial: boolean;
    currentPackage: string | null;
    expiresAt: string | null;
    daysLeft: number;
    subscriptions: Subscription[];
    pendingSubscription: { id: number; package: string; amount: number; payment_method: string | null; payment_payload: PaymentPayload | null } | null;
    pricing: { monthly: number; yearly: number };
}) {
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Subscription | null>(null);

    const hasPendingPayment = pendingSubscription?.payment_method && pendingSubscription?.payment_payload;

    useEffect(() => {
        if (!hasPendingPayment) return;

        const interval = setInterval(() => router.reload(), 5000);

        return () => clearInterval(interval);
    }, [hasPendingPayment]);

    const subscribe = async (pkg: 'monthly' | 'yearly') => {
        setLoading(pkg);

        try {
            const res = await fetch(billing.subscribe().url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? '' },
                body: JSON.stringify({ package: pkg }),
            });

            if (!res.ok) {
                router.reload();
                return;
            }

            router.reload();
        } catch {
            router.reload();
        }
    };

    const handleCharge = async () => {
        if (!selectedMethod || !pendingSubscription) return;

        setLoading('charge');

        try {
            const res = await fetch(billing.charge(pendingSubscription.id).url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? '' },
                body: JSON.stringify({ payment_method: selectedMethod }),
            });

            if (!res.ok) {
                router.reload();
                return;
            }

            router.reload();
        } catch {
            router.reload();
        }
    };

    const handleCancel = async () => {
        if (!pendingSubscription) return;

        setLoading('cancel');

        try {
            await fetch(billing.cancel(pendingSubscription.id).url, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? '' },
            });

            router.reload();
        } catch {
            router.reload();
        }
    };


    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const invoiceNumber = (s: Subscription) =>
        'INV-' + s.package.toUpperCase() + '-' + String(s.id).padStart(6, '0');

    const handlePrintInvoice = (s: Subscription) => {
        const bankLabel = (paymentMethodLabels[s.payment_method ?? ''] || s.payment_method) ?? '-';
        const title = s.package === 'yearly' ? 'Langganan Tahunan' : 'Langganan Bulanan';

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html>
            <head><title>Invoice ${invoiceNumber(s)}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 40px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #f5f5f5; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .text-lg { font-size: 18px; }
                .mt-4 { margin-top: 16px; }
                .mb-2 { margin-bottom: 8px; }
                .text-muted { color: #666; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 style="margin:0;">INVOICE</h1>
                        <p class="text-muted">${invoiceNumber(s)}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold" style="color: #059669;">LUNAS</p>
                        <p class="text-muted">${s.paid_at ?? ''}</p>
                    </div>
                </div>
                <p class="mb-2"><strong>Item:</strong> ${title}</p>
                <p class="mb-2"><strong>Periode:</strong> ${s.started_at ?? '-'} — ${s.expires_at ?? '-'}</p>
                <table>
                    <thead><tr><th>Deskripsi</th><th class="text-center">Periode</th><th class="text-right">Jumlah</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>${title}</td>
                            <td class="text-center text-muted">${s.started_at ?? '-'} — ${s.expires_at ?? '-'}</td>
                            <td class="text-right font-bold">${formatPrice(s.amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr><td colspan="2" class="text-right font-bold">Total</td><td class="text-right font-bold text-lg">${formatPrice(s.amount)}</td></tr>
                    </tfoot>
                </table>
                <div class="mt-4">
                    <p><strong>Metode Pembayaran:</strong> ${bankLabel}</p>
                    ${s.midtrans_transaction_id ? `<p><strong>ID Transaksi:</strong> ${s.midtrans_transaction_id}</p>` : ''}
                </div>
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body></html>
        `);
        win.document.close();
    };

    return (
        <>
            <Head title="Billing - Langganan" />
            <div className="px-4 py-6">
                <Heading title="Billing & Langganan" description="Kelola langganan premium toko Anda" />

                {/* Status Saat Ini */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="size-5 text-amber-500" />
                            Status Langganan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isPremium ? (
                            <div className="flex items-center gap-3">
                                {isTrial ? (
                                    <>
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">Trial</span>
                                        <span className="text-sm text-muted-foreground">
                                            Masa percobaan — aktif sampai {expiresAt} ({daysLeft} hari lagi). Lakukan pembayaran untuk memperpanjang.
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Premium</span>
                                        <span className="text-sm text-muted-foreground">
                                            Aktif sampai {expiresAt} ({daysLeft} hari lagi)
                                        </span>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">Gratis</span>
                                <span className="text-sm text-muted-foreground">Upgrade untuk fitur unlimited</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Instructions */}
                {hasPendingPayment && pendingSubscription && (
                    <Card className="mt-4 border-emerald-200">
                        <CardHeader>
                            <CardTitle className="text-sm">Menunggu Pembayaran</CardTitle>
                            <CardDescription>Selesaikan pembayaran sebelum batas waktu 24 jam</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg bg-emerald-50 p-4">
                                <p className="text-xs text-emerald-700 capitalize">
                                    {pendingSubscription.package === 'yearly' ? 'Tahunan' : 'Bulanan'}
                                </p>
                                <p className="text-lg font-bold text-emerald-800">
                                    {formatPrice(pendingSubscription.amount)}
                                    {pendingSubscription.package === 'monthly' && <span className="text-sm font-normal">/bln</span>}
                                    {pendingSubscription.package === 'yearly' && <span className="text-sm font-normal">/thn</span>}
                                </p>

                                {pendingSubscription.payment_method === 'qris' && pendingSubscription.payment_payload?.qr_url && (
                                    <div className="mt-4 flex flex-col items-center gap-3">
                                        <img
                                            src={pendingSubscription.payment_payload.qr_url}
                                            alt="QRIS"
                                            className="size-48 rounded-lg border"
                                        />
                                        <p className="text-xs text-muted-foreground">Scan QRIS di atas menggunakan aplikasi bank atau e-wallet</p>
                                    </div>
                                )}

                                {pendingSubscription.payment_method !== 'qris' && pendingSubscription.payment_payload?.va_number && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-xs text-muted-foreground">Virtual Account Number</p>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-white px-3 py-2 text-lg font-bold tracking-wider">
                                                {pendingSubscription.payment_payload.va_number}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(pendingSubscription.payment_payload!.va_number!)}
                                            >
                                                {copied ? <CheckCheck className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Bank: {pendingSubscription.payment_payload.bank?.toUpperCase()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading === 'cancel'}>
                                    {loading === 'cancel' ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                                    Batalkan & Ganti Metode
                                </Button>
                                <Button size="sm" onClick={() => router.reload()}>
                                    <Check className="size-4" />
                                    Saya Sudah Bayar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payment Method Selector */}
                {pendingSubscription && !hasPendingPayment && (
                    <Card className="mt-4 border-amber-200">
                        <CardHeader>
                            <CardTitle className="text-sm">Pilih Metode Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Selected Package Summary */}
                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="text-xs text-amber-700">Paket dipilih</p>
                                <p className="text-lg font-bold text-amber-900 capitalize">
                                    {pendingSubscription.package === 'yearly' ? 'Tahunan' : 'Bulanan'}
                                </p>
                                <p className="text-sm font-semibold text-amber-800">
                                    {formatPrice(pendingSubscription.amount)}
                                    {pendingSubscription.package === 'monthly' && <span className="text-xs font-normal">/bln</span>}
                                    {pendingSubscription.package === 'yearly' && <span className="text-xs font-normal">/thn</span>}
                                </p>
                            </div>

                            <p className="mb-3 text-xs font-medium text-muted-foreground">Metode pembayaran</p>

                            <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`flex w-full items-center gap-4 rounded-xl border-2 p-3 text-left transition-all ${
                                            selectedMethod === method.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bankColors[method.id] || 'bg-gray-100 text-gray-600'}`}>
                                            <method.icon className="size-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{method.name}</p>
                                            <p className="text-xs text-muted-foreground">{method.description}</p>
                                        </div>
                                        <div className={`size-4 rounded-full border-2 ${
                                            selectedMethod === method.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                                        }`}>
                                            {selectedMethod === method.id && <div className="flex size-full items-center justify-center"><div className="size-1.5 rounded-full bg-white" /></div>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button
                                    className="flex-1 gap-2"
                                    disabled={!selectedMethod || loading === 'charge'}
                                    onClick={handleCharge}
                                >
                                    {loading === 'charge' ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                                    Bayar Sekarang
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading === 'cancel'}>
                                    <X className="size-4" /> Batal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Paket */}
                {!pendingSubscription && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Card className={currentPackage === 'yearly' ? 'opacity-60' : 'border-emerald-200'}>
                            <CardHeader>
                                <CardTitle>Bulanan</CardTitle>
                                <CardDescription>Bayar per bulan, bebas kapan saja</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{formatPrice(pricing.monthly)}<span className="text-base font-normal text-muted-foreground">/bln</span></p>
                                <ul className="mt-4 space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" /> Produk unlimited</li>
                                    <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" /> Staff unlimited</li>
                                    <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" /> Posting ke marketplace</li>
                                    <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" /> Export laporan</li>
                                    <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" /> Kustom domain</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {currentPackage === 'yearly' ? (
                                    <div className="w-full text-center text-xs text-muted-foreground">
                                        Langganan Tahunan aktif sampai {expiresAt}. Beralih ke Bulanan setelah masa berlaku habis.
                                    </div>
                                ) : (
                                    <Button className="w-full" disabled={loading !== null} onClick={() => subscribe('monthly')}>
                                        {loading === 'monthly' ? <Loader2 className="size-4 animate-spin" /> : currentPackage === 'monthly' ? 'Perpanjang' : 'Langganan'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>

                        <Card className={currentPackage === 'yearly' || currentPackage === 'monthly' ? 'border-amber-200 ring-2 ring-amber-400' : 'border-emerald-200'}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Tahunan
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Hemat 2 bulan</span>
                                </CardTitle>
                                <CardDescription>Bayar sekali setahun, harga lebih murah</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{formatPrice(pricing.yearly)}<span className="text-base font-normal text-muted-foreground">/thn</span></p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatPrice(pricing.monthly * 12)} jika bulanan — hemat {formatPrice(pricing.monthly * 12 - pricing.yearly)}</p>
                                <ul className="mt-4 space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" /> Semua fitur bulanan</li>
                                    <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-500" /> Prioritas support</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={currentPackage === 'yearly' ? 'outline' : 'default'} disabled={loading !== null} onClick={() => subscribe('yearly')}>
                                    {loading === 'yearly' ? <Loader2 className="size-4 animate-spin" /> : currentPackage === 'yearly' ? 'Perpanjang' : currentPackage === 'monthly' ? 'Upgrade ke Tahunan' : 'Langganan'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* History */}
                {subscriptions.length > 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-sm">Riwayat Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 font-medium">Paket</th>
                                        <th className="pb-2 font-medium">Jumlah</th>
                                        <th className="pb-2 font-medium">Status</th>
                                        <th className="pb-2 font-medium">Tanggal</th>
                                        <th className="pb-2 font-medium">Berakhir</th>
                                        <th className="pb-2 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptions.map((s, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="py-2 capitalize">{s.package}</td>
                                            <td className="py-2">{formatPrice(s.amount)}</td>
                                            <td className="py-2">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    s.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                    s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    s.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-red-100 text-red-700'
                                                }`}>{s.status}</span>
                                            </td>
                                            <td className="py-2">{s.started_at ?? s.created_at}</td>
                                            <td className="py-2">{s.expires_at ?? '-'}</td>
                                            <td className="py-2">
                                                {s.status === 'paid' ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setSelectedInvoice(s)}>
                                                            <Eye className="mr-1 size-3.5" />
                                                            Detail
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrintInvoice(s)} title="Cetak Invoice">
                                                            <Printer className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* Invoice Detail Dialog */}
                <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
                    <DialogContent className="sm:max-w-lg">
                        {selectedInvoice && (
                            <InvoiceDetail
                                subscription={selectedInvoice}
                                invoiceNumber={invoiceNumber(selectedInvoice)}
                                onClose={() => setSelectedInvoice(null)}
                                onPrint={handlePrintInvoice}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

function InvoiceDetail({
    subscription: s,
    invoiceNumber: invNum,
    onClose,
    onPrint,
}: {
    subscription: Subscription;
    invoiceNumber: string;
    onClose: () => void;
    onPrint: (s: Subscription) => void;
}) {
    const bankLabel = (paymentMethodLabels[s.payment_method ?? ''] || s.payment_method) ?? '-';
    const title = s.package === 'yearly' ? 'Langganan Tahunan' : 'Langganan Bulanan';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
                <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="font-semibold">{invNum}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">LUNAS</p>
                    <p className="text-xs text-muted-foreground">{s.paid_at ?? '-'}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="px-3 py-2 text-left font-medium">Deskripsi</th>
                            <th className="px-3 py-2 text-left font-medium">Periode</th>
                            <th className="px-3 py-2 text-right font-medium">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-3 py-2 font-medium">{title}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                                {s.started_at ?? '-'} — {s.expires_at ?? '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">{formatPrice(s.amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="border-t">
                            <td colSpan={2} className="px-3 py-2 text-right text-sm font-semibold">Total</td>
                            <td className="px-3 py-2 text-right font-bold">{formatPrice(s.amount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex items-center justify-between text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">Metode</p>
                    <p className="font-medium">{bankLabel}</p>
                </div>
                {s.midtrans_transaction_id && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">ID Transaksi</p>
                        <p className="font-mono text-xs">{s.midtrans_transaction_id}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
                <Button variant="outline" size="sm" onClick={onClose}>Tutup</Button>
                <Button size="sm" onClick={() => onPrint(s)}>
                    <Printer className="mr-2 size-4" />
                    Cetak
                </Button>
            </div>
        </div>
    );
}

Billing.layout = {
    breadcrumbs: [
        { title: 'Home', href: home() },
        { title: 'Billing', href: billing.index().url },
    ],
};
