'use client';

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ShoppingBag, Star as StarIcon } from 'lucide-react';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

export default function ReviewCreate({ order }: { order: any }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rating === 0) return;
        setSubmitting(true);
        try {
            const resp = await fetch(`/customer/orders/${order.id}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
                },
                body: JSON.stringify({ rating, review: review.trim() || null }),
            });
            if (resp.ok) {
                router.visit(`/customer/orders/${order.id}`);
            }
        } catch {}
        setSubmitting(false);
    }

    return (
        <>
            <Head title="Beri Ulasan" />
            <div className="min-h-screen bg-[#f6f8f7]">
                <main className="max-w-[600px] mx-auto px-4 py-8">
                    <Link href={`/customer/orders/${order.id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                        <ChevronLeft className="size-4" /> Kembali ke pesanan
                    </Link>

                    <div className="bg-white rounded-xl shadow-sm border border-[#e7f3ef] overflow-hidden">
                        <div className="p-6 border-b border-[#e7f3ef]">
                            <h1 className="text-xl font-bold text-[#1e3a8a]">Beri Ulasan</h1>
                            <p className="text-sm text-gray-500 mt-1">Bagaimana pengalaman belanjamu di {order.store_name}?</p>
                        </div>

                        {/* Order info */}
                        <div className="p-6 border-b border-[#e7f3ef] bg-[#f6f8f7]/30">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="size-8 text-gray-300" />
                                <div>
                                    <p className="text-sm font-semibold text-[#1e3a8a]">{order.store_name}</p>
                                    <p className="text-xs text-gray-500">{order.items.length} item | {formatPrice(order.total)}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Star Rating */}
                            <div>
                                <label className="block font-semibold text-sm text-[#1e3a8a] mb-3">Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(s)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(s)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <StarIcon
                                                className={`size-8 ${
                                                    s <= (hoverRating || rating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-200'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {rating === 0 && 'Klik bintang untuk memberi rating'}
                                    {rating === 1 && 'Sangat tidak puas'}
                                    {rating === 2 && 'Tidak puas'}
                                    {rating === 3 && 'Cukup'}
                                    {rating === 4 && 'Puas'}
                                    {rating === 5 && 'Sangat puas'}
                                </p>
                                {rating === 0 && <p className="text-xs text-red-500 mt-1">Rating wajib diisi</p>}
                            </div>

                            {/* Review Text */}
                            <div>
                                <label className="block font-semibold text-sm text-[#1e3a8a] mb-2">
                                    Ulasan <span className="text-gray-400 font-normal">(opsional)</span>
                                </label>
                                <Textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="Ceritakan pengalaman belanjamu..."
                                    className="min-h-[120px] border-[#e7f3ef] focus:border-emerald-500 focus:ring-emerald-500/20"
                                    maxLength={2000}
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{review.length}/2000</p>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <Link href={`/customer/orders/${order.id}`}>
                                    <Button type="button" variant="outline" className="border-gray-200 text-gray-600">
                                        Batal
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={rating === 0 || submitting}
                                    className="flex-1 bg-[#10b77f] hover:bg-[#059669] font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </>
    );
}
