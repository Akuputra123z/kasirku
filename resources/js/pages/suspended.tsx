'use client';

import { Head, router } from '@inertiajs/react';
import { ArrowLeftFromLine, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { logout } from '@/routes';

export default function Suspended({ tenantName }: { tenantName: string }) {
    return (
        <>
            <Head title="Account Suspended" />

            <Card className="w-full max-w-md border-none shadow-none">
                <CardHeader className="items-center text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <ShieldAlert className="size-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Account Suspended
                    </CardTitle>
                    <CardDescription className="mt-2 text-[14px] leading-relaxed">
                        Your store{' '}
                        <strong className="text-foreground">
                            {tenantName}
                        </strong>{' '}
                        has been suspended by the administrator.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-xl bg-neutral-50 p-4 text-center text-[13px] font-medium text-muted-foreground dark:bg-neutral-900">
                        You are unable to access the system until your account
                        is reactivated. Please contact the administrator for
                        more information.
                    </div>
                    <Button
                        variant="outline"
                        className="h-12 w-full rounded-2xl font-bold"
                        onClick={() => router.post(logout().url)}
                    >
                        <ArrowLeftFromLine className="size-4" />
                        Logout & Try Again Later
                    </Button>
                </CardContent>
            </Card>
        </>
    );
}
