import { Fragment } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ChevronRight, Tags, Package, ChevronLeft, Armchair, Shirt, UtensilsCrossed, Sparkles, Laptop, Flower2, Trophy, LayoutGrid, Store } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
    Armchair, Shirt, UtensilsCrossed, Sparkles, Laptop, Flower2, Trophy, LayoutGrid, Store,
};
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChildCategory {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    keywords_count: number;
}

interface ParentCategory {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    product_count: number;
    children: ChildCategory[];
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    path: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

function CatIcon({ icon }: { icon: string | null }) {
    if (!icon || !iconMap[icon]) return <Tags className="size-5" />;
    const Icon = iconMap[icon];
    return <Icon className="size-5" />;
}

export default function AdminMarketplaceCategories({ categories }: { categories: PaginatedData<ParentCategory> }) {
    function confirmDelete(id: number, name: string) {
        if (!window.confirm(`Hapus kategori "${name}"?`)) return;
        router.delete(`/admin/marketplace/categories/${id}`, {
            preserveState: true,
        });
    }

    function goToPage(url: string | null) {
        if (!url) return;
        router.get(url, {}, { preserveState: true });
    }

    return (
        <>
            <Head title="Admin - Kategori Marketplace" />
            <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Heading
                            title="Kategori Marketplace"
                            description="Kelola kategori produk untuk marketplace"
                        />
                    </div>
                    <Button asChild>
                        <Link href="/admin/marketplace/categories/create">
                            <Plus className="h-4 w-4 mr-1.5" /> Tambah Kategori
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                                    <Tags className="size-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{categories.total}</p>
                                    <p className="text-xs text-slate-500">Total Kategori</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                                    <Tags className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {categories.data.reduce((sum, c) => sum + c.children.length, 0)}
                                    </p>
                                    <p className="text-xs text-slate-500">Sub-kategori</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                                    <Package className="size-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {categories.data.reduce((sum, c) => sum + c.product_count, 0).toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-xs text-slate-500">Produk Tercocok</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                                    <Tags className="size-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {categories.data.reduce((sum, c) => sum + c.children.reduce((s, ch) => s + ch.keywords_count, 0), 0)}
                                    </p>
                                    <p className="text-xs text-slate-500">Total Keyword</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Category Cards */}
                <div className="space-y-4">
                    {categories.data.map((cat) => (
                        <Card key={cat.id} className="overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                                        <CatIcon icon={cat.icon} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{cat.name}</h3>
                                        <p className="text-xs text-slate-400">/{cat.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Package className="size-3.5" /> {cat.product_count} produk</span>
                                        <Badge variant={cat.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                            {cat.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/marketplace/categories/${cat.id}/edit`}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                        {cat.children.length === 0 && (
                                            <Button variant="destructive" size="sm"
                                                onClick={() => confirmDelete(cat.id, cat.name)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {cat.children.length > 0 && (
                                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                        <ChevronRight className="size-3" />
                                        <span>Sub-kategori ({cat.children.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                        {cat.children.map((child) => (
                                            <div key={child.id}
                                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{child.name}</p>
                                                    <p className="text-[10px] text-slate-400">{child.keywords_count} keyword</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                                    <Link href={`/admin/marketplace/categories/${child.id}/edit`}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                {categories.data.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                <Tags className="size-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 mb-4">Belum ada kategori marketplace.</p>
                            <Button asChild>
                                <Link href="/admin/marketplace/categories/create">
                                    <Plus className="h-4 w-4 mr-1" /> Buat Kategori Pertama
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {categories.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Halaman {categories.current_page} dari {categories.last_page} ({categories.total} kategori)
                        </p>
                        <nav className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm"
                                disabled={!categories.prev_page_url}
                                onClick={() => goToPage(categories.prev_page_url)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {categories.links.filter((l, i) => i > 0 && i < categories.links.length - 1).map((link, i) => (
                                <Button key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => goToPage(link.url)}
                                    className={link.active ? 'bg-emerald-600' : ''}>
                                    {link.label}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm"
                                disabled={!categories.next_page_url}
                                onClick={() => goToPage(categories.next_page_url)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </nav>
                    </div>
                )}
            </div>
        </>
    );
}
