'use client';

import { Tags } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import React, { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface CategorySales {
    name: string;
    total_sales: number;
    total_trx: number;
}

interface WidgetProps {
    categories?: CategorySales[];
}

const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val);

const colors = [
    'bg-blue-500/20',
    'bg-teal-400/20',
    'bg-orange-400/20',
    'bg-red-500/20',
    'bg-violet-400/20',
];

const SalesByCountryWidget = ({ categories = [] }: WidgetProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <Card className="gap-6 py-6">
            <CardHeader className="flex items-center justify-between px-6">
                <CardTitle className="text-lg font-medium text-foreground">
                    Sales by Category
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <motion.div
                    ref={ref}
                    className="flex flex-col gap-3"
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.2,
                            },
                        },
                    }}
                >
                    {categories.length > 0 ? (
                        categories.map((item, index) => (
                            <React.Fragment key={index}>
                                <motion.div
                                    className="flex items-center gap-3 px-6"
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 },
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 24,
                                    }}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <motion.div
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full',
                                            colors[index % colors.length],
                                        )}
                                        whileHover={{ rotate: 5, scale: 1.1 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                        }}
                                    >
                                        <Tags width={16} height={16} />
                                    </motion.div>
                                    <div className="flex flex-1 items-center justify-between">
                                        <div>
                                            <h5 className="text-base font-medium text-foreground">
                                                {fmt(item.total_sales)}
                                            </h5>
                                            <p className="text-sm font-normal tracking-wide text-muted-foreground">
                                                {item.name}
                                            </p>
                                        </div>
                                        <Badge className="bg-teal-400/10 text-muted-foreground">
                                            {item.total_trx} trx
                                        </Badge>
                                    </div>
                                </motion.div>
                                {index < categories.length - 1 && <Separator />}
                            </React.Fragment>
                        ))
                    ) : (
                        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                            No category data available yet.
                        </p>
                    )}
                </motion.div>
            </CardContent>
        </Card>
    );
};

export default SalesByCountryWidget;
