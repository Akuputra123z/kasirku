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
        <div className="relative flex w-full items-center justify-start">
            <img
                {...imageProps}
                src={logoUrl}
                alt="Logo"
                className={`relative z-10 shrink-0 object-contain ${className || 'h-8 w-8'}`}
            />
            <span className="absolute left-10 text-lg font-bold whitespace-nowrap text-gray-800 transition-opacity duration-300 group-data-[state=collapsed]:pointer-events-none group-data-[state=collapsed]:opacity-0">
                {tenant?.name}
            </span>
        </div>
    );
}
