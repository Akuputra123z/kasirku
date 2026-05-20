import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Cog, Compass, HardDrive, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const errorConfig: Record<
    number,
    {
        icon: typeof Compass;
        title: string;
        message: string;
        action: { label: string; href?: string };
    }
> = {
    404: {
        icon: Compass,
        title: 'Page Not Found',
        message:
            'The page you are looking for does not exist or has been moved.',
        action: { label: 'Back to Dashboard', href: '/' },
    },
    403: {
        icon: Lock,
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        action: { label: 'Go Home', href: '/' },
    },
    500: {
        icon: HardDrive,
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: { label: 'Try Again' },
    },
    503: {
        icon: Cog,
        title: 'Service Unavailable',
        message:
            'The service is temporarily unavailable. Please check back soon.',
        action: { label: 'Refresh' },
    },
};

interface Props {
    status: number;
}

export default function ErrorPage({ status }: Props) {
    const error = errorConfig[status] ?? {
        icon: AlertTriangle,
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        action: { label: 'Back to Dashboard', href: '/' },
    };
    const Icon = error.icon;

    return (
        <>
            <Head title={`${status} - ${error.title}`} />
            <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-6 py-12">
                <div className="flex max-w-md flex-col items-center text-center">
                    <div className="mb-8 flex size-24 items-center justify-center rounded-[2rem] border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                        <Icon className="size-12 text-neutral-500" />
                    </div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 dark:border-neutral-800 dark:bg-neutral-900">
                        <span className="text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
                            Error {status}
                        </span>
                    </div>
                    <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        {error.title}
                    </h1>
                    <p className="mb-8 text-[15px] leading-relaxed text-neutral-500">
                        {error.message}
                    </p>
                    <Button
                        onClick={() => {
                            if (error.action.href) {
                                router.visit(error.action.href);
                            } else {
                                window.location.reload();
                            }
                        }}
                        className="h-12 rounded-2xl bg-black px-8 font-bold text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-black dark:shadow-white/5"
                    >
                        {error.action.label}
                    </Button>
                </div>
            </div>
        </>
    );
}
