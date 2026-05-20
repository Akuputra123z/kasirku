'use client';

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface EarningReportChartProps {
    breakdown?: { category: string; value: number; fill: string }[];
    totalEarnings?: number;
}

const chartConfig = {
    value: { label: 'Value' },
    Revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
    Tax: { label: 'Tax', color: 'var(--color-chart-2)' },
    Discount: { label: 'Discount', color: 'var(--color-chart-3)' },
} satisfies ChartConfig;

const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val);

export default function EarningReportChart({
    breakdown = [],
    totalEarnings = 0,
}: EarningReportChartProps) {
    const pieData = breakdown.map((b) => ({
        browser: b.category,
        visitors: b.value,
        fill: b.fill,
    }));

    const segments = [
        {
            id: 1,
            customer: 'Revenue',
            borderColor: 'bg-chart-1',
            value: breakdown[0]?.value || 0,
        },
        {
            id: 2,
            customer: 'Tax',
            borderColor: 'bg-chart-2',
            value: breakdown[1]?.value || 0,
        },
        {
            id: 3,
            customer: 'Discount',
            borderColor: 'bg-chart-3/50',
            value: breakdown[2]?.value || 0,
        },
    ];

    return (
        <Card className="w-full gap-6 py-6">
            <CardHeader className="px-6">
                <CardTitle>
                    <h4 className="text-lg font-semibold">Earning Reports</h4>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-2 px-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={pieData}
                            dataKey="visitors"
                            nameKey="browser"
                            innerRadius={65}
                            strokeWidth={50}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (
                                        viewBox &&
                                        'cx' in viewBox &&
                                        'cy' in viewBox
                                    ) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 10}
                                                    className="fill-muted-foreground text-sm"
                                                >
                                                    Total
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 15}
                                                    className="fill-foreground text-xl font-medium"
                                                >
                                                    {fmt(totalEarnings)}
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="flex flex-col gap-3">
                    {segments.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        item.borderColor,
                                        'h-4 w-1 rounded-full',
                                    )}
                                ></div>
                                <h6 className="text-sm leading-tight font-medium">
                                    {item.customer}
                                </h6>
                            </div>
                            <div className="flex items-center gap-1">
                                <h6 className="text-sm font-medium">
                                    {item.value}%
                                </h6>
                                <Badge className="bg-teal-400/10 text-muted-foreground shadow-none">
                                    {item.value}%
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
