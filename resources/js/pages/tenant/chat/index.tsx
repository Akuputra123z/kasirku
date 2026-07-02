'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { MessageSquare, User, Search, ArrowRight, Mail, CheckCheck } from 'lucide-react';

export default function TenantChatIndex({ conversations, filters }: {
    conversations: any;
    filters: { search: string | null; filter: string | null };
}) {
    const [searchInput, setSearchInput] = useState(filters?.search || '');
    const activeFilter = filters?.filter || '';

    function handleSearch(val: string) {
        setSearchInput(val);
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.get('/conversations', {
            search: searchInput || undefined,
            filter: activeFilter || undefined,
        }, { preserveState: true });
    }

    function handleFilterChange(filter: string) {
        router.get('/conversations', {
            search: searchInput || undefined,
            filter: filter || undefined,
        }, { preserveState: true });
    }

    return (
        <>
            <Head title="Pesan Pelanggan" />

            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Pesan Pelanggan</h1>
                    <p className="text-sm text-muted-foreground">Riwayat obrolan dengan pelanggan</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari pelanggan, subjek, atau email..."
                            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </form>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-5">
                    {[
                        { key: '', label: 'Semua' },
                        { key: 'unread', label: 'Belum Dibaca' },
                        { key: 'read', label: 'Sudah Dibaca' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleFilterChange(tab.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                activeFilter === tab.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-card text-muted-foreground border border-border hover:border-primary/40'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                {conversations.data.length === 0 ? (
                    <div className="text-center py-20">
                        <MessageSquare className="size-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">
                            {filters.search || filters.filter ? 'Percakapan tidak ditemukan' : 'Belum ada percakapan'}
                        </p>
                        {(filters.search || filters.filter) && (
                            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci atau filter</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {conversations.data.map((c: any) => (
                            <Link
                                key={c.id}
                                href={`/conversations/${c.slug}`}
                                className={`flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm ${
                                    c.unread_count > 0
                                        ? 'bg-primary/[0.03] border-primary/20'
                                        : 'bg-card border-border hover:border-primary/20'
                                }`}
                            >
                                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                                    c.unread_count > 0 ? 'bg-primary/10' : 'bg-muted'
                                }`}>
                                    <User className={`size-5 ${
                                        c.unread_count > 0 ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm ${c.unread_count > 0 ? 'font-bold' : 'font-semibold'}`}>
                                            {c.customer_name}
                                        </h3>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {c.unread_count > 0 && (
                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
                                                    {c.unread_count}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{c.last_message_at}</span>
                                            <ArrowRight className="size-3.5 text-muted-foreground/40" />
                                        </div>
                                    </div>

                                    {c.subject && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{c.subject}</p>
                                    )}

                                    {c.last_message ? (
                                        <p className={`text-sm mt-1.5 truncate ${c.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                            {c.last_message}
                                        </p>
                                    ) : (
                                        <p className="text-sm mt-1.5 text-muted-foreground/50 italic">Belum ada pesan</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {conversations.links && conversations.links.length > 3 && (
                    <div className="flex justify-center mt-8 gap-2">
                        {conversations.links.map((link: any, i: number) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card text-muted-foreground border border-border hover:border-primary/40'
                                } ${!link.url ? 'opacity-50 pointer-events-none' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}