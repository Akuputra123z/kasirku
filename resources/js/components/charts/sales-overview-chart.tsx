'use client';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface SalesOverviewChartProps {
    chartData?: {
        month: string;
        earning: number;
        profit: number;
        expense: number;
    }[];
    yearlyGrowth?: number;
}

const chartConfig = {
    expense: {
        label: 'Expense',
        color: 'var(--color-chart-3)',
    },
    profit: {
        label: 'Profit',
        color: 'var(--color-chart-2)',
    },
    earning: {
        label: 'Earning',
        color: 'var(--color-chart-1)',
    },
} satisfies ChartConfig;

export default function SalesOverviewChart({
    chartData = [],
    yearlyGrowth = 0,
}: SalesOverviewChartProps) {
    const totalEarning = useMemo(
        () => chartData.reduce((a, b) => a + b.earning, 0),
        [chartData],
    );

    const fmt = (val: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val * 1000000);

    const Countries = [
        { id: 1, title: 'Earning', color: 'bg-chart-1/50' },
        { id: 2, title: 'Profit', color: 'bg-chart-2' },
        { id: 3, title: 'Expense', color: 'bg-chart-3' },
    ];

    return (
        <Card className="w-full gap-6 py-6">
            <CardHeader className="flex flex-col items-start justify-between gap-3 px-6 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg font-medium">
                        Sales Overview
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <h3 className="text-3xl font-medium text-card-foreground">
                            {fmt(totalEarning)}
                        </h3>
                        <Badge
                            className={cn(
                                'shadow-none',
                                yearlyGrowth >= 0
                                    ? 'bg-teal-400/10 text-muted-foreground'
                                    : 'bg-red-500/10 text-red-600',
                            )}
                        >
                            {yearlyGrowth >= 0 ? '+' : ''}
                            {yearlyGrowth}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            vs last 6 months
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {Countries.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'h-2.5 w-2.5 rounded-full',
                                    item.color,
                                )}
                            />
                            <p className="text-sm text-muted-foreground">
                                {item.title}
                            </p>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-6">
                <ChartContainer
                    config={chartConfig}
                    className="h-[300px] w-full"
                >
                    <BarChart data={chartData}>
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            strokeOpacity={0.3}
                        />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                            fontSize={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            fontSize={12}
                            tickFormatter={(value) => `${value}jt`}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar
                            dataKey="expense"
                            stackId="a"
                            fill="var(--color-expense)"
                            radius={[0, 0, 4, 4]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="profit"
                            stackId="a"
                            fill="var(--color-profit)"
                            radius={[0, 0, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="earning"
                            stackId="a"
                            fill="var(--color-earning)"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
