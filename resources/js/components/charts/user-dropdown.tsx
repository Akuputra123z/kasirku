'use client';

import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout as logoutRoute } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
    trigger: ReactNode;
    defaultOpen?: boolean;
    align?: 'start' | 'center' | 'end';
};

const UserDropdown = ({ user, trigger, defaultOpen, align = 'end' }: Props) => {
    const getInitials = useInitials();
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.post(logoutRoute().url);
    };

    return (
        <div className="flex items-center justify-center">
            <DropdownMenu defaultOpen={defaultOpen}>
                <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
                <DropdownMenuContent
                    align={align}
                    className="w-3xs rounded-2xl duration-400 data-open:fade-in-0 data-open:slide-in-from-bottom-20! data-closed:fade-out-0 data-closed:slide-out-to-bottom-20 data-closed:zoom-out-100"
                >
                    {/* User Info */}
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3">
                            <div className="relative">
                                <Avatar className="data-[size=lg]:size-8">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                    <AvatarFallback>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute right-0 bottom-0 size-2 rounded-full bg-green-600 ring-2 ring-card" />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-popover-foreground">
                                    {user.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* Settings */}
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link
                                href={edit()}
                                prefetch
                                onClick={cleanup}
                                className="cursor-pointer"
                            >
                                <Settings size={20} />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={handleLogout}
                        className="cursor-pointer"
                    >
                        <LogOut size={20} />
                        <span>Signout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default UserDropdown;
