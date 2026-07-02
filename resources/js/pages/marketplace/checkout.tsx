'use client';

import { Head, Link, router } from '@inertiajs/react';
import { MapPin, ChevronLeft, Package, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutAddressSchema, type CheckoutAddress } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

type CourierService = {
    service: string;
    description: string;
    cost: number;
    etd: string;
};

type CourierResult = {
    code: string;
    name: string;
    costs: CourierService[];
};

export default function Checkout({ stores, subtotal, total, addresses, clientKey }: {
    stores: any[]; subtotal: number; total: number; addresses: any[]; clientKey: string | null;
}) {
    const [selectedAddress, setSelectedAddress] = useState(addresses?.find((a: any) => a.is_default)?.id || addresses?.[0]?.id || '');
    const [showNewAddress, setShowNewAddress] = useState(false);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [notes, setNotes] = useState('');

    const [selectedProvinceId, setSelectedProvinceId] = useState('');
    const [selectedCityId, setSelectedCityId] = useState('');
    const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
    const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    const [shippingOptions, setShippingOptions] = useState<Record<number, CourierResult[]>>({});
    const [loadingShipping, setLoadingShipping] = useState<Record<number, boolean>>({});
    const [rajaongkirError, setRajaongkirError] = useState<Record<number, boolean>>({});
    const [selectedCouriers, setSelectedCouriers] = useState<Record<number, { courier: string; service: string; cost: number }>>({});
    const [totals, setTotals] = useState<Record<number, number>>({});
    const fetchedDest = useRef<string>('');

    const newAddressForm = useForm<CheckoutAddress>({
        resolver: zodResolver(checkoutAddressSchema),
        defaultValues: { label: '', recipient_name: '', phone: '', address: '', city: '', province: '', postal_code: '', rajaongkir_city_id: '' },
    });

    const getDestinationCityId = useCallback(() => {
        if (useNewAddress) return newAddressForm.watch('rajaongkir_city_id');
        const addr = addresses?.find((a: any) => a.id === selectedAddress);
        return addr?.rajaongkir_city_id || '';
    }, [useNewAddress, newAddressForm, selectedAddress, addresses]);

    const fetchShippingCost = useCallback(async (store: any, destination: string) => {
        if (!destination || !store.rajaongkir_city_id) return;

        const totalWeight = store.items.reduce((sum: number, item: any) => {
            return sum + (item.weight || 0) * item.quantity;
        }, 0);

        const finalWeight = Math.max(totalWeight, 1000);

        setLoadingShipping((prev) => ({ ...prev, [store.tenant_id]: true }));

        const grouped: Record<string, CourierResult> = {};

        try {
            const res = await fetch('/rajaongkir/cost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: store.rajaongkir_city_id,
                    destination,
                    weight: finalWeight,
                    courier: 'jne:sicepat:jnt:tiki:pos',
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    for (const item of data) {
                        if (!grouped[item.code]) {
                            grouped[item.code] = { code: item.code, name: item.name, costs: [] };
                        }
                        grouped[item.code].costs.push({ service: item.service, description: item.description, cost: item.cost, etd: item.etd });
                    }
                }
            }
        } catch {}

        const results = Object.values(grouped);
        setRajaongkirError((prev) => ({ ...prev, [store.tenant_id]: results.length === 0 }));
        setShippingOptions((prev) => ({ ...prev, [store.tenant_id]: results }));
        setLoadingShipping((prev) => ({ ...prev, [store.tenant_id]: false }));

        if (results.length === 0 && store.shipping_cost > 0) {
            selectService(store, '', 'Flat', store.shipping_cost);
        }
        setLoadingShipping((prev) => ({ ...prev, [store.tenant_id]: false }));
    }, []);

    useEffect(() => { fetchProvinces(); }, []);

    async function fetchProvinces() {
        try {
            const res = await fetch('/rajaongkir/provinces');
            const data = await res.json();
            if (Array.isArray(data)) setProvinces(data);
        } catch {}
    }

    async function fetchDistricts(cityId?: string) {
        if (!cityId) { setDistricts([]); return; }
        setLoadingDistricts(true);
        try {
            const res = await fetch(`/rajaongkir/districts/${cityId}`);
            const data = await res.json();
            if (Array.isArray(data)) setDistricts(data);
        } catch {} finally {
            setLoadingDistricts(false);
        }
    }

    async function fetchCities(provinceId?: string) {
        if (!provinceId) { setCities([]); return; }
        setLoadingCities(true);
        try {
            const res = await fetch(`/rajaongkir/cities/${provinceId}`);
            const data = await res.json();
            if (Array.isArray(data)) setCities(data);
        } catch {} finally {
            setLoadingCities(false);
        }
    }

    useEffect(() => {
        const destId = getDestinationCityId();
        if (destId) doFetchShipping(destId);
    }, []);

    function onSelectAddress(addressId: string) {
        setSelectedAddress(Number(addressId));
        const addr = addresses?.find((a: any) => a.id === Number(addressId));
        if (addr?.rajaongkir_city_id) doFetchShipping(addr.rajaongkir_city_id);
    }

    function onUseNewAddress(data: CheckoutAddress) {
        setUseNewAddress(true);
        setShowNewAddress(false);
        if (data.rajaongkir_city_id) doFetchShipping(data.rajaongkir_city_id);
    }

    function onResetAddress() {
        setUseNewAddress(false);
        setShowNewAddress(true);
    }

    function doFetchShipping(destId: string) {
        if (!destId || destId === fetchedDest.current) return;
        fetchedDest.current = destId;
        stores.forEach((store: any) => {
            if (store.rajaongkir_city_id) fetchShippingCost(store, destId);
        });
    }

    function selectCourier(store: any, courierCode: string) {
        setSelectedCouriers((prev) => ({ ...prev, [store.tenant_id]: { courier: courierCode, service: '', cost: 0 } }));
    }

    function selectService(store: any, courierCode: string, service: string, cost: number) {
        setSelectedCouriers((prev) => ({ ...prev, [store.tenant_id]: { courier: courierCode, service, cost } }));
        setTotals((prev) => ({ ...prev, [store.tenant_id]: store.store_subtotal + cost }));
    }

    function processOrder() {
        if (!selectedAddress && !useNewAddress) {
            toast.error('Pilih alamat pengiriman');
            return;
        }

        for (const store of stores) {
            const hasCourierSelection = store.rajaongkir_city_id;
            if (hasCourierSelection && !selectedCouriers[store.tenant_id]?.service) {
                toast.error(`Pilih kurir untuk ${store.store_name}`);
                return;
            }
        }

        setProcessing(true);

        const cartIds = stores.flatMap((store: any) =>
            store.items.map((item: any) => item.cart_id)
        );

        const payload: any = { notes, selected: cartIds.join(',') };
        if (useNewAddress) {
            Object.assign(payload, newAddressForm.getValues());
        } else {
            payload.address_id = selectedAddress;
        }

        payload.shipping = stores.map((store: any) => ({
            tenant_id: store.tenant_id,
            courier: selectedCouriers[store.tenant_id]?.courier || '',
            service: selectedCouriers[store.tenant_id]?.service || '',
            cost: selectedCouriers[store.tenant_id]?.cost || store.shipping_cost || 0,
        }));

        router.post('/checkout/process', payload, {
            onError: () => { setProcessing(false); toast.error('Gagal memproses pesanan'); },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <>
            <Head title="Checkout - Kasirku Marketplace" />
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    <Link href="/cart" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4648d4]">
                        <ChevronLeft className="size-4" /> Kembali ke Keranjang
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Address */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="font-semibold text-gray-900">Alamat Pengiriman</h2>
                                        <Dialog open={showNewAddress} onOpenChange={setShowNewAddress}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm"><Plus className="mr-1 size-4" /> Alamat Baru</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Alamat Baru</DialogTitle></DialogHeader>
                                                <form className="space-y-3" onSubmit={newAddressForm.handleSubmit(onUseNewAddress)}>
                                                    <div>
                                                        <Label>Label (Rumah/Kantor)</Label>
                                                        <Input {...newAddressForm.register('label')} placeholder="Rumah / Kantor" />
                                                    </div>
                                                    <div>
                                                        <Label>Nama Penerima <span className="text-red-500">*</span></Label>
                                                        <Input {...newAddressForm.register('recipient_name')} placeholder="Nama penerima" />
                                                        {newAddressForm.formState.errors.recipient_name && (
                                                            <p className="mt-1 text-xs text-red-500">{newAddressForm.formState.errors.recipient_name.message}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label>No. HP <span className="text-red-500">*</span></Label>
                                                        <Input {...newAddressForm.register('phone')} placeholder="08xxxxxxxxxx" />
                                                        {newAddressForm.formState.errors.phone && (
                                                            <p className="mt-1 text-xs text-red-500">{newAddressForm.formState.errors.phone.message}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label>Alamat <span className="text-red-500">*</span></Label>
                                                        <Textarea {...newAddressForm.register('address')} placeholder="Nama jalan, gedung, etc." />
                                                        {newAddressForm.formState.errors.address && (
                                                            <p className="mt-1 text-xs text-red-500">{newAddressForm.formState.errors.address.message}</p>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <Label>Provinsi</Label>
                                                            <select
                                                                value={selectedProvinceId}
                                                                onChange={(e) => {
                                                                    const p = provinces.find(p => String(p.id) === e.target.value);
                                                                    setSelectedProvinceId(e.target.value);
                                                                    setSelectedCityId('');
                                                                    setDistricts([]);
                                                                    newAddressForm.setValue('province', p?.name ?? '');
                                                                    newAddressForm.setValue('rajaongkir_city_id', '');
                                                                    if (p) fetchCities(String(p.id));
                                                                }}
                                                                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                                                            >
                                                                <option value="">Pilih Provinsi</option>
                                                                {provinces.map((p) => (
                                                                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label>Kota</Label>
                                                            <select
                                                                value={selectedCityId}
                                                                onChange={(e) => {
                                                                    const c = cities.find(c => String(c.id) === e.target.value);
                                                                    setSelectedCityId(e.target.value);
                                                                    newAddressForm.setValue('city', c?.name ?? '');
                                                                    newAddressForm.setValue('rajaongkir_city_id', '');
                                                                    if (c) fetchDistricts(String(c.id));
                                                                }}
                                                                disabled={loadingCities || !selectedProvinceId}
                                                                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                                                            >
                                                                <option value="">{loadingCities ? 'Loading...' : 'Pilih Kota'}</option>
                                                                {cities.map((c) => (
                                                                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label>Kecamatan</Label>
                                                            <select
                                                                value={newAddressForm.watch('rajaongkir_city_id')}
                                                                onChange={(e) => {
                                                                    const d = districts.find(d => String(d.id) === e.target.value);
                                                                    newAddressForm.setValue('rajaongkir_city_id', e.target.value);
                                                                    newAddressForm.setValue('city', d?.name ?? '');
                                                                }}
                                                                disabled={loadingDistricts || !selectedCityId}
                                                                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                                                            >
                                                                <option value="">{loadingDistricts ? 'Loading...' : 'Pilih Kecamatan'}</option>
                                                                {districts.map((d) => (
                                                                    <option key={d.id} value={String(d.id)}>{d.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Kode Pos</Label>
                                                        <Input {...newAddressForm.register('postal_code')} placeholder="Kode pos" />
                                                    </div>
                                                    <Button type="submit" className="w-full bg-[#4648d4]">Gunakan Alamat Ini</Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    {useNewAddress ? (
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                            <p className="font-medium text-emerald-800">{newAddressForm.watch('recipient_name') || 'Alamat Baru'}</p>
                                            <p className="text-sm text-emerald-600">
                                                {newAddressForm.watch('address')}, {newAddressForm.watch('city')}, {newAddressForm.watch('province')} {newAddressForm.watch('postal_code')}
                                            </p>
                                            <p className="text-sm text-emerald-600">{newAddressForm.watch('phone')}</p>
                                            <button onClick={onResetAddress} className="mt-1 text-xs text-emerald-700 underline">Ubah alamat</button>
                                        </div>
                                    ) : addresses?.length > 0 && !showNewAddress ? (
                                        <RadioGroup value={String(selectedAddress)} onValueChange={onSelectAddress}>
                                            {addresses.map((addr: any) => (
                                                <div key={addr.id} className="flex items-start gap-3 rounded-lg border p-3">
                                                    <RadioGroupItem value={String(addr.id)} id={`addr-${addr.id}`} />
                                                    <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
                                                        <p className="font-medium">{addr.recipient_name} {addr.label && <span className="text-xs text-gray-500">({addr.label})</span>}</p>
                                                        <p className="text-sm text-gray-500">{addr.address}, {addr.city}, {addr.province} {addr.postal_code}</p>
                                                        <p className="text-sm text-gray-500">{addr.phone}</p>
                                                        {!addr.rajaongkir_city_id && (
                                                            <p className="mt-1 text-xs text-amber-600">Pilih alamat baru dengan kecamatan untuk ongkir</p>
                                                        )}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    ) : !showNewAddress && (
                                        <p className="text-sm text-gray-500">Belum ada alamat. Tambahkan alamat baru.</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Courier Selection */}
                            {stores.some((s: any) => s.rajaongkir_city_id) && (
                                <Card>
                                    <CardContent className="p-6">
                                        <h2 className="mb-4 font-semibold text-gray-900">Pilih Kurir</h2>
                                        {!getDestinationCityId() ? (
                                            <p className="text-sm text-gray-400">Pilih alamat dengan kecamatan untuk melihat ongkir</p>
                                        ) : (
                                        stores.map((store: any) => {
                                            const opts = shippingOptions[store.tenant_id];
                                            const sel = selectedCouriers[store.tenant_id];
                                            const activeCourier = sel?.courier ? opts?.find((c: any) => c.code === sel.courier) : null;
                                            return (
                                                <div key={store.tenant_id} className="mb-4 last:mb-0 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                                    <p className="mb-2 text-sm font-medium text-gray-700">{store.store_name}</p>
                                                    {loadingShipping[store.tenant_id] ? (
                                                        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="size-4 animate-spin" /> Menghitung ongkir...</div>
                                                    ) : opts?.length > 0 ? (
                                                        <div className="space-y-3">
                                                            <select
                                                                value={sel?.courier || ''}
                                                                onChange={(e) => selectCourier(store, e.target.value)}
                                                                className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                                                            >
                                                                <option value="">Pilih Kurir</option>
                                                                {opts.map((c: any) => (
                                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                            {activeCourier && (
                                                                <select
                                                                    value={sel?.service || ''}
                                                                    onChange={(e) => {
                                                                        const svc = activeCourier.costs.find((s: any) => s.service === e.target.value);
                                                                        if (svc) selectService(store, activeCourier.code, svc.service, svc.cost);
                                                                    }}
                                                                    className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                                                                >
                                                                    <option value="">Pilih Layanan</option>
                                                                    {activeCourier.costs.map((svc: any) => (
                                                                        <option key={svc.service} value={svc.service}>
                                                                            {svc.service} — {formatPrice(svc.cost)}{svc.etd ? ` (${svc.etd})` : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            {sel?.cost > 0 && (
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Ongkos Kirim</span>
                                                                    <span className="font-semibold text-[#4648d4]">{formatPrice(sel.cost)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-sm text-gray-400">Pilih alamat tujuan untuk lihat ongkir</p>
                                                            {rajaongkirError[store.tenant_id] && store.shipping_cost > 0 && (
                                                                <p className="mt-1 text-xs text-amber-600">Ongkir otomatis tidak tersedia, menggunakan ongkos kirim tetap Rp{new Intl.NumberFormat('id-ID').format(store.shipping_cost)}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Notes */}
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="mb-3 font-semibold text-gray-900">Catatan</h2>
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan untuk penjual (opsional)" rows={3} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-4">
                            {stores.map((store: any) => (
                                <Card key={store.tenant_id}>
                                    <CardContent className="p-4">
                                        <p className="font-medium text-gray-900">{store.store_name}</p>
                                        <Separator className="my-3" />
                                        <div className="space-y-2">
                                            {store.items.map((item: any) => (
                                                <div key={item.cart_id} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{item.product_name} {item.variant_name && `(${item.variant_name})`} x{item.quantity}</span>
                                                    <span className="text-gray-900">{formatPrice(item.subtotal)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span>{formatPrice(store.store_subtotal)}</span>
                                        </div>

                                        <div className="flex justify-between text-sm mt-2">
                                            <span className="text-gray-600">Ongkos Kirim</span>
                                            <span>{selectedCouriers[store.tenant_id] ? formatPrice(selectedCouriers[store.tenant_id].cost) : formatPrice(store.shipping_cost)}</span>
                                        </div>
                                        <div className="mt-2 flex justify-between font-semibold">
                                            <span>Total Toko</span>
                                            <span className="text-[#4648d4]">{formatPrice(totals[store.tenant_id] || store.store_total)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <Card className="bg-[#4648d4] text-white">
                                <CardContent className="p-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Pesanan</span>
                                        <span>{formatPrice(Object.values(totals).reduce((a: number, b: number) => a + b, 0) || total)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button onClick={processOrder} disabled={processing} className="w-full bg-[#fea619] py-2.5 text-sm font-semibold text-[#684000] hover:bg-[#ffb95f]">
                                {processing ? 'Memproses...' : 'Bayar Sekarang'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
