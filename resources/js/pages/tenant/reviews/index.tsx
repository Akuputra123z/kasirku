'use client';

import { Head, router } from '@inertiajs/react';
import { Star, MessageSquare, User, ShoppingBag, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TenantReviewsIndex({ reviews, stats }: {
    reviews: any;
    stats: { total: number; avg_rating: number; count_5: number; count_4: number; count_3: number; count_2: number; count_1: number };
}) {
    return (
        <>
            <Head title="Ulasan" />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Ulasan Pelanggan</h1>
                    <p className="text-sm text-muted-foreground">Lihat apa kata pelanggan tentang toko kamu</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">Total Ulasan</p>
                            <p className="text-3xl font-bold mt-1">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">Rata-rata Rating</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-3xl font-bold">{stats.avg_rating ? stats.avg_rating.toFixed(1) : '-'}</p>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`size-4 ${s <= Math.round(stats.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground mb-3">Distribusi Rating</p>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((r) => {
                                    const count = stats[`count_${r}` as keyof typeof stats] as number;
                                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                    return (
                                        <div key={r} className="flex items-center gap-2 text-xs">
                                            <span className="w-8 text-right font-medium">{r}</span>
                                            <Star className="size-3 text-yellow-400 fill-yellow-400" />
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="w-8 text-right text-muted-foreground">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Reviews List */}
                {reviews.data.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare className="size-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">Belum ada ulasan</p>
                        <p className="text-sm text-muted-foreground mt-1">Ulasan akan muncul setelah pelanggan memberikan rating.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.data.map((r: any) => (
                            <Card key={r.id}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {r.customer_avatar ? (
                                                    <img src={r.customer_avatar} alt="" className="size-full object-cover" />
                                                ) : (
                                                    <User className="size-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{r.customer_name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} className={`size-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="size-3" />
                                                {r.created_at}
                                            </div>
                                        </div>
                                    </div>
                                    {r.review && (
                                        <p className="text-sm mt-3 text-gray-600">{r.review}</p>
                                    )}
                                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                        <ShoppingBag className="size-3" />
                                        Pesanan #{r.order_number}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {reviews.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {reviews.links?.map((link: any, i: number) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => router.get(link.url)}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                    link.active
                                        ? 'bg-primary text-white border-primary'
                                        : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
                {reviews.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        Halaman {reviews.current_page} dari {reviews.last_page}
                    </div>
                )}
            </div>
        </>
    );
}
