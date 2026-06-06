'use client';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Product {
    id: number;
    name: string;
    price: number;
    category?: { name: string } | null;
}

interface Label {
    product: Product;
    barcode: string;
    barcodeBase64: string;
}

interface Props {
    labels: Label[];
    total: number;
    skipped: number;
}

export default function BarcodeLabels({ labels, total, skipped }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title="Cetak Barcode" />

            {/* ── Print labels ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-center gap-3 p-4 pb-24 print:flex print:flex-row print:flex-wrap print:justify-center print:items-start print:gap-2 print:p-2">
                {skipped > 0 && (
                    <div className="col-span-full w-full max-w-[58mm] rounded-lg bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-700 print:hidden dark:bg-amber-950 dark:text-amber-300">
                        {skipped} produk tidak memiliki barcode dan dilewati
                    </div>
                )}

                {labels.map((label) => (
                    <div
                        key={label.product.id}
                        className="label-item w-[58mm] overflow-hidden rounded-xl border border-dashed border-border bg-white p-3 shadow-sm print:rounded-none print:border-none print:shadow-none"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <p className="max-w-[52mm] truncate text-center text-[9px] font-bold text-foreground">
                                {label.product.name}
                            </p>
                            <img
                                src={`data:image/png;base64,${label.barcodeBase64}`}
                                alt={label.barcode}
                                className="h-auto w-full max-h-[28mm]"
                            />
                            <p className="text-[8px] font-medium text-muted-foreground">
                                {label.barcode}
                            </p>
                            {label.product.price > 0 && (
                                <p className="text-[10px] font-bold text-foreground">
                                    Rp{' '}
                                    {new Intl.NumberFormat('id-ID').format(
                                        label.product.price,
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {labels.length === 0 && (
                    <div className="col-span-full flex flex-col items-center gap-4 py-20">
                        <p className="text-[14px] font-medium text-muted-foreground">
                            Tidak ada produk dengan barcode yang dipilih.
                        </p>
                        <Link href={route('products.index')}>
                            <Button variant="outline" className="rounded-xl">
                                <ArrowLeft className="size-4" />
                                Kembali
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* ── Controls (hidden saat print) ── */}
            {labels.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-3 border-t border-border bg-white p-4 print:hidden">
                    <Link href={route('products.index')}>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 rounded-xl"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali
                        </Button>
                    </Link>
                    <Button
                        onClick={handlePrint}
                        className="flex items-center gap-2 rounded-xl"
                    >
                        <Printer className="size-4" />
                        Cetak Label ({total})
                    </Button>
                </div>
            )}

            <style>{`
                @media print {
                    @page {
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .label-item {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>
        </>
    );
}
