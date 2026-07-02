'use client';

import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEcho } from '@laravel/echo-react';
import {
    ChevronLeft,
    Send,
    Store,
    Loader2,
    Info,
    CheckCheck,
    Smile,
    Paperclip,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hari ini';
    if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function sameDay(a: string, b: string): boolean {
    return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function CustomerChatShow({
    conversation,
    messages,
}: {
    conversation: { id: number; store_name: string; store_slug: string; slug: string };
    messages: any;
}) {
    const { auth } = usePage().props as any;
    const [body, setBody] = useState('');
    const [allMessages, setAllMessages] = useState(messages.data ?? []);
    const [sending, setSending] = useState(false);
    const messagesRef = useRef<HTMLDivElement>(null);
    const shouldAutoScroll = useRef(true);

    const handleScroll = useCallback(() => {
        if (!messagesRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
        shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 150;
    }, []);

    useEffect(() => {
        setAllMessages(messages.data ?? []);
    }, [messages.data]);

    useEffect(() => {
        if (!messagesRef.current || !shouldAutoScroll.current) return;
        requestAnimationFrame(() => {
            messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
        });
    }, [allMessages]);

    useEffect(() => {
        if (!messagesRef.current || allMessages.length === 0) return;
        requestAnimationFrame(() => {
            messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'instant' });
        });
    }, []);

    useEcho(
        `conversation.${conversation.id}`,
        ['.NewMessage'],
        (e: any) => {
            if (e.sender_id === auth.user.id) return;
            setAllMessages((prev: any[]) => {
                if (prev.some((m: any) => m.id === e.id)) return prev;
                return [...prev, e];
            });
        },
        [conversation.id],
    );

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim() || sending) return;

        const text = body.trim();
        setBody('');
        setSending(true);

        setAllMessages((prev: any[]) => [
            ...prev,
            {
                id: `temp-${Date.now()}`,
                sender_id: auth.user.id,
                sender_type: 'customer',
                body: text,
                created_at: new Date().toISOString(),
                is_mine: true,
            },
        ]);

        try {
            await fetch(`/customer/conversations/${conversation.slug}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
                },
                body: JSON.stringify({ body: text }),
            });
        } catch {}
        setSending(false);
    }

    return (
        <>
            <Head title={`Pesan - ${conversation.store_name}`} />
            <div className="flex flex-col h-[calc(100dvh-140px)] max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href="/customer/conversations" className="p-1 -ml-1 rounded-lg hover:bg-gray-100">
                            <ChevronLeft className="size-5 text-gray-600" />
                        </Link>
                        <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            <Store className="size-5 text-gray-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <h3 className="font-bold text-sm">{conversation.store_name}</h3>
                                <Badge className="bg-[#eef0ff] text-[#4648d4] text-[10px] px-1.5 rounded font-bold border-0">
                                    Penjual
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner */}
                <div className="p-3 border-b border-gray-100 shrink-0 bg-gray-50/30">
                    <div className="bg-blue-50/50 text-gray-600 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-2">
                            <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs">
                                Sekarang kamu bisa balas chat dari pembeli dan atur toko di Tokopedia Seller.{' '}
                                <span className="text-[#4648d4] font-bold cursor-pointer">Yuk, cek sekarang!</span>
                            </p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center px-4 mt-2">
                        Hati-hati penipuan! Tetap bertransaksi di aplikasi dan jaga data pribadi.{' '}
                        <span className="text-[#4648d4] font-bold cursor-pointer">Baca Panduan Keamanan.</span>
                    </p>
                </div>

                {/* Messages */}
                <div ref={messagesRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                    {allMessages.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm">
                            Belum ada pesan. Mulai percakapan!
                        </div>
                    )}

                    {allMessages.map((msg: any, i: number) => {
                        const prev = allMessages[i - 1];
                        const showHeader = !prev || !sameDay(prev.created_at, msg.created_at);
                        const isMine = msg.is_mine ?? (msg.sender_id === auth.user.id);

                        return (
                            <div key={msg.id}>
                                {showHeader && (
                                    <div className="flex justify-center my-3">
                                        <span className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-widest font-semibold">
                                            {formatDateHeader(msg.created_at)}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[70%] px-3 py-2.5 text-sm leading-relaxed ${
                                            isMine
                                                ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-br-md'
                                                : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                                        }`}
                                    >
                                        <p className="text-xs">{msg.body}</p>
                                        <div
                                            className={`flex items-center gap-1 mt-1 ${
                                                isMine ? 'justify-end' : 'justify-start'
                                            }`}
                                        >
                                            {isMine && <CheckCheck className="size-3 text-[#4648d4]" />}
                                            <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick replies */}
                <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-gray-100 shrink-0 bg-white">
                    {['Hai, barang ini ready?', 'Bisa dikirim hari ini?', 'Terima kasih!'].map((text) => (
                        <button
                            key={text}
                            onClick={() => setBody(text)}
                            className="px-3 py-1.5 border border-gray-300 rounded-full text-xs text-gray-600 whitespace-nowrap hover:border-[#4648d4] hover:text-[#4648d4] transition-colors"
                        >
                            {text}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                    <div className="flex-1 relative">
                        <Smile className="size-5 text-gray-400 absolute left-3 top-3" />
                        <input
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Tulis Pesan..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-10 pr-10 focus:ring-1 focus:ring-[#4648d4] focus:border-[#4648d4] text-sm outline-none"
                            maxLength={2000}
                            disabled={sending}
                        />
                        <Paperclip className="size-5 text-gray-400 absolute right-3 top-3 cursor-pointer" />
                    </div>
                    <button
                        type="submit"
                        disabled={!body.trim() || sending}
                        className="size-10 bg-[#4648d4] text-white flex items-center justify-center rounded-full hover:bg-[#3b3db8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                        {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 rotate-90" />}
                    </button>
                </form>
            </div>
        </>
    );
}
