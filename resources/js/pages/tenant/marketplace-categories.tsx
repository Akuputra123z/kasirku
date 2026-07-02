'use client';

import { Head } from '@inertiajs/react';
import { Tags, ChevronRight, Store, Info, Armchair, Shirt, UtensilsCrossed, Sparkles, Laptop, Flower2, Trophy, LayoutGrid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, React.ElementType> = {
    Armchair: Armchair, Shirt: Shirt, UtensilsCrossed: UtensilsCrossed,
    Sparkles: Sparkles, Laptop: Laptop, Flower2: Flower2, Trophy: Trophy,
    LayoutGrid: LayoutGrid, Store: Store,
};

function CatIcon({ icon }: { icon: string | null }) {
    if (!icon || !iconMap[icon]) return <Tags className="size-5" />;
    const Icon = iconMap[icon];
    return <Icon className="size-5" />;
}

interface ChildCategory {
    name: string;
    slug: string;
    keywords: string[];
}

interface ParentCategory {
    name: string;
    slug: string;
    icon: string | null;
    children: ChildCategory[];
}

export default function TenantMarketplaceCategories({ categories }: { categories: ParentCategory[] }) {
    return (
        <>
            <Head title="Kategori Marketplace" />
            <div className="px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kategori Marketplace</h1>
                    <p className="text-sm text-slate-500 mt-1">Daftar kategori yang digunakan untuk mengelompokkan produk di halaman marketplace publik.</p>
                </div>

                <Card className="mb-6 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                    <CardContent className="flex items-start gap-3 py-4">
                        <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Produk Anda akan otomatis tercocok ke kategori marketplace berdasarkan <strong>keyword</strong> yang ada di nama produk.
                            Pastikan nama produk mengandung kata kunci yang sesuai agar muncul di kategori yang tepat.
                        </p>
                    </CardContent>
                </Card>

                {categories.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                <Tags className="size-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500">Belum ada kategori marketplace.</p>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {categories.map((cat) => (
                        <Card key={cat.slug} className="overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                                    <CatIcon icon={cat.icon} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white">{cat.name}</h3>
                                    <p className="text-xs text-slate-400">/{cat.slug}</p>
                                </div>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    {cat.children.length} sub-kategori
                                </Badge>
                            </div>
                            {cat.children.length > 0 && (
                                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                        <ChevronRight className="size-3" />
                                        <span>Sub-kategori & Keyword</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {cat.children.map((child) => (
                                            <div key={child.slug}
                                                className="px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{child.name}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {child.keywords.map((kw) => (
                                                        <span key={kw}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
