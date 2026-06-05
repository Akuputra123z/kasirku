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

interface Props {
    product: Product;
    barcode: string | null;
    barcodeBase64: string | null;
}

export default function BarcodeLabel({ product, barcode, barcodeBase64 }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`Barcode - ${product.name}`} />

            {/* ── Print-only label ── */}
            <div className="flex flex-col items-center justify-center p-8 print:p-0">
                <div className="w-[58mm] overflow-hidden rounded-xl border border-dashed border-border bg-white p-3 shadow-sm print:border-none print:shadow-none">
                    {barcodeBase64 ? (
                        <div className="flex flex-col items-center gap-1">
                            <p className="max-w-[52mm] truncate text-center text-[9px] font-bold text-foreground">
                                {product.name}
                            </p>
                            <img
                                src={`data:image/png;base64,${barcodeBase64}`}
                                alt={barcode ?? ''}
                                className="h-auto w-full"
                            />
                            <p className="text-[8px] font-medium text-muted-foreground">
                                {barcode}
                            </p>
                            {product.price && (
                                <p className="text-[10px] font-bold text-foreground">
                                    Rp{' '}
                                    {new Intl.NumberFormat('id-ID').format(
                                        product.price,
                                    )}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-[12px] text-muted-foreground">
                            Produk ini belum memiliki barcode
                        </p>
                    )}
                </div>

                {/* ── Controls (hidden saat print) ── */}
                <div className="mt-6 flex items-center gap-3 print:hidden">
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
                        Cetak Label
                    </Button>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: 58mm 40mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
            `}</style>
        </>
    );
}
