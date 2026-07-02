import { Link, usePage } from '@inertiajs/react';
import { BellRing, SearchIcon, Store } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import NotificationDropdown from '@/components/charts/notification-dropdown';
import UserDropdown from '@/components/charts/user-dropdown';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';

import type { BreadcrumbItem } from '@/types';

export function SiteHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
    const { auth, tenant, notifications } = usePage().props;
    const user = auth?.user ?? null;
    const getInitials = useInitials();
    const unreadCount = (notifications as any)?.unreadCount ?? 0;

    return (
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 h-8 w-8 cursor-pointer" />
                {tenant && (
                    <span className="mr-2 hidden items-center gap-1.5 text-sm font-medium text-muted-foreground md:flex">
                        <Store className="h-3.5 w-3.5" />
                        {tenant.name}
                    </span>
                )}
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <InputGroup className="h-9 rounded-md">
                    <InputGroupInput placeholder="Search" />
                    <InputGroupAddon>
                        <SearchIcon />
                    </InputGroupAddon>
                </InputGroup>
            </div>
            <div className="flex items-center gap-3">
                <NotificationDropdown
                    defaultOpen={false}
                    align="center"
                    trigger={
                        <div className="relative cursor-pointer rounded-full p-2 hover:bg-accent">
                            <BellRing className="size-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                    }
                />
                {(auth.user?.has_customer_account || auth.user?.has_store) && (
                    <Link
                        href="/customer/dashboard"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#4648d4] hover:bg-[#4648d4]/10 transition-colors"
                    >
                        <Store className="size-4" />
                        <span className="hidden sm:inline">Marketplace</span>
                    </Link>
                )}
                {user && (
                    <UserDropdown
                        user={user}
                        defaultOpen={false}
                        align="center"
                        trigger={
                            <div className="cursor-pointer rounded-full ring-2 ring-border ring-offset-2 transition-all hover:ring-accent">
                                <Avatar className="size-9 border border-border shadow-sm">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-muted font-bold text-muted-foreground">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        }
                    />
                )}
            </div>
        </div>
    );
}
