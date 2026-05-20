'use client';

import { Bell } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
    trigger: ReactNode;
    defaultOpen?: boolean;
    align?: 'start' | 'center' | 'end';
};

const NotificationDropdown = ({
    trigger,
    defaultOpen,
    align = 'end',
}: Props) => {
    return (
        <div className="flex items-center justify-center">
            <DropdownMenu defaultOpen={defaultOpen}>
                <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>

                <DropdownMenuContent
                    align={align}
                    className="w-sm rounded-2xl p-0 duration-400 data-open:fade-in-0 data-open:slide-in-from-top-20! data-closed:fade-out-0 data-closed:slide-out-to-top-20 data-closed:zoom-out-100"
                >
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="flex items-center justify-center p-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                                <Bell className="size-6 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        </DropdownMenuLabel>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default NotificationDropdown;
