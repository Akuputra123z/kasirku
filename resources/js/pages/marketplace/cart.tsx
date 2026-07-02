'use client';

import { Head, Link, router } from '@inertiajs/react';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, ChevronLeft, Store, Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface CartItem {
    id: number;
    product_id: number;
    product_slug: string;
    product_name: string;
    product_image: string | null;
    variant_name: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    stock: number;
    store_name: string;
    store_slug: string;
}

interface StoreGroup {
    store_name: string;
    store_slug: string;
    items: CartItem[];
    subtotal: number;
}

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

function groupByStore(items: CartItem[]): StoreGroup[] {
    const map = new Map<string, StoreGroup>();
    for (const item of items) {
        if (!map.has(item.store_slug)) {
            map.set(item.store_slug, { store_name: item.store_name, store_slug: item.store_slug, items: [], subtotal: 0 });
        }
        const group = map.get(item.store_slug)!;
        group.items.push(item);
        group.subtotal += item.subtotal;
    }
    return Array.from(map.values());
}

function QuantityControl({ value, onUpdate, max }: { value: number; onUpdate: (v: number) => void; max: number }) {
    return (
        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white">
            <button
                onClick={() => onUpdate(value - 1)}
                disabled={value <= 1}
                className="flex size-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 rounded-l-lg"
            >
                <Minus className="size-3.5" />
            </button>
            <span className="flex h-8 w-10 items-center justify-center border-x border-gray-200 text-sm font-medium text-gray-900 tabular-nums">
                {value}
            </span>
            <button
                onClick={() => onUpdate(value + 1)}
                disabled={value >= max}
                className="flex size-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 rounded-r-lg"
            >
                <Plus className="size-3.5" />
            </button>
        </div>
    );
}

