'use client';

import { Head, Link, router } from '@inertiajs/react';
import { Search, Building2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface StoreItem {
    id: number; slug: string; name: string; city: string | null; province: string | null;
    logo_url: string | null; store_description: string | null; products_count: number;
}

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

export default function Stores({ stores, filters }: { stores: any; filters: { search: string | null } }) {
    const [search, setSearch] = useState(filters?.search || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/stores', { search: search || undefined }, { preserveState: true });
    }

    return (
        <>
            <Head title="Semua Toko - Kasirku Marketplace" />
            <div className="min-h-screen">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="mb-6">
                        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4648d4]">
                            <ArrowLeft className="size-4" /> Kembali
                        </Link>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">Semua Toko</h1>
                    <form onSubmit={handleSearch} className="mt-4 flex max-w-md gap-2">
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari toko..." />
                        <Button type="submit" className="bg-[#4648d4] hover:bg-[#3b3db8]">Cari</Button>
                    </form>

                    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {stores.data?.map((store: StoreItem) => (
                            <Link key={store.id} href={`/store/${store.slug}`}>
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardContent className="flex flex-col items-center p-6 text-center">
                                        <div className="flex size-16 items-center justify-center rounded-full bg-[#e1e0ff]">
                                            {store.logo_url ? (
                                                <img src={store.logo_url} alt={store.name} className="size-16 rounded-full object-cover" />
                                            ) : (
                                                <Building2 className="size-8 text-[#4648d4]" />
                                            )}
                                        </div>
                                        <h3 className="mt-3 font-semibold text-gray-900">{store.name}</h3>
                                        {store.city && <p className="mt-1 text-xs text-gray-500">{store.city}</p>}
                                        <Badge variant="secondary" className="mt-2">{store.products_count} Produk</Badge>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {stores.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {stores.links?.map((link: any, i: number) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={link.active ? 'bg-[#4648d4]' : ''}
                                >
                                    {link.label.includes('Previous') ? <ChevronLeft className="size-4" /> :
                                     link.label.includes('Next') ? <ChevronRight className="size-4" /> :
                                     link.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                <footer className="border-t bg-white px-4 py-12">
                    <div className="mx-auto max-w-7xl text-center text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} Kasirku UMKM. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
