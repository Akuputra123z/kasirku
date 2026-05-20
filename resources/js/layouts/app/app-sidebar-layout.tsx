import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/charts/site-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b border-sidebar-border/50 bg-background/80 px-4 backdrop-blur-md md:px-6">
                    <SiteHeader breadcrumbs={breadcrumbs} />
                </header>
                {children}
            </AppContent>
        </AppShell>
    );
}