export default function Cart({ cartItems, total, itemCount }: { cartItems: CartItem[]; total: number; itemCount: number }) {
    const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(cartItems.map(i => i.id)));
    const storeGroups = groupByStore(cartItems);

    const selectedItems = cartItems.filter(i => selectedIds.has(i.id));
    const selectedCount = selectedItems.length;
    const selectedTotal = selectedItems.reduce((s, i) => s + i.subtotal, 0);
    const allSelected = selectedIds.size === cartItems.length && cartItems.length > 0;

    function toggleSelect(id: number) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(cartItems.map(i => i.id)));
        }
    }

    function updateQuantity(cartId: number, qty: number) {
        if (qty < 1) return;
        router.post(`/cart/${cartId}/update`, { quantity: qty }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Keranjang diperbarui'),
        });
    }

    function removeItem(cartId: number) {
        setRemovingIds(prev => new Set(prev).add(cartId));
        router.delete(`/cart/${cartId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Item dihapus');
                setSelectedIds(prev => { const n = new Set(prev); n.delete(cartId); return n; });
                setRemovingIds(prev => { const n = new Set(prev); n.delete(cartId); return n; });
            },
            onError: () => setRemovingIds(prev => { const n = new Set(prev); n.delete(cartId); return n; }),
        });
    }

    function proceedToCheckout() {
        if (selectedIds.size === 0) {
            toast.error('Pilih minimal satu produk');
            return;
        }
        const ids = Array.from(selectedIds).join(',');
        router.visit(`/checkout?selected=${ids}`);
    }

    if (cartItems.length === 0) {
        return (
            <>
                <Head title="Keranjang - Kasirku Marketplace" />
                <div className="min-h-screen bg-gray-50">
                    <div className="mx-auto max-w-4xl px-4 py-8">
                        <div className="mt-16 flex flex-col items-center justify-center text-center">
                            <div className="flex size-24 items-center justify-center rounded-full bg-gray-100">
                                <ShoppingCart className="size-12 text-gray-300" />
                            </div>
                            <h2 className="mt-6 text-xl font-semibold text-gray-900">Keranjang Kosong</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Belum ada produk yang ditambahkan ke keranjang
                            </p>
                            <Link href="/stores">
                                <Button className="mt-6 bg-[#4648d4] hover:bg-[#3b3db8]">
                                    <Store className="mr-2 size-4" /> Jelajahi Toko
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Keranjang - Kasirku Marketplace" />
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-6xl px-4 py-6 pb-24 lg:pb-6">
                    {/* Back */}
                    <Link
                        href="/stores"
                        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4648d4]"
                    >
                        <ChevronLeft className="size-4" /> Kembali Belanja
                    </Link>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        {/* Left — items */}
                        <div className="flex-1">
                            <div className="mb-4 flex items-center justify-between">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Keranjang Belanja
                                    <span className="ml-2 text-base font-normal text-gray-400">({itemCount} item)</span>
                                </h1>
                            </div>

                            {/* Select All bar */}
                            <div className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                                <label className="flex cursor-pointer items-center gap-3 text-sm">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={toggleSelectAll}
                                        className="size-5 rounded-md data-[state=checked]:bg-[#4648d4] data-[state=checked]:border-[#4648d4]"
                                    />
                                    <span className="font-medium text-gray-700">Pilih Semua</span>
                                </label>
                                <span className="text-sm text-gray-400">
                                    {selectedCount > 0 ? (
                                        <span className="font-medium text-[#4648d4]">{selectedCount} produk dipilih</span>
                                    ) : (
                                        'Belum ada yang dipilih'
                                    )}
                                </span>
                            </div>

                            <div className="space-y-5">
                                {storeGroups.map((group) => (
                                    <div key={group.store_slug}>
                                        {/* Store header */}
                                        <Link
                                            href={`/store/${group.store_slug}`}
                                            className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#4648d4]"
                                        >
                                            <Store className="size-4" />
                                            {group.store_name}
                                        </Link>

                                        {group.items.map((item, idx) => {
                                            const isSelected = selectedIds.has(item.id);
                                            const isRemoving = removingIds.has(item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`relative transition-all duration-200 ${
                                                        idx < group.items.length - 1 ? 'mb-3' : ''
                                                    } ${isRemoving ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    {/* Left accent border */}
                                                    <div
                                                        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-colors duration-200 ${
                                                            isSelected ? 'bg-[#4648d4]' : 'bg-transparent'
                                                        }`}
                                                    />

                                                    <Card
                                                        className={`overflow-hidden transition-all duration-200 cursor-pointer ${
                                                            isSelected
                                                                ? 'border-[#4648d4]/30 bg-[#4648d4]/[0.02] shadow-sm'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}
                                                        onClick={() => toggleSelect(item.id)}
                                                    >
                                                        <CardContent className="flex items-center gap-4 p-4">
                                                            {/* Checkbox */}
                                                            <div className="shrink-0">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleSelect(item.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="size-5 rounded-md data-[state=checked]:bg-[#4648d4] data-[state=checked]:border-[#4648d4]"
                                                                />
                                                            </div>

                                                            {/* Image */}
                                                            <Link
                                                                href={`/store/${item.store_slug}/products/${item.product_slug ?? item.product_id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="size-20 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                                                            >
                                                                {item.product_image ? (
                                                                    <img src={item.product_image} alt={item.product_name} className="size-full object-cover" />
                                                                ) : (
                                                                    <div className="flex size-full items-center justify-center text-gray-300">
                                                                        <Package className="size-8" />
                                                                    </div>
                                                                )}
                                                            </Link>

                                                            {/* Details */}
                                                            <div className="flex-1 min-w-0">
                                                                <Link
                                                                    href={`/store/${item.store_slug}/products/${item.product_slug ?? item.product_id}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-[#4648d4]"
                                                                >
                                                                    {item.product_name}
                                                                </Link>
                                                                {item.variant_name && (
                                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                                        Varian: {item.variant_name}
                                                                    </p>
                                                                )}
                                                                <p className="mt-2 font-semibold text-gray-900">
                                                                    {formatPrice(item.price)}
                                                                </p>
                                                            </div>

                                                            {/* Right section — qty + subtotal + delete */}
                                                            <div className="flex flex-col items-end gap-3">
                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                    <QuantityControl
                                                                        value={item.quantity}
                                                                        onUpdate={(q) => updateQuantity(item.id, q)}
                                                                        max={item.stock}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-sm font-semibold text-gray-900 w-24 text-right">
                                                                        {formatPrice(item.subtotal)}
                                                                    </p>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                                                        className="flex size-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — summary sidebar (desktop) */}
                        <div className="hidden w-80 shrink-0 lg:sticky lg:top-6 lg:block">
                            <Card>
                                <CardContent className="p-5">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                        Ringkasan Belanja
                                    </h3>

                                    <div className="mt-4 space-y-2">
                                        {storeGroups.map((group) => {
                                            const groupSelected = group.items.filter(i => selectedIds.has(i.id));
                                            if (groupSelected.length === 0) return null;
                                            const groupTotal = groupSelected.reduce((s, i) => s + i.subtotal, 0);
                                            return (
                                                <div key={group.store_slug} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500 truncate max-w-[180px]">{group.store_name}</span>
                                                    <span className="font-medium text-gray-700">{formatPrice(groupTotal)}</span>
                                                </div>
                                            );
                                        })}
                                        {selectedCount === 0 && (
                                            <p className="text-sm text-gray-400">Belum ada produk dipilih</p>
                                        )}
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Produk dipilih</span>
                                            <span className="font-medium text-gray-700">{selectedCount} item</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-semibold text-gray-900">Total</span>
                                            <span className="text-xl font-bold text-[#4648d4]">{formatPrice(selectedTotal)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={proceedToCheckout}
                                        disabled={selectedCount === 0}
                                        className="mt-5 w-full bg-[#fea619] text-[#684000] hover:bg-[#ffb95f] py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Lanjut ke Pembayaran <ArrowRight className="ml-1.5 size-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Mobile bottom bar */}
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm lg:hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-xs text-gray-500">{selectedCount} produk dipilih</p>
                            <p className="text-lg font-bold text-[#4648d4]">{formatPrice(selectedTotal)}</p>
                        </div>
                        <Button
                            onClick={proceedToCheckout}
                            disabled={selectedCount === 0}
                            className="bg-[#fea619] text-[#684000] hover:bg-[#ffb95f] px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Lanjut <ArrowRight className="ml-1.5 size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
