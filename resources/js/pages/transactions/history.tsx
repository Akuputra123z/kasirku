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
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Receipt as ReceiptComponent } from '@/components/receipt';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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

interface Customer {
    id: number;
    name: string;
    phone: string | null;
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
    details: {
        product_name?: string;
        product: { name: string } | null;
        quantity: number;
        price: number;
        subtotal: number;
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
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const receiptRef = useRef<HTMLDivElement>(null);

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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                    onClick={() =>
                                                        printTransaction(t)
                                                    }
                                                >
                                                    <Printer className="size-3.5 text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
