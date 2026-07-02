import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import MarketplaceLayout from '@/layouts/marketplace-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { configureEcho } from '@laravel/echo-react';

configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'marketplace/landing':
            case name === 'marketplace/stores':
            case name === 'marketplace/store':
            case name === 'marketplace/products':
            case name === 'marketplace/product':
            case name === 'marketplace/cart':
            case name === 'marketplace/checkout':
            case name === 'marketplace/orders':
            case name === 'marketplace/order-detail':
            case name.startsWith('marketplace/ppob/'):
            case name.startsWith('marketplace/chat/'):
            case name === 'marketplace/customer-dashboard':
            case name === 'marketplace/review-create':
            case name === 'marketplace/payment-selection':
                return MarketplaceLayout;
            case name === 'welcome':
            case name === 'marketplace/forgot-password':
            case name === 'marketplace/reset-password':
            case name === 'marketplace/create-store':
                return null;
            case name.startsWith('errors/'):
                return null;
            case name === 'products/barcode-label':
            case name === 'products/barcode-labels':
                return null;
            case name === 'marketplace/login':
            case name === 'marketplace/register':
            case name === 'suspended':
            case name === 'admin/login':
            case name.startsWith('auth/'):
                return AuthLayout;
            case name === 'settings/billing':
                return AppLayout;
            case name === 'settings/billing-success':
                return AppLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: false,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

if (typeof document !== 'undefined') {
    try {
        const el = document.getElementById('__inertia_data');

        if (el?.textContent) {
            const initialPage = JSON.parse(el.textContent);
            const serverTheme = initialPage.props?.tenant?.color_theme;
            initializeTheme(serverTheme);
        } else {
            initializeTheme();
        }
    } catch {
        initializeTheme();
    }
} else {
    initializeTheme();
}
