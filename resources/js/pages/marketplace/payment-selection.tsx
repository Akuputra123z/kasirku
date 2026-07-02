'use client';

import { Head, Link, router } from '@inertiajs/react';
import { Store, ChevronLeft, QrCode, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

const methodIcons: Record<string, React.ReactNode> = {
    qris: <QrCode className="size-6" />,
    bca_va: <CreditCard className="size-6" />,
    bni_va: <CreditCard className="size-6" />,
    bri_va: <CreditCard className="size-6" />,
    mandiri_va: <CreditCard className="size-6" />,
};

const bankColors: Record<string, string> = {
    qris: 'bg-green-100 text-green-600',
    bca_va: 'bg-red-100 text-red-600',
    bni_va: 'bg-orange-100 text-orange-600',
    bri_va: 'bg-blue-100 text-blue-600',
    mandiri_va: 'bg-yellow-100 text-yellow-600',
};

export default function PaymentSelection({ order, paymentMethods }: {
    order: { id: number; order_number: string; total: number; payment_status: string };
    paymentMethods: { id: string; name: string; description: string; icon: string }[];
}) {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handlePay = () => {
        if (!selectedMethod || processing) return;

        setProcessing(true);
        router.post(
            route('marketplace.orders.pay', { order: order.id }),
            { payment_method: selectedMethod },
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={`Pilih Pembayaran - ${order.order_number}`} />
            <div className="min-h-screen bg-gray-50">
                <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                        <Link href="/" className="flex items-center gap-2">
                            <Store className="text-[#4648d4]" size={28} fill="currentColor" />
                            <span className="text-xl font-bold text-[#4648d4]">Kasirku UMKM</span>
                        </Link>
                    </div>
                </nav>

                <div className="mx-auto max-w-2xl px-4 py-8">
                    <Link
                        href={route('marketplace.orders.show', { order: order.id })}
                        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4648d4]"
                    >
                        <ChevronLeft className="size-4" /> Kembali
                    </Link>

                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Pilih Metode Pembayaran</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Pesanan #{order.order_number} — {formatPrice(order.total)}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                                    selectedMethod === method.id
                                        ? 'border-[#4648d4] bg-[#4648d4]/5'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${
                                    bankColors[method.id] || 'bg-gray-100 text-gray-600'
                                }`}>
                                    {methodIcons[method.id] || <CreditCard className="size-6" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{method.name}</p>
                                    <p className="text-sm text-gray-500">{method.description}</p>
                                </div>
                                <div className={`size-5 rounded-full border-2 ${
                                    selectedMethod === method.id
                                        ? 'border-[#4648d4] bg-[#4648d4]'
                                        : 'border-gray-300'
                                }`}>
                                    {selectedMethod === method.id && (
                                        <div className="flex size-full items-center justify-center">
                                            <div className="size-2 rounded-full bg-white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        <p className="font-medium">Informasi</p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-blue-700">
                            <li>Pembayaran diproses oleh Midtrans</li>
                            <li>Pesanan akan otomatis terkonfirmasi setelah pembayaran diterima</li>
                        </ul>
                    </div>

                    <Button
                        className="mt-6 w-full gap-2 bg-[#4648d4] py-6 text-base hover:bg-[#3b3db8] disabled:opacity-50"
                        disabled={!selectedMethod || processing}
                        onClick={handlePay}
                    >
                        {processing ? (
                            <><Loader2 className="size-5 animate-spin" /> Memproses...</>
                        ) : (
                            <><ArrowRight className="size-5" /> Lanjutkan Pembayaran</>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}
