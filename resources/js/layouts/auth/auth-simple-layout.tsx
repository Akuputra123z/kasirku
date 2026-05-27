import { Link } from '@inertiajs/react';
import { Store } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-sm">
                                <Store className="size-6 text-white" />
                            </div>
                            <span className="text-[16px] font-extrabold tracking-tight text-gray-900">
                                Kasirku
                                <span className="text-indigo-600"> UMKM</span>
                            </span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-bold text-gray-900">
                                {title}
                            </h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
