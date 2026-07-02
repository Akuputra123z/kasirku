'use client';

import { Head } from '@inertiajs/react';
import { Activity, ArrowUpRight, Building2, DollarSign, Store, TrendingUp, Users } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

type StatCard = {
    title: string;
    value: number;
    icon: React.ElementType;
    variant: 'default' | 'success' | 'warning' | 'destructive';
    format?: 'number' | 'currency';
};

type MonthlyGrowthPoint = {
    month: string;
    count: number;
};

type ActivityItem = {
    id: number;
    user: string;
    action: string;
    description: string;
    created_at: string;
};

type TenantItem = {
    id: number;
    name: string;
    slug: string;
    status: string;
    created_at: string;
};

export default function AdminDashboard({
    stats,
    monthlyGrowth,
    recentActivity,
    latestTenants,
}: {
    stats: { total: number; active: number; suspended: number; ppobRevenue: number; ppobThisMonth: number; ppobCount: number };
    monthlyGrowth: MonthlyGrowthPoint[];
    recentActivity: ActivityItem[];
    latestTenants: TenantItem[];
}) {
    const statCards: StatCard[] = [
        {
            title: 'Total Toko',
            value: stats.total,
            icon: Building2,
            variant: 'default',
        },
        {
            title: 'Aktif',
            value: stats.active,
            icon: Store,
            variant: 'success',
        },
        {
            title: 'Ditangguhkan',
            value: stats.suspended,
            icon: Users,
            variant: 'destructive',
        },
        {
            title: 'Pendapatan PPOB',
            value: stats.ppobRevenue,
            icon: DollarSign,
            variant: 'default',
            format: 'currency',
        },
        {
            title: 'PPOB Bulan Ini',
            value: stats.ppobThisMonth,
            icon: TrendingUp,
            variant: 'success',
            format: 'currency',
        },
        {
            title: 'Transaksi PPOB',
            value: stats.ppobCount,
            icon: Activity,
            variant: 'warning',
        },
    ];

    const actionLabels: Record<string, string> = {
        'tenant.created': 'Toko Baru',
        'tenant.activated': 'Diaktifkan',
        'tenant.suspended': 'Ditangguhkan',
        'tenant.entered': 'Masuk Toko',
        'tenant.updated': 'Diperbarui',
        'tenant.reset': 'Reset DB',
        'tenant.bulk_activate': 'Aktivasi Massal',
        'tenant.bulk_suspend': 'Tangguhkan Massal',
    };

    const maxCount = Math.max(...monthlyGrowth.map((p) => p.count), 1);

    return (
        <>
            <Head title="Admin - Dashboard" />
            <div className="px-4 py-6">
                <Heading
                    title="Platform Dashboard"
                    description="Overview of your multi-tenant platform"
                />

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        const variantStyles = {
                            default: 'from-blue-500 to-blue-600',
                            success: 'from-emerald-500 to-emerald-600',
                            warning: 'from-amber-500 to-amber-600',
                            destructive: 'from-red-500 to-red-600',
                        };

                        return (
                            <Card key={card.title}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {card.title}
                                    </CardTitle>
                                    <div
                                        className={`rounded-lg bg-gradient-to-br p-2 ${variantStyles[card.variant]}`}
                                    >
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">
                                        {card.format === 'currency' ? formatPrice(card.value) : card.value}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4" />
                                Pertumbuhan Toko (12 Bulan)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {monthlyGrowth.length > 0 ? (
                                <div className="flex items-end gap-1">
                                    {monthlyGrowth.map((point) => (
                                        <div
                                            key={point.month}
                                            className="group relative flex flex-1 flex-col items-center"
                                        >
                                            <div
                                                className="w-full rounded-t bg-gradient-to-t from-blue-500/80 to-blue-400/60 transition-all hover:from-blue-500"
                                                style={{
                                                    height: `${(point.count / maxCount) * 120}px`,
                                                }}
                                            />
                                            <span className="mt-1 text-[10px] text-muted-foreground">
                                                {point.month.split(' ')[0]}
                                            </span>
                                            <div className="absolute -top-6 hidden rounded bg-popover px-2 py-1 text-xs whitespace-nowrap shadow group-hover:block">
                                                {point.month}: {point.count}{' '}
                                                toko
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Belum ada data pertumbuhan.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <ArrowUpRight className="h-4 w-4" />
                                Toko Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {latestTenants.length > 0 ? (
                                <div className="space-y-3">
                                    {latestTenants.map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {t.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t.slug}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        t.status === 'active'
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {t.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {t.created_at}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Belum ada toko terdaftar.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4" />
                            Aktivitas Terbaru
                        </CardTitle>
                        <CardDescription>
                            10 aksi terakhir di platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-start justify-between border-b pb-2 last:border-0"
                                    >
                                        <div>
                                            <span className="text-sm font-medium">
                                                {log.user}
                                            </span>
                                            <span className="mx-1.5 text-muted-foreground">
                                                {actionLabels[log.action] ??
                                                    log.action}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {log.description}
                                            </span>
                                        </div>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {log.created_at}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Belum ada aktivitas tercatat.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Admin', href: home() }],
};
