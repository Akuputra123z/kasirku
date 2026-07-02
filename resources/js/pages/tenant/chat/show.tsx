'use client';

import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEcho } from '@laravel/echo-react';
import { ChevronLeft, Send, User, Loader2 } from 'lucide-react';

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hari ini';
    if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
}

export default function TenantChatShow({ conversation, messages }: {
    conversation: { id: number; customer_name: string };
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
            setAllMessages((prev) => {
                if (prev.some((m: any) => m.id === e.id)) return prev;
                return [...prev, e];
            });
        },
        [],
    );

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/conversations/${conversation.slug}/poll`);
                if (!res.ok) return;
                const data = await res.json();
                setAllMessages((prev) => {
                    const existing = new Set(prev.map((m: any) => m.id));
                    const newOnes = data.messages.filter((m: any) => !existing.has(m.id));
                    if (newOnes.length === 0) return prev;
                    return [...prev, ...newOnes];
                });
            } catch {}
        }, 8000);
        return () => clearInterval(interval);
    }, [conversation.id]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim() || sending) return;

        const text = body.trim();
        setBody('');
        setSending(true);

        setAllMessages((prev) => [
            ...prev,
            {
                id: `temp-${Date.now()}`,
                sender_id: auth.user.id,
                sender_type: 'staff',
                body: text,
                created_at: new Date().toISOString(),
                is_mine: true,
            },
        ]);

        try {
            await fetch(`/conversations/${conversation.slug}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content },
                body: JSON.stringify({ body: text }),
            });
        } catch {}
        setSending(false);
    }

    return (
        <>
            <Head title={`Pesan - ${conversation.customer_name}`} />
            <div className="flex flex-col h-[calc(100vh-140px)]">
                <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
                    <Link href="/conversations" className="p-1 rounded-lg hover:bg-gray-100">
                        <ChevronLeft className="size-5 text-slate-600" />
                    </Link>
                    <div className="size-9 rounded-full bg-blue-50 flex items-center justify-center">
                        <User className="size-5 text-blue-600" />
                    </div>
                    <p className="font-semibold text-sm">{conversation.customer_name}</p>
                </div>

                <div ref={messagesRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                    {allMessages.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            Belum ada pesan.
                        </div>
                    )}

                    {allMessages.map((msg: any, i: number) => {
                        const prev = allMessages[i - 1];
                        const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                        const sameSender = prev && prev.sender_id === msg.sender_id;
                        const isMine = msg.is_mine ?? (msg.sender_id === auth.user.id);

                        return (
                            <div key={msg.id}>
                                {showDate && (
                                    <p className="text-center text-[10px] text-slate-400 my-3">{formatDate(msg.created_at)}</p>
                                )}
                                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                                            isMine
                                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                                : 'bg-white text-slate-800 rounded-bl-md shadow-sm border border-gray-100'
                                        } ${sameSender ? 'mt-0.5' : 'mt-0'}`}
                                    >
                                        <p>{msg.body}</p>
                                        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-slate-400'} text-right`}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={handleSend} className="bg-white border-t px-4 py-3 flex gap-2 shrink-0">
                    <input
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        maxLength={2000}
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!body.trim() || sending}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                    </button>
                </form>
            </div>
        </>
    );
}
