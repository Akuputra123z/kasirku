'use client';

import { Icon } from '@iconify/react';
import { Head } from '@inertiajs/react';
import { motion } from 'motion/react';
import React, { Suspense, lazy } from 'react';

// Lazy Load
const EarningReportChart = lazy(
    () => import('@/components/charts/earning-report-chart'),
);
const SalesOverviewChart = lazy(
    () => import('@/components/charts/sales-overview-chart'),
);
const StatisticsBlock = lazy(() => import('@/components/charts/statistics'));
const TopProductTable = lazy(
    () => import('@/components/charts/top-product-table'),
);
const SalesByCountryWidget = lazy(
    () => import('@/components/charts/salesbycountrywidget'),
);

// UI
import { Card, CardContent } from '@/components/ui/card';

// Skeleton
const ChartSkeleton = () => (
    <div className="h-[320px] w-full animate-pulse rounded-2xl bg-muted" />
);

interface Props {
    stats: {
        totalEarnings: number;
        totalSales: number;
        weeklySales: number;
        totalOrders: number;
        earningsGrowth: number;
        weeklyGrowth: number;
        salesGrowth: number;
        ordersGrowth: number;
        yearlyGrowth: number;
    };
    monthlyChart: {
        month: string;
        earning: number;
        profit: number;
        expense: number;
    }[];
    earningBreakdown: { category: string; value: number; fill: string }[];
    topProducts: {
        product_name: string;
        category_name: string;
        image: string | null;
        total_qty: number;
        total_sales: number;
        stock: number;
        progress: number;
    }[];
    salesByCategory: { name: string; total_sales: number; total_trx: number }[];
}

const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val);

export default function Dashboard({
    stats,
    monthlyChart,
    earningBreakdown,
    topProducts,
    salesByCategory,
}: Props) {
    return (
        <div className="min-h-screen space-y-5 bg-muted/30 p-4 md:p-5">
            <Head title="Dashboard" />

            {/* HEADER */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of your business performance
                    </p>
                </div>

                <button className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted">
                    <Icon icon="solar:calendar-bold-duotone" width={18} />
                    {new Date().toLocaleDateString('id-ID', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </button>
            </motion.div>

            {/* STATS */}
            <Suspense
                fallback={
                    <div className="h-24 animate-pulse rounded-xl bg-muted" />
                }
            >
                <div className="grid items-stretch">
                    <StatisticsBlock stats={stats} />
                </div>
            </Suspense>

            {/* GRID */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* LEFT */}
                <div className="space-y-6 lg:col-span-8">
                    <Suspense fallback={<ChartSkeleton />}>
                        <SalesOverviewChart
                            chartData={monthlyChart}
                            yearlyGrowth={stats.yearlyGrowth}
                        />
                    </Suspense>

                    <Card className="overflow-hidden rounded-[2rem] border-none bg-card shadow-sm">
                        <CardContent className="p-0">
                            <Suspense
                                fallback={
                                    <div className="space-y-4 p-10">
                                        <div className="h-6 w-1/4 animate-pulse rounded-lg bg-muted" />
                                        <div className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
                                        <div className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
                                    </div>
                                }
                            >
                                <TopProductTable products={topProducts} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT */}
                <div className="space-y-6 lg:col-span-4">
                    <Suspense fallback={<ChartSkeleton />}>
                        <EarningReportChart
                            breakdown={earningBreakdown}
                            totalEarnings={stats.totalEarnings}
                        />
                    </Suspense>

                    <Suspense fallback={<ChartSkeleton />}>
                        <SalesByCountryWidget categories={salesByCategory} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
