'use client';

import { Head, Link, usePage, router } from '@inertiajs/react';
import { Package, Search, MapPin, Phone, ChevronLeft, ChevronRight, Building2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Variant { id: number; name: string; additional_price: number; stock: number; }
interface ProductItem { id: number; name: string; description: string | null; display_price: number; image_url: string | null; stock: number; category: string | null; has_variants: boolean; variants: Variant[]; }
interface Category { name: string; slug: string; }

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

export default function StorePage({ store, products, categories, filters }: { store: any; products: any; categories: Category[]; filters: any }) {
    const { auth } = usePage().props as any;
    const isAuth = !!auth?.user;
    const [search, setSearch] = useState(filters?.search || '');
    const [category, setCategory] = useState(filters?.category || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(`/store/${store.slug}`, { search: search || undefined, category: category || undefined }, { preserveState: true });
    }

    function handleCategoryChange(val: string) {
        setCategory(val);
        router.get(`/store/${store.slug}`, { category: val !== 'all' ? val : undefined, search: search || undefined }, { preserveState: true });
    }

    function addToCart(productId: number, variantId?: number) {
        if (!isAuth) {
            router.visit(`/customer/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        if (!auth?.user?.has_customer_account) {
            toast.error('Hanya akun pembeli yang bisa menambahkan ke keranjang');
            return;
        }
        router.post('/cart/add', { product_id: productId, product_variant_id: variantId || null, quantity: 1 }, {
            onSuccess: () => toast.success('Ditambahkan ke keranjang'),
        });
    }

    return (
        <>
            <Head title={`${store.name} - Kasirku Marketplace`} />
            <div className="min-h-screen bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <Link href="/stores" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4648d4]">
                        <ChevronLeft className="size-4" /> Semua Toko
                    </Link>

                    <div className="flex items-start gap-6 rounded-xl border bg-gray-50 p-6">
                        <div className="flex size-20 items-center justify-center rounded-full bg-[#e1e0ff] shrink-0">
                            {store.logo_url ? (
                                <img src={store.logo_url} alt={store.name} className="size-20 rounded-full object-cover" />
                            ) : (
                                <Building2 className="size-10 text-[#4648d4]" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
                            {store.description && <p className="mt-2 text-gray-600">{store.description}</p>}
                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                                {store.city && <span className="flex items-center gap-1"><MapPin className="size-4" /> {store.city}, {store.province}</span>}
                                {store.phone && <span className="flex items-center gap-1"><Phone className="size-4" /> {store.phone}</span>}
                            </div>
                            {isAuth && auth?.user?.has_customer_account && (
                                <div className="mt-3">
                                    <Link
                                        href={`/customer/conversations/start/${store.slug}`}
                                        method="post"
                                        as="button"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                                    >
                                        <MessageSquare className="size-4" /> Chat
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." />
                            <Button type="submit" className="bg-[#4648d4] hover:bg-[#3b3db8]">Cari</Button>
                        </form>
                        <Select value={category} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((c: Category) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {products.data?.map((product: ProductItem) => (
                            <Card key={product.id} className="h-full transition-shadow hover:shadow-md">
                                <CardContent className="p-4">
                                    <Link href={`/store/${store.slug}/products/${product.slug}`}>
                                        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-gray-300"><Package className="size-12" /></div>
                                            )}
                                        </div>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                                        <p className="mt-1 font-semibold text-[#4648d4]">{formatPrice(product.display_price)}</p>
                                    </Link>
                                    <Button size="sm" className="mt-2 w-full bg-[#fea619] text-[#684000] hover:bg-[#ffb95f]" onClick={() => addToCart(product.id)}>
                                        + Keranjang
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {products.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {products.links?.map((link: any, i: number) => (
                                <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={link.active ? 'bg-[#4648d4]' : ''}>
                                    {link.label.includes('Previous') ? <ChevronLeft className="size-4" /> :
                                     link.label.includes('Next') ? <ChevronRight className="size-4" /> : link.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
