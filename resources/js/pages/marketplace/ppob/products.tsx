'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, Smartphone, Loader2, Search, CheckCircle, AlertCircle, User } from 'lucide-react';
import DashboardSidebar from '@/components/marketplace/DashboardSidebar';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function PpobProducts({
    products, brands, activeCategory, categories, filters,
}: {
    products: any; brands: string[]; activeCategory: { name: string; slug: string; is_phone_category?: boolean };
    categories: { name: string; slug: string }[]; filters: { brand: string | null; search: string | null };
}) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [customerNo, setCustomerNo] = useState('');
    const [buying, setBuying] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [errors, setErrors] = useState<string | null>(null);
    const [customerInfo, setCustomerInfo] = useState<{
        name: string | null; detail?: any; segment_power?: string | null; unavailable?: boolean; not_found?: boolean
    } | null>(null);

    const isPhone = activeCategory.is_phone_category;

    function handleSidebarNavigate(key: string) {
        if (key === 'ppob') return;
        if (key === 'transaksi') router.get('/customer/orders');
        else if (key === 'pengaturan') router.get('/customer/settings');
        else if (key === 'chat') router.get('/customer/conversations');
        else if (key === 'beranda') router.get('/customer/dashboard');
        else router.get(`/customer/dashboard?section=${key}`);
    }

    function validate(): boolean {
        const cleaned = customerNo.replace(/\D/g, '');
        if (isPhone) {
            if (!/^08[0-9]{6,11}$/.test(cleaned)) {
                setErrors('Nomor HP harus diawali 08 dan minimal 8 digit');
                return false;
            }
        } else {
            if (cleaned.length < 6) {
                setErrors('Nomor pelanggan minimal 6 digit');
                return false;
            }
        }
        return true;
    }

    function handleCheck() {
        setErrors(null);
        if (!validate()) return;

        setChecking(true);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        fetch('/ppob/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrfToken },
            body: JSON.stringify({
                customer_no: customerNo.replace(/\D/g, ''),
                category: activeCategory.name,
            }),
        })
            .then((res) => {
                if (!res.ok) return res.json().then((d) => { throw new Error(d.message || 'Gagal memeriksa nomor'); });
                return res.json();
            })
            .then((data) => {
                setCustomerInfo({
                    name: data.customer_name,
                    detail: data.detail,
                    segment_power: data.segment_power,
                    unavailable: data.unavailable,
                    not_found: data.not_found,
                });
                setChecking(false);
            })
            .catch((err) => {
                setErrors(err.message || 'Gagal memeriksa nomor');
                setCustomerInfo(null);
                setChecking(false);
            });
    }

    function handleBuy(skuCode: string) {
        setErrors(null);

        if (!customerNo.replace(/\D/g, '') || !validate()) return;

        setBuying(skuCode);

        router.post('/ppob/order', {
            buyer_sku_code: skuCode,
            customer_no: customerNo.replace(/\D/g, ''),
            customer_name: customerInfo?.name ?? null,
        }, {
            preserveScroll: true,
            onError: (err) => {
                setErrors(Object.values(err).join(', '));
                setBuying(null);
            },
            onSuccess: () => setBuying(null),
        });
    }

    const placeholder = isPhone
        ? '08xxxxxxxxx'
        : 'Contoh: 12345678901';

    return (
        <>
            <Head title={`PPOB - ${activeCategory.name}`} />
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <DashboardSidebar
                        user={user}
                        memberLevel="Silver"
                        pointsToNextLevel={0}
                        activeSection="ppob"
                        onNavigate={handleSidebarNavigate}
                    />

                    <div className="flex-1 min-w-0">
                        {/* ── PPOB Sub-header ── */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Link href="/ppob" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <ChevronLeft className="size-5 text-slate-600" />
                                </Link>
                                <div>
                                    <h1 className="text-xl font-bold text-[#1e3a8a]">{activeCategory.name}</h1>
                                    <p className="text-xs text-slate-500">{isPhone ? 'Pulsa & Paket Data' : 'Token Listrik & Tagihan'}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Card Input Nomor + Cek Nama ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                            <label className="block text-sm font-semibold text-[#1e3a8a] mb-3">
                                <Smartphone className="size-4 inline mr-1" />
                                {isPhone ? 'Nomor HP Pelanggan' : 'Nomor Meter / ID Pelanggan'}
                            </label>

                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={customerNo}
                                    onChange={(e) => { setCustomerNo(e.target.value); setErrors(null); setCustomerInfo(null); }}
                                    placeholder={placeholder}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm"
                                    maxLength={15}
                                />
                                <button
                                    onClick={handleCheck}
                                    disabled={checking || !customerNo}
                                    className="shrink-0 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                                >
                                    {checking ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Search className="size-4" />
                                    )}
                                    Cek
                                </button>
                            </div>

                            {/* ── Hasil Verifikasi ── */}
                            {customerInfo && customerInfo.name && (
                                <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                                        <User className="size-4 shrink-0" />
                                        {customerInfo.name}
                                    </div>
                                    {customerInfo.segment_power && (
                                        <p className="mt-1 text-xs text-emerald-600 font-medium">
                                            {customerInfo.segment_power}
                                        </p>
                                    )}
                                    <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1">
                                        <CheckCircle className="size-3" />
                                        Data sesuai, silakan pilih produk dan lanjutkan pembayaran
                                    </p>
                                </div>
                            )}

                            {customerInfo && !customerInfo.name && customerInfo.unavailable && (
                                <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                                    <p className="text-xs text-yellow-700 flex items-start gap-2">
                                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                        Verifikasi tidak tersedia untuk kategori ini. Pastikan nomor sudah benar, lalu lanjutkan pembelian.
                                    </p>
                                </div>
                            )}

                            {customerInfo && !customerInfo.name && customerInfo.not_found && (
                                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-4">
                                    <p className="text-xs text-red-600 flex items-start gap-2">
                                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                        Nomor tidak ditemukan. Periksa kembali nomor {isPhone ? 'HP' : 'meter/ID pelanggan'} Anda.
                                    </p>
                                </div>
                            )}

                            {errors && (
                                <div className="mt-3 flex items-start gap-2 text-xs text-red-500 bg-red-50 p-3 rounded-xl">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <span>{errors}</span>
                                </div>
                            )}
                        </div>

                        {/* ── Brand Filters ── */}
                        {brands.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                {brands.map((brand) => (
                                    <Link
                                        key={brand}
                                        href={filters.brand === brand
                                            ? `/ppob/${activeCategory.slug}`
                                            : `/ppob/${activeCategory.slug}?brand=${encodeURIComponent(brand)}`
                                        }
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                            filters.brand === brand
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-white text-slate-600 border border-gray-200 hover:border-emerald-300'
                                        }`}
                                    >
                                        {brand}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* ── Products Grid ── */}
                        {products.data.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <p>Tidak ada produk ditemukan</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.data.map((product: any) => (
                                    <div
                                        key={product.buyer_sku_code}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
                                    >
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{product.brand}</p>
                                        <h3 className="font-semibold text-sm text-[#1e3a8a] mb-2 leading-snug">{product.product_name}</h3>

                                        <p className="text-lg font-bold text-emerald-600 mb-4">{formatPrice(product.buyer_price)}</p>

                                        <button
                                            onClick={() => handleBuy(product.buyer_sku_code)}
                                            disabled={buying === product.buyer_sku_code || !customerNo}
                                            className="w-full py-2.5 bg-[#1e3a8a] hover:bg-blue-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            {buying === product.buyer_sku_code ? (
                                                <><Loader2 className="size-4 animate-spin" /> Memproses...</>
                                            ) : (
                                                'Beli'
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Pagination ── */}
                        {products.links && products.links.length > 3 && (
                            <div className="flex justify-center mt-8 gap-2">
                                {products.links.map((link: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-[#1e3a8a] text-white'
                                                : 'bg-white text-slate-600 border border-gray-200 hover:border-emerald-300'
                                        } ${!link.url ? 'opacity-50 pointer-events-none' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
