'use client';

import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Menu, Search, Bell, Tags, Package } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import categories from '@/routes/categories';
import products from '@/routes/products';
import type { BreadcrumbItem, NavItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Categories',
        href: categories.index(),
        icon: Tags,
    },
    {
        title: 'Products',
        href: products.index(),
        icon: Package,
    },
];

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

    return (
        <>
            <div className="border-b border-sidebar-border/80 bg-white dark:bg-neutral-900">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-[34px] w-[34px]"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Navigation menu
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem
                                        key={index}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                whenCurrentUrl(
                                                    item.href,
                                                    activeItemStyles,
                                                ),
                                                'h-9 cursor-pointer px-3 font-semibold',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="mr-2 h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {isCurrentUrl(item.href) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* Right Side Actions */}
                    <div className="ml-auto flex items-center space-x-3">
                        <div className="relative flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="group h-9 w-9 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-neutral-800"
                            >
                                <Search className="size-5 opacity-70 group-hover:opacity-100" />
                            </Button>

                            {/* Ikon Notifikasi sesuai Screenshot 2026-05-04 at 04.20.27.jpg */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="group relative h-9 w-9 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-neutral-800"
                            >
                                <div className="absolute top-2.5 right-2.5 size-2 rounded-full border-2 border-white bg-rose-500 dark:border-neutral-900" />
                                <Bell className="size-5 opacity-70 group-hover:opacity-100" />
                            </Button>
                        </div>

                        {/* User Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="group flex items-center gap-3 rounded-2xl border border-transparent p-1 pr-3 transition-all outline-none hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50">
                                    <div className="relative">
                                        <Avatar className="size-9 overflow-hidden rounded-xl border-2 border-white shadow-sm dark:border-neutral-800">
                                            <AvatarImage
                                                src={auth.user?.avatar}
                                                alt={auth.user?.name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="rounded-xl bg-neutral-100 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                {getInitials(
                                                    auth.user?.name ?? '',
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
                                    </div>
                                    <div className="hidden flex-col items-start text-left leading-tight lg:flex">
                                        <span className="line-clamp-1 text-[13px] font-bold text-neutral-900 transition-colors group-hover:text-indigo-600 dark:text-neutral-100">
                                            {auth.user?.name}
                                        </span>
                                        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                                            {auth.user?.email}
                                        </span>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="mt-2 w-56 border-neutral-200 shadow-xl dark:border-neutral-800"
                                align="end"
                            >
                                {auth.user && (
                                    <UserMenuContent user={auth.user} />
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Breadcrumbs Section */}
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70 bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
