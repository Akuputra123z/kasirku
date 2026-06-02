'use client';

import { Head, usePage } from '@inertiajs/react';
import {
    DollarSign,
    ShoppingCart,
    BarChart3,
    Search,
    Eye,
    Printer,
    ChevronLeft,
    ChevronRight,
    Clock,
    Bluetooth,
    Usb,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { Receipt as ReceiptComponent } from '@/components/receipt';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useBluetoothPrint } from '@/hooks/use-bluetooth-print';
import { useReceiptData } from '@/hooks/use-receipt-data';
import { useUsbPrint } from '@/hooks/use-usb-print';

interface Customer {
    id: number;
    name: string;
    phone: string | null;
}

interface Voucher {
    id: number;
    code: string;
    name: string;
    discount: number;
}

interface Transaction {
    id: number;
    transaction_code: string;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    paid_amount: number;
    change_amount: number;
    created_at: string;
    user: { name: string };
    customer: Customer | null;
    payment_method?: { name: string } | null;
    order_type?: string;
    table_number?: string | null;
    voucher?: Voucher | null;
    redeemed_points?: number;
    point_transactions_count?: number;
    details: {
        product_name?: string;
        product: { name: string } | null;
        variant_name?: string | null;
        quantity: number;
        price: number;
        subtotal: number;
        notes?: string | null;
    }[];
}

interface Summary {
    total_revenue: number;
    total_transactions: number;
    avg_transaction: number;
    total_tax: number;
}

interface PaginatedTransactions {
    data: Transaction[];
    current_page: number;
    total?: number;
}

interface Props {
    transactions: Transaction[] | PaginatedTransactions;
    summary: Summary;
}

