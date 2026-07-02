'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEcho } from '@laravel/echo-react';
import {
    MessageSquare,
    Send,
    Store,
    Loader2,
    ChevronLeft,
    CheckCheck,
    Smile,
    Paperclip,
    Info,
    Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DashboardSidebar from '@/components/marketplace/DashboardSidebar';

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - now.getDay());
    if (d.toDateString() === now.toDateString()) return 'Hari ini';
    if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function sameDay(a: string, b: string): boolean {
    return new Date(a).toDateString() === new Date(b).toDateString();
}

// ─── Sidebar is now handled by DashboardSidebar ────────────────────────

// ─── Chat List Panel ──────────────────────────────────────────────────────
function ChatListPanel({
    conversations,
    activeSlug,
    onSelect,
}: {
    conversations: any;
    activeSlug: string | null;
    onSelect: (slug: string) => void;
}) {
    return (
        <section className="w-80 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold">Chat</h2>
                <button className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <Search className="size-4 text-gray-600" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.data.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <MessageSquare className="size-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">Belum ada chat</p>
                        <p className="text-xs text-gray-400 mt-1">Mulai dengan membuka halaman toko</p>
                    </div>
                ) : (
                    conversations.data.map((c: any) => (
                        <ChatListItem key={c.id} conversation={c} isActive={c.slug === activeSlug} onSelect={onSelect} />
                    ))
                )}
            </div>
        </section>
    );
}

function ChatListItem({
    conversation,
    isActive,
    onSelect,
}: {
    conversation: any;
    isActive: boolean;
    onSelect: (slug: string) => void;
}) {
    return (
        <div
            onClick={() => onSelect(conversation.slug)}
            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                isActive
                    ? 'bg-gray-50 border-l-4 border-[#4648d4]'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
            }`}
        >
            <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                <Store className="size-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-xs truncate">{conversation.store_name}</span>
                        <Badge className="bg-[#eef0ff] text-[#4648d4] text-[8px] px-1 rounded font-bold border-0">
                            penjual
                        </Badge>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-1">{conversation.last_message_at}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{conversation.last_message || 'Belum ada pesan'}</p>
                    {conversation.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shrink-0 ml-1">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Chat Window ──────────────────────────────────────────────────────────
function ChatWindow({
    conversation,
    messages: initialMessages,
    onBack,
}: {
    conversation: any;
    messages: any;
    onBack: () => void;
}) {
    const { auth } = usePage().props as any;
    const [body, setBody] = useState('');
    const [allMessages, setAllMessages] = useState(initialMessages?.data ?? []);
    const [sending, setSending] = useState(false);
    const messagesRef = useRef<HTMLDivElement>(null);
    const shouldAutoScroll = useRef(true);

    const handleScroll = useCallback(() => {
        if (!messagesRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
        shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 150;
    }, []);

    useEffect(() => {
        setAllMessages(initialMessages?.data ?? []);
    }, [initialMessages]);

    useEffect(() => {
        if (!messagesRef.current || !shouldAutoScroll.current) return;
        messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
    }, [allMessages]);

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
        <section className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-w-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="lg:hidden p-1 -ml-1 rounded-lg hover:bg-gray-100">
                        <ChevronLeft className="size-5 text-gray-600" />
                    </button>
                    <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
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
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                    <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                </button>
            </div>

            {/* Banner */}
            <div className="p-3 space-y-2 border-b border-gray-100 shrink-0 bg-gray-50/30">
                <div className="bg-blue-50/50 text-gray-600 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2">
                        <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs">
                            Sekarang kamu bisa balas chat dari pembeli dan atur toko di Tokopedia Seller.{' '}
                            <span className="text-[#4648d4] font-bold cursor-pointer">Yuk, cek sekarang!</span>
                        </p>
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center px-4">
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
        </section>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────
function EmptyChatWindow() {
    return (
        <section className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center min-w-0">
            <MessageSquare className="size-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">Pilih Percakapan</h3>
            <p className="text-sm text-gray-300 mt-1">Pilih chat dari daftar untuk mulai mengobrol</p>
        </section>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function CustomerChatIndex({
    conversations,
    activeConversation,
    messages,
}: {
    conversations: any;
    activeConversation: any;
    messages: any;
}) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    function handleSelectConversation(slug: string) {
        router.get('/customer/conversations', { conversation: slug }, { preserveState: true });
    }

    function handleBack() {
        router.get('/customer/conversations', {}, { preserveState: true });
    }

    function handleSidebarNavigate(key: string) {
        if (key === 'chat') return;
        if (key === 'transaksi') router.get('/customer/orders');
        else if (key === 'pengaturan') router.get('/customer/settings');
        else if (key === 'ppob') router.get('/ppob');
        else if (key === 'beranda') router.get('/customer/dashboard');
        else router.get(`/customer/dashboard?section=${key}`);
    }

    const hasActive = Boolean(activeConversation && messages);

    return (
        <>
            <Head title="Chat - Kasirku Marketplace" />
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <DashboardSidebar
                        user={user}
                        memberLevel="Silver"
                        pointsToNextLevel={0}
                        activeSection="chat"
                        onNavigate={handleSidebarNavigate}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Chat</h1>
                                <p className="text-slate-500">Kelola percakapan dengan penjual</p>
                            </div>
                        </div>

                        {/* Mobile: list or chat */}
                        {!hasActive && (
                            <div className="flex w-full lg:hidden h-[calc(100vh-280px)]">
                                <ChatListPanel
                                    conversations={conversations}
                                    activeSlug={activeConversation?.slug}
                                    onSelect={handleSelectConversation}
                                />
                            </div>
                        )}
                        {hasActive && (
                            <div className="flex w-full lg:hidden h-[calc(100vh-280px)]">
                                <ChatWindow
                                    conversation={activeConversation}
                                    messages={messages}
                                    onBack={handleBack}
                                />
                            </div>
                        )}

                        {/* Desktop: list + chat side by side */}
                        <div className="hidden lg:flex gap-4 h-[calc(100vh-280px)]">
                            <ChatListPanel
                                conversations={conversations}
                                activeSlug={activeConversation?.slug}
                                onSelect={handleSelectConversation}
                            />
                            {hasActive ? (
                                <ChatWindow
                                    conversation={activeConversation}
                                    messages={messages}
                                    onBack={handleBack}
                                />
                            ) : (
                                <div className="flex-1 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <MessageSquare className="size-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500 text-sm">Pilih percakapan dari daftar untuk mulai mengobrol</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
