import { usePage } from '@inertiajs/react';
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
    const { auth, tenant } = usePage().props;
    const user = auth.user;
    const getInitials = useInitials();

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
                        <div className="relative cursor-pointer rounded-full p-2 before:absolute before:top-1 before:bottom-0 before:left-1/2 before:z-10 before:h-2 before:w-2 before:rounded-full before:bg-red-500 hover:bg-accent">
                            <BellRing className="size-4" />
                        </div>
                    }
                />
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
            </div>
        </div>
    );
}