export default function History({ transactions, summary }: Props) {
    const page = usePage();
    const tenant = (page.props as any).tenant;
    const storeData = tenant
        ? {
              name: tenant.name,
              address: tenant.address,
              phone: tenant.phone,
              footer: tenant.settings?.receipt_footer,
          }
        : null;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);
    const [showDetailTransaction, setShowDetailTransaction] =
        useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const receiptRef = useRef<HTMLDivElement>(null);

    const {
        print: usbPrint,
        isSupported: webUsbSupported,
        isPrinting: isWebUsbPrinting,
        deviceName: usbDeviceName,
    } = useUsbPrint();

    const {
        print: bluetoothPrint,
        isSupported: webBluetoothSupported,
        isPrinting: isWebBluetoothPrinting,
        deviceName: bluetoothDeviceName,
    } = useBluetoothPrint();

    const { fetchRaw: fetchReceiptRaw } = useReceiptData();

    const receiptTitleRef = useRef('Struk');

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: () => receiptTitleRef.current,
    });

    const printTransaction = (transaction: Transaction) => {
        receiptTitleRef.current = transaction.transaction_code;
        setSelectedTransaction(transaction);
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    const handleUsbPrint = useCallback(async (id: number) => {
        if (!webUsbSupported) {
            toast.error('WebUSB tidak didukung. Gunakan Chrome atau Edge.');

            return;
        }

        try {
            const rawData = await fetchReceiptRaw(id);
            await usbPrint(rawData);
            toast.success(
                usbDeviceName
                    ? `Struk berhasil dikirim ke ${usbDeviceName}`
                    : 'Struk berhasil dicetak',
            );
        } catch (err: any) {
            toast.error(err?.message || 'Gagal mencetak via USB');
        }
    }, [webUsbSupported, usbPrint, usbDeviceName, fetchReceiptRaw]);

    const handleBluetoothPrint = useCallback(async (id: number) => {
        if (!webBluetoothSupported) {
            toast.error('Web Bluetooth tidak didukung.');

            return;
        }

        try {
            const rawData = await fetchReceiptRaw(id);
            await bluetoothPrint(rawData);
            toast.success(
                bluetoothDeviceName
                    ? `Struk berhasil dikirim ke ${bluetoothDeviceName}`
                    : 'Struk berhasil dicetak',
            );
        } catch (err: any) {
            toast.error(err?.message || 'Gagal mencetak via Bluetooth');
        }
    }, [webBluetoothSupported, bluetoothPrint, bluetoothDeviceName, fetchReceiptRaw]);

    const fmt = (val: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);

    const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const fmtTime = (d: string) =>
        new Date(d).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });

    const transactionList = Array.isArray(transactions)
        ? transactions
        : transactions?.data || [];

    // Filter
    const filtered = transactionList.filter(
        (t) =>
            t.transaction_code
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Pagination
    const totalPages = Math.ceil(filtered.length / perPage);
    const startIdx = (currentPage - 1) * perPage;
    const paginated = filtered.slice(startIdx, startIdx + perPage);

    const summaryCards = [
        {
            label: 'Total Revenue',
            value: fmt(summary.total_revenue),
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            bar: 'bg-emerald-500',
        },
        {
            label: 'Total Transactions',
            value: summary.total_transactions.toString(),
            icon: ShoppingCart,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            bar: 'bg-blue-500',
        },
        {
            label: 'Average Transaction',
            value: fmt(summary.avg_transaction),
            icon: BarChart3,
            color: 'text-violet-600',
            bg: 'bg-violet-50 dark:bg-violet-500/10',
            bar: 'bg-violet-500',
        },
        {
            label: 'Total Tax',
            value: fmt(summary?.total_tax || 0),
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            bar: 'bg-amber-500',
        },
    ];

    return (
        <div className="font-geist min-h-screen space-y-5 bg-white p-4 text-neutral-900 md:p-6 dark:bg-neutral-950 dark:text-white">
            <Head title="Transaction History" />

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {summaryCards.map((card) => (
                    <Card
                        key={card.label}
                        className="rounded-2xl border border-neutral-100 shadow-none dark:border-neutral-800"
                    >
                        <CardContent className="flex items-start justify-between p-4">
                            <div className="space-y-2">
                                <p className="text-xl font-bold">
                                    {card.value}
                                </p>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                    {card.label}
                                </p>
                                <div
                                    className={`h-1 w-12 rounded-full ${card.bar}`}
                                />
                            </div>
                            <div
                                className={`flex size-10 items-center justify-center rounded-xl ${card.bg}`}
                            >
                                <card.icon className={`size-5 ${card.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* FILTERS */}
            <Card className="rounded-2xl border border-neutral-100 shadow-none dark:border-neutral-800">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="rounded-lg border-transparent bg-neutral-900 px-3 py-1.5 text-[12px] font-bold text-white dark:bg-white dark:text-black"
                        >
                            All {transactionList.length}
                        </Badge>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search transaction..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-9 rounded-lg border-neutral-200 bg-transparent pl-9 text-[13px] focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* TABLE */}
            <Card className="overflow-hidden rounded-2xl border border-neutral-100 shadow-none dark:border-neutral-800">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Id
                                </TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Transaction
                                </TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Cashier
                                </TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Customer
                                </TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Items
                                </TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Total
                                </TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Status
                                </TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Date
                                </TableHead>
                                <TableHead className="px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.length > 0 ? (
                                paginated.map((t) => (
                                    <TableRow
                                        key={t.id}
                                        className="border-b border-neutral-50 transition-colors hover:bg-neutral-50/50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                    >
                                        <TableCell className="px-4 py-3.5">
                                            <span className="text-[12px] font-medium text-muted-foreground">
                                                {t.id}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <span className="text-[13px] font-bold tracking-tight">
                                                {t.transaction_code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <span className="text-[13px] font-medium">
                                                {t.user?.name ?? 'Admin'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            {t.customer ? (
                                                <span className="text-[13px] font-medium">
                                                    {t.customer.name}
                                                </span>
                                            ) : (
                                                <span className="text-[12px] text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <span className="text-[13px] font-medium">
                                                {t.details.length}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <span className="text-[13px] font-bold">
                                                {fmt(t.total_amount)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <Badge className="rounded-md border-none bg-emerald-50 px-2 text-[11px] font-bold text-emerald-600 shadow-none dark:bg-emerald-500/10 dark:text-emerald-400">
                                                Paid
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-medium">
                                                    {fmtDate(t.created_at)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {fmtTime(t.created_at)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            <Printer className="size-3.5 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuLabel className="text-[12px]">
                                                            Cetak Struk
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => printTransaction(t)}
                                                            className="gap-2 text-[13px]"
                                                        >
                                                            <Printer className="size-3.5" />
                                                            Print Struk
                                                        </DropdownMenuItem>
                                                        {webUsbSupported && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUsbPrint(t.id)}
                                                                disabled={isWebUsbPrinting}
                                                                className="gap-2 text-[13px]"
                                                            >
                                                                <Usb className="size-3.5" />
                                                                {isWebUsbPrinting
                                                                    ? 'Mencetak...'
                                                                    : 'Cetak Langsung (USB)'}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {webBluetoothSupported && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleBluetoothPrint(t.id)}
                                                                disabled={isWebBluetoothPrinting}
                                                                className="gap-2 text-[13px]"
                                                            >
                                                                <Bluetooth className="size-3.5" />
                                                                {isWebBluetoothPrinting
                                                                    ? 'Mencetak...'
                                                                    : 'Cetak Langsung (Bluetooth)'}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                    onClick={() =>
                                                        setShowDetailTransaction(t)
                                                    }
                                                >
                                                    <Eye className="size-3.5 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="py-12 text-center text-[13px] text-muted-foreground"
                                    >
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* PAGINATION */}
                <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span>Show</span>
                        <Select
                            value={perPage.toString()}
                            onValueChange={(v) => {
                                setPerPage(Number(v));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-16 rounded-lg text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground">
                            {startIdx + 1}-
                            {Math.min(startIdx + perPage, filtered.length)} of{' '}
                            {filtered.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="px-2 text-[12px] font-bold">
                                {currentPage}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* DETAIL DIALOG */}
            <Dialog
                open={showDetailTransaction !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowDetailTransaction(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Detail Transaksi
                        </DialogTitle>
                    </DialogHeader>
                    {showDetailTransaction && (() => {
                        const t = showDetailTransaction;
                        const orderTypeLabel =
                            t.order_type === 'service'
                                ? 'Service'
                                : t.order_type === 'pre_order'
                                  ? 'Pre-Order'
                                  : 'Direct';

                        return (
                            <ScrollArea className="max-h-[75vh]">
                                <div className="space-y-5">
                                    {/* HEADER */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold">{t.transaction_code}</p>
                                            <p className="text-[12px] text-muted-foreground">
                                                {fmtDate(t.created_at)} {fmtTime(t.created_at)}
                                            </p>
                                        </div>
                                        <Badge className="rounded-md border-none bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 shadow-none dark:bg-emerald-500/10 dark:text-emerald-400">
                                            Paid
                                        </Badge>
                                    </div>

                                    {/* ORDER INFO */}
                                    <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 text-[12px]">
                                        <div>
                                            <p className="text-muted-foreground">Kasir</p>
                                            <p className="font-semibold">{t.user?.name ?? 'Admin'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Tipe</p>
                                            <p className="font-semibold">{orderTypeLabel}</p>
                                        </div>
                                        {t.table_number && (
                                            <div>
                                                <p className="text-muted-foreground">Meja</p>
                                                <p className="font-semibold">{t.table_number}</p>
                                            </div>
                                        )}
                                        {t.customer && (
                                            <div>
                                                <p className="text-muted-foreground">Pelanggan</p>
                                                <p className="font-semibold">
                                                    {t.customer.name}
                                                    {t.customer.phone && (
                                                        <span className="ml-1 text-muted-foreground">
                                                            ({t.customer.phone})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ITEMS */}
                                    <div>
                                        <p className="mb-2 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Item ({t.details.length})
                                        </p>
                                        <div className="space-y-2">
                                            {t.details.map((d, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start justify-between rounded-lg border bg-card p-2.5"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[13px] font-semibold leading-tight">
                                                            {d.product_name ?? d.product?.name ?? '-'}
                                                        </p>
                                                        {d.variant_name && (
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Varian: {d.variant_name}
                                                            </p>
                                                        )}
                                                        {d.notes && (
                                                            <p className="text-[11px] italic text-muted-foreground">
                                                                Catatan: {d.notes}
                                                            </p>
                                                        )}
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            {d.quantity} x {fmt(d.price)}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-[13px] font-bold">
                                                        {fmt(d.subtotal)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* PAYMENT & VOUCHER */}
                                    <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 text-[12px]">
                                        {t.payment_method && (
                                            <div>
                                                <p className="text-muted-foreground">Pembayaran</p>
                                                <p className="font-semibold">{t.payment_method.name}</p>
                                            </div>
                                        )}
                                        {t.voucher && (
                                            <div>
                                                <p className="text-muted-foreground">Voucher</p>
                                                <p className="font-semibold">
                                                    {t.voucher.code}
                                                    <span className="ml-1 text-red-500">
                                                        (-{fmt(t.voucher.discount)})
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                        {(t.redeemed_points ?? 0) > 0 && (
                                            <div>
                                                <p className="text-muted-foreground">Poin Ditukar</p>
                                                <p className="font-semibold">
                                                    {t.redeemed_points?.toLocaleString()} pts
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* FINANCIAL SUMMARY */}
                                    <div className="space-y-1.5 rounded-xl border bg-muted/50 p-3 text-[13px]">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{fmt(t.subtotal_amount)}</span>
                                        </div>
                                        {(t.discount_amount ?? 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Diskon</span>
                                                <span className="text-red-500">-{fmt(t.discount_amount)}</span>
                                            </div>
                                        )}
                                        {(t.tax_amount ?? 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Pajak</span>
                                                <span>{fmt(t.tax_amount)}</span>
                                            </div>
                                        )}
                                        <div className="border-t pt-1.5">
                                            <div className="flex justify-between font-bold">
                                                <span>Total</span>
                                                <span className="text-primary">{fmt(t.total_amount)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tunai</span>
                                            <span>{fmt(t.paid_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Kembali</span>
                                            <span className="font-semibold text-emerald-600">{fmt(t.change_amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* HIDDEN RECEIPT FOR PRINTING */}
            {selectedTransaction && (
                <div style={{ display: 'none' }}>
                    <ReceiptComponent
                        ref={receiptRef}
                        transaction={selectedTransaction}
                        store={storeData}
                    />
                </div>
            )}
        </div>
    );
}
