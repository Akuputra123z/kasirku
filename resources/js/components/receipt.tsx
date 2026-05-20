import React from 'react';

interface ReceiptProps {
    transaction: {
        transaction_code: string;
        subtotal_amount: number;
        tax_amount: number;
        discount_amount: number;
        total_amount: number;
        paid_amount: number;
        change_amount: number;
        created_at?: string;
        user?: { name: string };
        customer?: { name: string; phone?: string | null } | null;
        payment_method?: { name: string } | null;
        order_type?: string;
        details?: {
            product_name?: string;
            product?: { name: string } | null;
            quantity: number;
            price: number;
            subtotal?: number;
        }[];
    };
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ transaction }, ref) => {
        const formatCurrency = (val: number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(val);
        };

        const formatDate = (dateStr?: string) => {
            if (!dateStr) {
                return new Date().toLocaleString('id-ID');
            }

            return new Date(dateStr).toLocaleString('id-ID');
        };

        const orderTypeLabel =
            transaction.order_type === 'service'
                ? 'Service'
                : transaction.order_type === 'pre_order'
                  ? 'Pre-Order'
                  : 'Direct';

        return (
            <div
                ref={ref}
                className="hidden w-[80mm] bg-white p-4 font-mono text-[12px] leading-tight text-black print:block"
            >
                {/* Header Toko */}
                <div className="mb-4 text-center">
                    <h2 className="text-[18px] font-bold uppercase tracking-wide">
                        AMERTA KOMPUTER
                    </h2>
                    <p className="text-[11px]">
                        Jl. Diponegoro No.88, Rembang
                    </p>
                    <p className="text-[11px]">Telp: 085740724793</p>
                </div>

                {/* No. Resi */}
                <div className="mb-3 border-y-2 border-black py-2 text-center">
                    <p className="text-[10px] uppercase tracking-widest opacity-60">
                        No. Resi
                    </p>
                    <p className="text-[16px] font-black tracking-tight">
                        {transaction.transaction_code}
                    </p>
                </div>

                {/* Info Transaksi */}
                <div className="mb-2 border-b border-dashed border-black pb-2 text-[11px]">
                    <div className="flex justify-between">
                        <span className="opacity-60">Tanggal</span>
                        <span>{formatDate(transaction.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Kasir</span>
                        <span>{transaction.user?.name || 'Admin'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Tipe</span>
                        <span>{orderTypeLabel}</span>
                    </div>
                    {transaction.payment_method && (
                        <div className="flex justify-between">
                            <span className="opacity-60">Bayar</span>
                            <span>{transaction.payment_method.name}</span>
                        </div>
                    )}
                    {transaction.customer && (
                        <div className="flex justify-between">
                            <span className="opacity-60">Pelanggan</span>
                            <span>{transaction.customer.name}</span>
                        </div>
                    )}
                </div>

                {/* Item Table */}
                <div className="mb-2 border-b border-dashed border-black pb-2">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="py-1 font-bold uppercase">
                                    Item
                                </th>
                                <th className="py-1 text-center font-bold uppercase">
                                    Qty
                                </th>
                                <th className="py-1 text-right font-bold uppercase">
                                    Harga
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transaction.details?.map(
                                (detail: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="py-1 pr-2">
                                            {detail.product_name ||
                                                detail.product?.name ||
                                                'Product'}
                                        </td>
                                        <td className="py-1 text-center">
                                            {detail.quantity}
                                        </td>
                                        <td className="py-1 text-right whitespace-nowrap">
                                            {formatCurrency(detail.price)}
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Total */}
                <div className="mb-4 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                        <span className="opacity-60">Subtotal</span>
                        <span>{formatCurrency(transaction.subtotal_amount)}</span>
                    </div>
                    {transaction.discount_amount > 0 && (
                        <div className="flex justify-between">
                            <span className="opacity-60">Diskon</span>
                            <span>
                                -{formatCurrency(transaction.discount_amount)}
                            </span>
                        </div>
                    )}
                    {transaction.tax_amount > 0 && (
                        <div className="flex justify-between">
                            <span className="opacity-60">Pajak</span>
                            <span>{formatCurrency(transaction.tax_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t-2 border-black pt-1 text-[14px] font-black">
                        <span>TOTAL</span>
                        <span>{formatCurrency(transaction.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Tunai</span>
                        <span>{formatCurrency(transaction.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Kembali</span>
                        <span>{formatCurrency(transaction.change_amount)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 border-t-2 border-black pt-3 text-center text-[11px]">
                    <p className="font-bold text-[14px]">TERIMA KASIH</p>
                    <p>Barang yang sudah dibeli tidak dapat</p>
                    <p>ditukar atau dikembalikan</p>
                    <div className="mt-3 text-[9px] opacity-40">
                        {new Date().toISOString()}
                    </div>
                </div>
            </div>
        );
    },
);

Receipt.displayName = 'Receipt';
