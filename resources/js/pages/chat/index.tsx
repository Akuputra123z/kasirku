import { Head, usePage } from '@inertiajs/react';
import {
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    RefreshCw,
    MessageSquare,
    AlertCircle,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import chat from '@/routes/chat';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface PageProps extends Record<string, unknown> {
    auth: { user: { name: string } };
}

const suggestions = [
    'Produk apa saja yang stoknya menipis?',
    'Berapa total pendapatan hari ini?',
    'Tampilkan 5 produk terlaris bulan ini',
    'Ada shift kasir yang sedang aktif?',
];

function getCsrfToken(): string {
    const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return meta?.content ?? '';
}

function renderContent(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }

        const lines = part.split('\n');

        return lines.map((line, j) => (
            <span key={`${i}-${j}`}>
                {j > 0 && <br />}
                {line.startsWith('- ') ? (
                    <span className="ml-3 block">• {line.slice(2)}</span>
                ) : (
                    line
                )}
            </span>
        ));
    });
}

export default function ChatIndex() {
    const { auth } = usePage<PageProps>().props;
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Halo, ${auth.user.name}! 👋 Saya **Amerta AI**, asisten cerdas untuk sistem POS Amerta Komputer. Saya bisa membantu:\n\n• Cek stok & info produk\n• Lihat laporan transaksi & penjualan\n• Informasi pelanggan & poin\n• Cek voucher & diskon\n• Info shift kasir\n• Tips bisnis & manajemen toko\n\nAda yang bisa saya bantu?`,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text: string = input.trim()) => {
        if (!text || isLoading) {
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(chat.send().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    conversation_id: conversationId,
                }),
            });

            const data = await res.json();

            if (!res.ok || data.status === 'error') {
                throw new Error(data.message ?? 'Gagal menghubungi server.');
            }

            if (data.conversation_id) {
                setConversationId(data.conversation_id);
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (e: any) {
            setError(e.message ?? 'Terjadi kesalahan. Coba lagi.');
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: `Halo lagi, ${auth.user.name}! Percakapan baru dimulai. Ada yang ingin Anda tanyakan?`,
                timestamp: new Date(),
            },
        ]);
        setConversationId(null);
        setError(null);
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <Head title="AI Chat" />

            <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 pb-4">
                <div className="mb-3 flex items-center justify-between border-b border-border py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base leading-tight font-semibold text-foreground">
                                Amerta AI
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Asisten POS cerdas — Llama 3.3 70B
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={resetChat}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Chat Baru
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto scroll-smooth pr-1">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                'flex animate-in gap-3 duration-300 fade-in slide-in-from-bottom-2',
                                msg.role === 'user'
                                    ? 'flex-row-reverse'
                                    : 'flex-row',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white shadow-sm',
                                    msg.role === 'assistant'
                                        ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                                        : 'bg-gradient-to-br from-slate-500 to-slate-700',
                                )}
                            >
                                {msg.role === 'assistant' ? (
                                    <Bot className="h-4 w-4" />
                                ) : (
                                    <User className="h-4 w-4" />
                                )}
                            </div>
                            <div
                                className={cn(
                                    'group max-w-[78%]',
                                    msg.role === 'user'
                                        ? 'items-end'
                                        : 'items-start',
                                    'flex flex-col gap-1',
                                )}
                            >
                                <div
                                    className={cn(
                                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                                        msg.role === 'assistant'
                                            ? 'rounded-tl-sm border border-border bg-card text-card-foreground'
                                            : 'rounded-tr-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'break-words whitespace-pre-wrap',
                                            msg.role === 'user'
                                                ? 'text-sm'
                                                : 'text-sm',
                                        )}
                                    >
                                        {renderContent(msg.content)}
                                    </div>
                                </div>
                                <span className="px-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex animate-in gap-3 duration-300 fade-in">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex justify-center">
                            <div className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
                                <AlertCircle className="h-3.5 w-3.5" /> {error}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 && (
                    <div className="my-3 grid grid-cols-2 gap-2">
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs leading-snug text-muted-foreground transition-all hover:border-violet-400/50 hover:bg-muted hover:text-foreground"
                            >
                                <MessageSquare className="mr-1.5 inline h-3 w-3 text-violet-400" />{' '}
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-3 flex items-end gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-all focus-within:border-violet-400/60 focus-within:shadow-md focus-within:shadow-violet-500/10">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tanya apa saja tentang bisnis, produk, laporan..."
                        rows={1}
                        className="max-h-32 flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                        style={{ scrollbarWidth: 'none' }}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all',
                            input.trim() && !isLoading
                                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md hover:scale-105 hover:shadow-violet-500/30 active:scale-95'
                                : 'cursor-not-allowed bg-muted text-muted-foreground',
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                    Tekan{' '}
                    <kbd className="rounded bg-muted px-1 text-[10px]">
                        Enter
                    </kbd>{' '}
                    untuk kirim ·{' '}
                    <kbd className="rounded bg-muted px-1 text-[10px]">
                        Shift+Enter
                    </kbd>{' '}
                    untuk baris baru
                </p>
            </div>
        </>
    );
}
