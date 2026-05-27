import type { Auth } from '@/types/auth';
import type { Tenant } from '@/types/tenant';

declare global {
    function route(
        name: string,
        params?: Record<string, string | number> | string | number,
        absolute?: boolean,
    ): string;
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            tenant: Tenant | null;
            sidebarOpen: boolean;
            centralAdmin: boolean;
            [key: string]: unknown;
        };
    }
}
