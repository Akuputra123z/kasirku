import { ArrowRight, CalendarDays, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Stats {
    totalEarnings: number;
    totalSales: number;
    weeklySales: number;
    totalOrders: number;
    earningsGrowth: number | null;
    weeklyGrowth: number | null;
    salesGrowth: number | null;
    ordersGrowth: number | null;
}

interface StatisticsBlockProps {
    stats: Stats;
}

const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val);

const StatisticsBlock = ({ stats }: StatisticsBlockProps) => {
    const badgeVariant = (
        val: number | null,
    ): { text: string; style: string } => {
        if (val === null)
            return {
                text: '—',
                style: 'bg-neutral-200/50 text-muted-foreground',
            };
        const prefix = val >= 0 ? '+' : '';
        return {
            text: `${prefix}${val}%`,
            style: val >= 0 ? 'bg-teal-400/10' : 'bg-red-500/10',
        };
    };

    const mainMetrics = [
        {
            label: 'Earnings',
            value: fmt(stats.totalEarnings),
            badge: badgeVariant(stats.earningsGrowth),
        },
        {
            label: 'Sales',
            value: stats.totalSales.toLocaleString('id-ID'),
            badge: badgeVariant(stats.salesGrowth),
        },
    ];

    const secondaryStats: {
        title: string;
        value: string;
        badge: { text: string; style: string };
    }[] = [
        {
            title: 'Weekly Sales',
            value: fmt(stats.weeklySales),
            badge: badgeVariant(stats.weeklyGrowth),
        },
        {
            title: 'Monthly Orders',
            value: stats.totalOrders.toLocaleString('id-ID'),
            badge: badgeVariant(stats.ordersGrowth),
        },
    ];

    return (
        <div className="grid h-full grid-cols-12 gap-6">
            <div className="col-span-12 h-full xl:col-span-6">
                <Card className="relative h-full rounded-2xl border p-0 ring-0">
                    <CardContent className="p-0">
                        <div className="flex flex-col justify-between gap-9 py-4 ps-6">
                            <div>
                                <p className="text-lg font-medium text-card-foreground">
                                    Analytics Dashboard
                                </p>
                                <p className="text-xs font-normal text-muted-foreground">
                                    Real-time business statistics
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                {mainMetrics.map((metric, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-6"
                                    >
                                        <div>
                                            <p className="text-xs font-normal text-muted-foreground">
                                                {metric.label}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <p className="text-2xl font-medium text-card-foreground">
                                                    {metric.value}
                                                </p>
                                                <Badge
                                                    className={cn(
                                                        'font-normal text-muted-foreground',
                                                        metric.badge.style,
                                                    )}
                                                >
                                                    {metric.badge.text}
                                                </Badge>
                                            </div>
                                        </div>
                                        {index < mainMetrics.length - 1 && (
                                            <Separator
                                                orientation="vertical"
                                                className={'h-12'}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* image */}
                        <img
                            src="https://images.shadcnspace.com/assets/backgrounds/stats-01.webp"
                            alt="user-img"
                            width={211}
                            height={168}
                            className="absolute right-0 bottom-0 hidden sm:block"
                        />
                    </CardContent>
                </Card>
            </div>
            {secondaryStats.map((stat, index) => (
                <div
                    key={index}
                    className="col-span-12 sm:col-span-6 xl:col-span-3"
                >
                    <Card className="rounded-2xl border py-6 ring-0">
                        <CardContent className="flex items-start justify-between px-6">
                            <div className="flex flex-col justify-between gap-5">
                                <div className="flex flex-col gap-1">
                                    <p className="text-lg font-medium text-card-foreground">
                                        {stat.title}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-medium text-card-foreground">
                                            {stat.value}
                                        </p>
                                        <Badge
                                            className={cn(
                                                'font-normal text-muted-foreground',
                                                stat.badge.style,
                                            )}
                                        >
                                            {stat.badge.text}
                                        </Badge>
                                    </div>
                                </div>
                                {/* button */}
                                <Button
                                    variant={'outline'}
                                    className={
                                        'flex h-9 w-fit cursor-pointer items-center gap-1.5 rounded-xl shadow-xs'
                                    }
                                >
                                    <span>See Report</span>
                                    <ArrowRight size={16} />
                                </Button>
                            </div>
                            <div className="rounded-full p-3 outline">
                                {index === 0 ? (
                                    <CalendarDays size={16} />
                                ) : (
                                    <ShoppingBag size={16} />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
};

export default StatisticsBlock;
