import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    ArrowUpDown,
    BarChart3,
    Building2,
    ClipboardList,
    Clock,
    CreditCard,
    History,
    LayoutGrid,
    MessageSquare,
    Package,
    Shield,
    ShoppingCart,
    Tags,
    TicketPercent,
    Truck,
    UserRound,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import brands from '@/routes/brands';
import categories from '@/routes/categories';
import chat from '@/routes/chat';
import customers from '@/routes/customers';
import paymentMethods from '@/routes/payment-methods';
import pos from '@/routes/pos';
import products from '@/routes/products';
import purchaseOrders from '@/routes/purchase-orders';
import reports from '@/routes/reports';
import roles from '@/routes/roles';
import shifts from '@/routes/shifts';
import stockMovements from '@/routes/stock-movements';
import suppliers from '@/routes/suppliers';
import transactions from '@/routes/transactions';
import users from '@/routes/users';
import vouchers from '@/routes/vouchers';
import type { NavItem } from '@/types';

type NavItemDef = NavItem & { permission?: string };

export function AppSidebar() {
    const { tenant, auth, centralAdmin } = usePage().props;
    const isTenant = !!tenant;
    const isSuperAdmin = auth.permissions.includes('manage-tenants');

    const homeUrl =
        isSuperAdmin && !isTenant ? admin.tenants().url : dashboard().url;

    const tenantNavItems: NavItemDef[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
            icon: LayoutGrid,
            group: 'Main',
            permission: 'view-dashboard',
        },
        {
            title: 'Categories',
            href: categories.index().url,
            icon: Tags,
            group: 'Master Data',
            permission: 'manage-categories',
        },
        {
            title: 'Brands',
            href: brands.index().url,
            icon: Tags,
            group: 'Master Data',
            permission: 'manage-brands',
        },
        {
            title: 'Products',
            href: products.index().url,
            icon: Package,
            group: 'Master Data',
            permission: 'manage-products',
        },
        {
            title: 'Payment Methods',
            href: paymentMethods.index().url,
            icon: CreditCard,
            group: 'Master Data',
            permission: 'manage-payment-methods',
        },
        {
            title: 'Suppliers',
            href: suppliers.index().url,
            icon: Truck,
            group: 'Master Data',
            permission: 'manage-suppliers',
        },
        {
            title: 'Customers',
            href: customers.index().url,
            icon: Users,
            group: 'Master Data',
            permission: 'manage-categories',
        },
        {
            title: 'Vouchers',
            href: vouchers.index().url,
            icon: TicketPercent,
            group: 'Master Data',
            permission: 'manage-vouchers',
        },
        {
            title: 'Point of Sale',
            href: pos.index().url,
            icon: ShoppingCart,
            group: 'Transactions',
            permission: 'manage-pos',
        },
        {
            title: 'History',
            href: transactions.history().url,
            icon: History,
            group: 'Transactions',
            permission: 'view-history',
        },
        {
            title: 'Shifts',
            href: shifts.index().url,
            icon: Clock,
            group: 'Transactions',
            permission: 'manage-shifts',
        },
        {
            title: 'Laporan',
            href: reports.index().url,
            icon: BarChart3,
            group: 'Reports',
            permission: 'view-reports',
        },
        {
            title: 'Purchase Orders',
            href: purchaseOrders.index().url,
            icon: ClipboardList,
            group: 'Inventory',
            permission: 'manage-purchases',
        },
        {
            title: 'Stock Movement',
            href: stockMovements.index().url,
            icon: ArrowUpDown,
            group: 'Inventory',
            permission: 'manage-stock',
        },
        {
            title: 'Chat AI',
            href: chat.index().url,
            icon: MessageSquare,
            group: 'Tools',
            permission: 'view-chat',
        },
        {
            title: 'Pengguna',
            href: users.index().url,
            icon: UserRound,
            group: 'Settings',
            permission: 'manage-users',
        },
        {
            title: 'Roles & Permissions',
            href: roles.index().url,
            icon: Shield,
            group: 'Settings',
            permission: 'manage-users',
        },
    ];

    const adminNavItems: NavItemDef[] = [
        {
            title: 'Dashboard',
            href: admin.dashboard().url,
            icon: BarChart3,
            group: 'Admin',
        },
        {
            title: 'Semua Toko',
            href: admin.tenants().url,
            icon: Building2,
            group: 'Admin',
        },
        {
            title: 'Audit Log',
            href: admin.auditLogs().url,
            icon: History,
            group: 'Admin',
        },
    ];

    const switchItems: NavItemDef[] =
        isTenant && (isSuperAdmin || centralAdmin)
            ? [
                  {
                      title: 'Panel Admin',
                      href: admin.leaveStore().url,
                      icon: ArrowLeftRight,
                      group: 'Navigasi',
                  },
              ]
            : [];

    const footerNavItems: NavItem[] = [];

    const items = [
        ...(isTenant ? tenantNavItems : adminNavItems),
        ...switchItems,
    ].filter((item) => {
        if (!item.permission) {
            return true;
        }

        if (isTenant && (isSuperAdmin || centralAdmin)) {
            return true;
        }

        return auth.permissions.includes(item.permission);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeUrl} prefetch>
                                <AppLogo storeName={tenant?.name} />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
