import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    LayoutGrid, Shirt, UtensilsCrossed, Armchair, Sparkles, Laptop, Flower2, Trophy,
    ChevronRight, ChevronLeft, Filter, ChevronDown, BadgeCheck, MapPin,
    Store, ShoppingBag, Search,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
    LayoutGrid, Shirt, UtensilsCrossed, Armchair, Sparkles, Laptop, Flower2, Trophy, Store,
};

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

interface CategoryNode {
    name: string;
    slug: string;
    icon: string | null;
    children: { name: string; slug: string }[];
}

interface ProductItem {
    id: number; name: string; slug: string; display_price: number; image_url: string | null;
    stock: number; category: string | null;
    tenant: { slug: string; name: string; city: string | null };
}

interface PaginatedData<T> {
    data: T[]; current_page: number; last_page: number; per_page: number; total: number;
    path: string; prev_page_url: string | null; next_page_url: string | null;
}

export default function Products({ products, categories, totalProducts, filters }: {
    products: PaginatedData<ProductItem>;
    categories: CategoryNode[];
    totalProducts: number;
    filters: { search: string | null; category: string | null; sort: string; price_min: string | null; price_max: string | null };
}) {
    const [search, setSearch] = useState(filters?.search || '');
    const [activeCategory, setActiveCategory] = useState(filters?.category || '');
    const [sortBy, setSortBy] = useState(filters?.sort || 'latest');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showAllLocations, setShowAllLocations] = useState(false);
    const [priceMin, setPriceMin] = useState(filters?.price_min || '');
    const [priceMax, setPriceMax] = useState(filters?.price_max || '');

    const activeParent = categories.find((c) =>
        c.slug === activeCategory || c.children.some((ch) => ch.slug === activeCategory)
    );

    const activeChild = activeParent?.children.find((ch) => ch.slug === activeCategory);

    const categoryDisplayName = activeChild
        ? `${activeParent!.name} / ${activeChild.name}`
        : activeParent?.name || '';

    function applyFilters(params: Record<string, string | undefined>) {
        router.get('/all-products', params, { preserveState: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters({ search: search.trim() || undefined, category: activeCategory || undefined, sort: sortBy || undefined });
    }

    function selectCategory(slug: string) {
        setActiveCategory(slug);
        applyFilters({ category: slug || undefined, search: filters?.search || undefined, sort: sortBy || undefined });
    }

    function changeSort(val: string) {
        setSortBy(val);
        applyFilters({ sort: val, search: filters?.search || undefined, category: activeCategory || undefined });
    }

    function applyPriceFilter() {
        applyFilters({
            price_min: priceMin || undefined,
            price_max: priceMax || undefined,
            search: filters?.search || undefined,
            category: activeCategory || undefined,
            sort: sortBy || undefined,
        });
    }

    return (
        <>
            <Head title="Semua Produk - Kasirku Marketplace" />

            {/* Parent Category Nav */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-3">
                <div className="max-w-7xl mx-auto px-4 md:px-20 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center gap-2 min-w-max">
                        <button onClick={() => selectCategory('')}
                            className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${!activeCategory ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                            <LayoutGrid className="size-5" />
                            <span className="text-[11px]">Semua</span>
                        </button>
                        {categories.map((cat) => {
                            const Icon = (cat.icon && iconMap[cat.icon]) || Store;
                            const isActive = activeParent?.slug === cat.slug;
                            return (
                                <button key={cat.slug} onClick={() => selectCategory(cat.slug)}
                                    className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all group ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                    <Icon className={`size-5 ${!isActive && 'group-hover:text-emerald-500 transition-colors'}`} />
                                    <span className="text-[11px]">{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Child Category Bar */}
            {activeParent && activeParent.children.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 md:px-20 py-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-center gap-2 min-w-max">
                            {activeParent.children.map((child) => {
                                const isActiveChild = activeChild?.slug === child.slug;
                                return (
                                    <button key={child.slug} onClick={() => selectCategory(child.slug)}
                                        className={`whitespace-nowrap text-sm px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                                            isActiveChild
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600'
                                        }`}>
                                        {child.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumb + Search */}
            <div className="max-w-7xl mx-auto px-4 md:px-20 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <Link href="/" className="hover:text-[#4648d4] transition-colors">Kategori</Link>
                    <ChevronRight className="size-3.5 mx-1" />
                    <Link href="/all-products" className="hover:text-emerald-600 transition-colors">Semua Produk</Link>
                    {activeParent && (
                        <>
                            <ChevronRight className="size-3.5 mx-1" />
                            <span className="font-semibold text-slate-800 dark:text-white">{categoryDisplayName}</span>
                        </>
                    )}
                </div>
                <form onSubmit={handleSearch} className="flex items-center gap-2 sm:max-w-xs w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Cari produk..." type="text" />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                        Cari
                    </button>
                </form>
            </div>

            {/* Mobile filter toggle */}
            <div className="lg:hidden max-w-7xl mx-auto px-4 md:px-20 mb-4">
                <button onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 shadow-sm w-full">
                    <Filter className="size-4 text-emerald-600" /> Filter
                    <ChevronDown className={`size-4 ml-auto transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-20 pb-20">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className={`w-full lg:w-64 flex-shrink-0 space-y-8 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:sticky lg:top-28">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Filter className="size-4 text-emerald-600" /> Filter
                                </h3>
                                <button onClick={() => { setActiveCategory(''); setSearch(''); setPriceMin(''); setPriceMax(''); router.get('/all-products', {}, { preserveState: true }); }}
                                    className="text-xs text-emerald-600 font-semibold hover:underline">Reset</button>
                            </div>

                            {/* Category Tree */}
                            <div className="mb-8">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Kategori</h4>
                                <div className="space-y-1">
                                    <button onClick={() => selectCategory('')}
                                        className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!activeCategory ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        Semua Produk
                                    </button>
                                    {categories.map((cat) => {
                                        const isParentActive = activeParent?.slug === cat.slug;
                                        const isParentSelected = activeCategory === cat.slug;
                                        return (
                                            <div key={cat.slug}>
                                                <button onClick={() => selectCategory(cat.slug)}
                                                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${isParentSelected ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                    <span>{cat.name}</span>
                                                    {cat.children.length > 0 && (
                                                        <ChevronRight className={`size-3.5 transition-transform ${isParentActive && 'rotate-90'}`} />
                                                    )}
                                                </button>
                                                {isParentActive && cat.children.length > 0 && (
                                                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-emerald-100 dark:border-emerald-900/40 pl-2">
                                                        {cat.children.map((child) => (
                                                            <button key={child.slug} onClick={() => selectCategory(child.slug)}
                                                                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${activeChild?.slug === child.slug ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                                {child.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Rentang Harga</h4>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs flex-1">
                                        <span className="text-slate-400 mr-1">Rp</span>
                                        <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)}
                                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-700 dark:text-white font-medium" type="number" placeholder="Min" />
                                    </div>
                                    <span className="text-slate-400">-</span>
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs flex-1">
                                        <span className="text-slate-400 mr-1">Rp</span>
                                        <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
                                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-700 dark:text-white font-medium" type="number" placeholder="Max" />
                                    </div>
                                </div>
                                <button onClick={applyPriceFilter}
                                    className="w-full py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                                    Terapkan
                                </button>
                            </div>

                            {/* Location */}
                            <div className="mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Lokasi</h4>
                                <div className="space-y-3">
                                    {(['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta']).slice(0, showAllLocations ? 4 : 3).map((loc) => (
                                        <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox"
                                                onChange={() => applyFilters({ location: loc.toLowerCase(), search: filters?.search || undefined, category: activeCategory || undefined, sort: sortBy || undefined })}
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 transition-colors">{loc}</span>
                                        </label>
                                    ))}
                                    <button onClick={() => setShowAllLocations(!showAllLocations)}
                                        className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                        {showAllLocations ? 'Tutup' : 'Lihat Selengkapnya'} <ChevronDown className={`size-3 transition-transform ${showAllLocations ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Seller Type */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Jenis Penjual</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" defaultChecked
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                        <div className="flex items-center gap-2">
                                            <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">
                                                <BadgeCheck className="size-3 mr-0.5" /> UMKM
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-400">Verified UMKM</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 transition-colors">Official Store</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                                Menampilkan <span className="text-emerald-600">{products.total?.toLocaleString('id-ID') || 0}</span> produk
                                {categoryDisplayName && ` untuk "${categoryDisplayName}"`}
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Urutkan:</span>
                                <select value={sortBy} onChange={(e) => changeSort(e.target.value)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-emerald-500 focus:border-emerald-500 py-2 pl-3 pr-8 shadow-sm">
                                    <option value="latest">Terbaru</option>
                                    <option value="price_low">Harga Terendah</option>
                                    <option value="price_high">Harga Tertinggi</option>
                                </select>
                            </div>
                        </div>

                        {/* Product cards */}
                        {products.data?.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <ShoppingBag className="size-10 text-slate-300" />
                                </div>
                                <p className="mt-4 text-slate-500">Tidak ada produk ditemukan</p>
                                <Link href="/all-products" className="mt-4 inline-block text-sm text-emerald-600 font-semibold hover:underline">Lihat semua produk</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {products.data.map((p) => (
                                    <Link key={p.id} href={`/store/${p.tenant.slug}/products/${p.slug}`}
                                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden group h-full flex flex-col transition-all duration-300 hover:-translate-y-1">
                                        <div className="relative overflow-hidden aspect-square bg-slate-50 dark:bg-slate-800">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-300">
                                                    <ShoppingBag className="size-12" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2">
                                                <span className="bg-white/95 backdrop-blur text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center shadow-sm">
                                                    <BadgeCheck className="size-3 mr-1 text-emerald-600" /> UMKM
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 md:p-4 flex flex-col flex-1">
                                            {p.category && (
                                                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-1">{p.category}</div>
                                            )}
                                            <h3 className="text-sm font-medium leading-snug line-clamp-2 text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                                                {p.name}
                                            </h3>
                                            <div className="mt-auto pt-2">
                                                <div className="text-emerald-600 font-bold text-base md:text-lg mb-1">
                                                    {formatPrice(p.display_price)}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] flex items-center gap-1">
                                                        <Store className="size-3 shrink-0" />
                                                        <span className="truncate">{p.tenant.name}</span>
                                                    </span>
                                                    {p.tenant.city && (
                                                        <span className="text-[10px] text-slate-400 truncate max-w-[80px] flex items-center gap-0.5">
                                                            <MapPin className="size-3 shrink-0" />
                                                            {p.tenant.city}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {products.last_page > 1 && (
                            <div className="mt-12 flex justify-center">
                                <nav className="flex items-center gap-2">
                                    <button onClick={() => products.prev_page_url && router.get(products.prev_page_url)}
                                        disabled={!products.prev_page_url}
                                        className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 transition-all disabled:opacity-50">
                                        <ChevronLeft className="size-5" />
                                    </button>
                                    {Array.from({ length: Math.min(products.last_page, 7) }, (_, i) => {
                                        let page: number;
                                        const total = products.last_page;
                                        const current = products.current_page;
                                        if (total <= 7) {
                                            page = i + 1;
                                        } else if (current <= 4) {
                                            page = i + 1;
                                        } else if (current >= total - 3) {
                                            page = total - 6 + i;
                                        } else {
                                            page = current - 3 + i;
                                        }
                                        return (
                                            <button key={page} onClick={() => router.get(products.path + '?page=' + page)}
                                                className={`size-10 flex items-center justify-center rounded-xl font-medium transition-all ${
                                                    products.current_page === page
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
                                                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600'
                                                }`}>
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button onClick={() => products.next_page_url && router.get(products.next_page_url)}
                                        disabled={!products.next_page_url}
                                        className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 transition-all disabled:opacity-50">
                                        <ChevronRight className="size-5" />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
