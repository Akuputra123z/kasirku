import { Head } from '@inertiajs/react';
import { CheckCircle, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import billing from '@/routes/billing';
import { home } from '@/routes';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const paymentMethodLabels: Record<string, string> = {
    qris: 'QRIS',
    bca_va: 'BCA Virtual Account',
    bni_va: 'BNI Virtual Account',
    bri_va: 'BRI Virtual Account',
    mandiri_va: 'Mandiri Bill Payment',
};

interface Invoice {
    number: string;
    package: string;
    amount: number;
    payment_method: string;
    started_at: string;
    expires_at: string;
    paid_at: string;
    transaction_id: string | null;
    payment_payload: Record<string, unknown> | null;
}

interface Props {
    invoice: Invoice | null;
    storeName: string | null;
    storeAddress: string | null;
    storeCity: string | null;
    storeProvince: string | null;
}

export default function BillingSuccess({ invoice, storeName, storeAddress, storeCity, storeProvince }: Props) {
    const handlePrint = () => window.print();

    return (
        <>
            <Head title="Pembayaran Berhasil" />
            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-4 flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Download className="mr-2 size-4" />
                        Cetak Invoice
                    </Button>
                </div>

                <Card id="invoice" className="border-2">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Invoice</CardTitle>
                                {invoice && (
                                    <p className="text-xs text-muted-foreground">{invoice.number}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="size-8 text-emerald-500" />
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-emerald-600">LUNAS</p>
                                    {invoice && (
                                        <p className="text-xs text-muted-foreground">{invoice.paid_at}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-sm font-semibold">Dari:</p>
                                <p className="text-sm">{storeName || '-'}</p>
                                {storeAddress && <p className="text-xs text-muted-foreground">{storeAddress}</p>}
                                {storeCity && (
                                    <p className="text-xs text-muted-foreground">
                                        {storeCity}{storeProvince ? `, ${storeProvince}` : ''}
                                    </p>
                                )}
                            </div>
                            {invoice && (
                                <div className="text-right">
                                    <p className="text-sm font-semibold">Untuk:</p>
                                    <p className="text-sm">{storeName || '-'}</p>
                                    <p className="text-xs text-muted-foreground">{invoice.package === 'yearly' ? 'Langganan Tahunan' : 'Langganan Bulanan'}</p>
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                                        <th className="px-4 py-3 text-center font-medium">Periode</th>
                                        <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice && (
                                        <tr className="border-b">
                                            <td className="px-4 py-3">
                                                <p className="font-medium">
                                                    {invoice.package === 'yearly' ? 'Langganan Tahunan' : 'Langganan Bulanan'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {invoice.package === 'yearly' ? 'Akses premium 1 tahun penuh' : 'Akses premium 1 bulan'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                                                {invoice.started_at} — {invoice.expires_at}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatPrice(invoice.amount)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    {invoice && (
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 text-right font-semibold">Total</td>
                                            <td className="px-4 py-3 text-right font-bold text-lg">
                                                {formatPrice(invoice.amount)}
                                            </td>
                                        </tr>
                                    )}
                                </tfoot>
                            </table>
                        </div>

                        {invoice && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Metode Pembayaran</p>
                                    <p className="font-medium">{paymentMethodLabels[invoice.payment_method] || invoice.payment_method}</p>
                                </div>
                                {invoice.transaction_id && (
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-muted-foreground">ID Transaksi</p>
                                        <p className="font-mono text-xs">{invoice.transaction_id}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="justify-center gap-3 border-t p-6">
                        <Button asChild>
                            <a href={billing.index().url}>
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali ke Billing
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={home().url}>Dashboard</a>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
