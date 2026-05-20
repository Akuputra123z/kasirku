'use client';

import { Package, SearchIcon } from 'lucide-react';
import * as React from 'react';
import FloatingPill from '@/components/charts/pagination';
import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Product {
    product_name: string;
    category_name: string;
    image: string | null;
    total_qty: number;
    total_sales: number;
    stock: number;
    progress: number;
}

interface TopProductTableProps {
    products?: Product[];
}

const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val);

const TopProductTable = ({ products = [] }: TopProductTableProps) => {
    const [activePage, setActivePage] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const itemsPerPage = 4;

    const filtered = products.filter((p) =>
        p.product_name.toLowerCase().includes(search.toLowerCase()),
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

    const colors = [
        {
            bg: 'bg-orange-400/20',
            text: 'text-orange-400',
            progress: '**:data-[slot=progress-indicator]:bg-orange-400',
        },
        {
            bg: 'bg-sky-400/20',
            text: 'text-sky-400',
            progress: '**:data-[slot=progress-indicator]:bg-blue-500',
        },
        {
            bg: 'bg-teal-400/20',
            text: 'text-teal-400',
            progress: '**:data-[slot=progress-indicator]:bg-teal-400',
        },
        {
            bg: 'bg-red-500/20',
            text: 'text-red-500',
            progress: '**:data-[slot=progress-indicator]:bg-red-500',
        },
        {
            bg: 'bg-violet-400/20',
            text: 'text-violet-400',
            progress: '**:data-[slot=progress-indicator]:bg-violet-400',
        },
        {
            bg: 'bg-amber-400/20',
            text: 'text-amber-400',
            progress: '**:data-[slot=progress-indicator]:bg-amber-400',
        },
        {
            bg: 'bg-emerald-400/20',
            text: 'text-emerald-400',
            progress: '**:data-[slot=progress-indicator]:bg-emerald-400',
        },
        {
            bg: 'bg-pink-400/20',
            text: 'text-pink-400',
            progress: '**:data-[slot=progress-indicator]:bg-pink-400',
        },
    ];

    return (
        <div className="flex h-full w-full flex-col pt-0 pb-0">
            <CardHeader className="items-center justify-between px-6 py-5 sm:flex">
                <div>
                    <CardTitle className="leading-normal">
                        Top Products
                    </CardTitle>
                    <CardDescription>
                        Best selling products by revenue
                    </CardDescription>
                </div>
                <InputGroup className="h-9 w-fit rounded-md">
                    <InputGroupInput
                        placeholder="Search"
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearch(e.target.value)
                        }
                    />
                    <InputGroupAddon>
                        <SearchIcon size={18} />
                    </InputGroupAddon>
                </InputGroup>
            </CardHeader>
            <CardContent className="flex-1 px-0">
                <div className="overflow-x-auto">
                    <Table className="min-w-2xl">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent!">
                                <TableHead className="p-3 ps-6">#</TableHead>
                                <TableHead className="p-2">Product</TableHead>
                                <TableHead className="p-2">Sales</TableHead>
                                <TableHead className="p-2">Qty Sold</TableHead>
                                <TableHead className="p-2">Stock</TableHead>
                                <TableHead className="p-2">
                                    Performance
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="dark:divide-darkborder divide-y divide-border">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, index) => {
                                    const color = colors[index % colors.length];

                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="p-3 ps-6 whitespace-nowrap">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {startIndex + index + 1}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn(
                                                            'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full',
                                                            color.bg,
                                                        )}
                                                    >
                                                        {item.image ? (
                                                            <img
                                                                src={`/storage/${item.image}`}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <Package
                                                                width={18}
                                                                height={18}
                                                                className={cn(
                                                                    color.text,
                                                                )}
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h6 className="text-sm font-medium">
                                                            {item.product_name}
                                                        </h6>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.category_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <p className="text-sm font-medium text-foreground">
                                                    {fmt(item.total_sales)}
                                                </p>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <p className="text-sm text-foreground">
                                                    {item.total_qty} unit
                                                </p>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <p className="text-sm text-muted-foreground">
                                                    {item.stock} left
                                                </p>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Progress
                                                    value={item.progress}
                                                    className={cn(
                                                        'h-1.5 w-full [&>div]:h-1.5',
                                                        color.progress,
                                                    )}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No product data available yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {totalPages > 1 && (
                <div className="flex items-center justify-center border-t border-border px-6 py-4">
                    <FloatingPill
                        activePage={activePage}
                        setActivePage={setActivePage}
                        totalPages={totalPages}
                    />
                </div>
            )}
        </div>
    );
};

export default TopProductTable;
