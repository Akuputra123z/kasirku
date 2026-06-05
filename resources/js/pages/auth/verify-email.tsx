'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';

export default function VerifyEmail({ status }: { status?: string }) {
    const { errors } = usePage().props;
    const codeError = (errors as any)?.code || '';
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resent, setResent] = useState(false);

    const handleVerify = () => {
        if (otp.length !== 6 || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/email/verify-otp',
            { code: otp },
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleResend = () => {
        const token =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';
        fetch('/email/verification-notification', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': token,
                Accept: 'application/json',
            },
        })
            .then(() => setResent(true))
            .catch(() => {});
    };

    return (
        <>
            <Head title="Verifikasi Email" />

            <div className="mb-4 text-center text-sm font-medium text-green-600">
                {resent
                    ? 'Kode verifikasi baru telah dikirim ke email kamu.'
                    : 'Kode verifikasi telah dikirim ke email kamu.'}
            </div>

            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        onComplete={handleVerify}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                {codeError && (
                    <p className="text-sm font-medium text-red-500">
                        {codeError}
                    </p>
                )}

                <Button
                    onClick={handleVerify}
                    disabled={otp.length !== 6 || isSubmitting}
                    className="w-full"
                >
                    {isSubmitting && <Spinner />}
                    Verifikasi Email
                </Button>

                <div className="flex items-center justify-center gap-4 text-sm">
                    <button
                        type="button"
                        onClick={handleResend}
                        className="font-medium text-primary hover:underline disabled:opacity-50"
                    >
                        Kirim ulang kode
                    </button>

                    <TextLink href={logout()} className="text-sm">
                        Log out
                    </TextLink>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi Email',
    description: 'Masukkan kode 6 digit yang telah dikirim ke email kamu.',
};
