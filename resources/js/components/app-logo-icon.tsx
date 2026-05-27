import { usePage } from '@inertiajs/react';
import type { ImgHTMLAttributes } from 'react';
import type { Tenant } from '@/types/tenant';

interface AppLogoIconProps extends ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
}

export default function AppLogoIcon({
    src,
    className,
    ...imageProps
}: AppLogoIconProps) {
    const { tenant } = usePage().props as { tenant?: Tenant | null };
    const logoUrl = src ?? tenant?.logo_url ?? '/biji.png';

    return (
        <img
            {...imageProps}
            src={logoUrl}
            alt="Logo"
            className={`shrink-0 object-contain ${className || 'h-8 w-8'}`}
        />
    );
}
