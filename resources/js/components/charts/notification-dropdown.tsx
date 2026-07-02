'use client';

import { useCallback, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Bell, BellRing, MessageSquare, CheckCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type Props = {
    trigger: ReactNode;
    defaultOpen?: boolean;
    align?: 'start' | 'center' | 'end';
};

export default function NotificationDropdown({
    trigger,
    defaultOpen,
    align = 'end',
}: Props) {
    const { auth, notifications: initialNotifications } = usePage().props as any;
    const userId = auth?.user?.id;

    const [unreadCount, setUnreadCount] = useState(initialNotifications?.unreadCount ?? 0);
    const [items, setItems] = useState(initialNotifications?.latest ?? []);
    const [open, setOpen] = useState(false);

    useEcho(
        userId ? `App.Models.User.${userId}` : null,
        ['.NewNotification'],
        (e: any) => {
            setUnreadCount(e.unreadCount);
            setItems((prev: any[]) => {
                if (prev.some((n: any) => n.id === e.notification.id)) return prev;
                return [e.notification, ...prev].slice(0, 5);
            });
        },
        [userId],
    );

    const handleMarkRead = useCallback(async (id: string) => {
        try {
            await fetch(`/notifications/${id}/read`, { method: 'POST', headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content } });
        } catch {}
        setItems((prev) => prev.filter((n: any) => n.id !== id));
        setUnreadCount((c: number) => Math.max(0, c - 1));
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        try {
            await fetch('/notifications/read-all', { method: 'POST', headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content } });
        } catch {}
        setItems([]);
        setUnreadCount(0);
    }, []);

    return (
        <div className="flex items-center justify-center">
            <DropdownMenu defaultOpen={defaultOpen} open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

                <DropdownMenuContent
                    align={align}
                    className="w-sm rounded-2xl p-0 duration-400 data-open:fade-in-0 data-open:slide-in-from-top-20! data-closed:fade-out-0 data-closed:slide-out-to-top-20 data-closed:zoom-out-100"
                >
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 border-b">
                            <span className="text-sm font-semibold">Notifikasi</span>
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllRead}>
                                    <CheckCheck className="size-3 mr-1" />
                                    Baca semua
                                </Button>
                            )}
                        </DropdownMenuLabel>

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                                <Bell className="size-6 opacity-50" />
                                <p className="text-sm">Tidak ada notifikasi</p>
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto">
                                {items.map((n: any) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handleMarkRead(n.id)}
                                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                                <MessageSquare className="size-4 text-blue-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-foreground">
                                                    {n.data?.sender_name ?? 'Pengguna'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                    {n.data?.body ?? ''}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                    {n.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
