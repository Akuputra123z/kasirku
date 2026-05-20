import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { Tenant } from '@/types/tenant';

export default function AppLogo({ storeName }: { storeName?: string }) {
    const { tenant } = usePage().props as { tenant?: Tenant | null };
    const name = storeName ?? tenant?.name ?? '';

    return (
        <div className="flex min-w-0 items-center gap-3">
            <AppLogoIcon className="size-10 shrink-0" />
            {name && (
                <span className="truncate text-sm font-semibold group-data-[state=collapsed]:hidden"></span>
            )}
        </div>
    );
}
