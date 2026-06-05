import { Head } from '@inertiajs/react';
import { User, Mail, Lock, Check, X, Chrome } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';

type Props = {
    googleUser?: { name: string; email: string; avatar?: string } | null;
};

export default function Register({ googleUser }: Props) {
    const [form, setForm] = useState({
        name: googleUser?.name ?? '',
        email: googleUser?.email ?? '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const csrfToken =
                typeof document !== 'undefined'
                    ? document.querySelector<HTMLMetaElement>(
                          'meta[name=csrf-token]',
                      )?.content || ''
                    : '';
            const res = await fetch('/register/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    ...form,
                    google_registered: !!googleUser,
                }),
            });

            let data;

            try {
                data = await res.json();
            } catch {
                setErrors({ form: 'Terjadi kesalahan. Silakan coba lagi.' });

                return;
            }

            if (data.status === 'success') {
                window.location.href = data.redirect;

                return;
            }

            const mapped: Record<string, string> = {};

            for (const [key, msgs] of Object.entries(data.errors ?? {})) {
                mapped[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
            }

            setErrors(
                Object.keys(mapped).length
                    ? mapped
                    : { form: 'Terjadi kesalahan. Silakan coba lagi.' },
            );
        } catch {
            setErrors({ form: 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setProcessing(false);
        }
    };

    const passwordsMatch =
        form.password &&
        form.password_confirmation &&
        form.password === form.password_confirmation;
    const passwordMinLen = form.password.length >= 8;

    return (
        <>
            <Head title="Buat Akun Baru" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Google Register */}
                {!googleUser && (
                    <>
                        <a
                            href="/auth/google/register-redirect"
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d7d4e7] py-2.5 text-[13px] font-semibold text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
                        >
                            <Chrome className="size-[18px]" />
                            Daftar dengan Google
                        </a>
                        <div className="flex items-center gap-3">
                            <div className="flex-grow border-t border-[#d7d4e7]" />
                            <span className="text-[11px] font-medium text-[#464554]">
                                Atau
                            </span>
                            <div className="flex-grow border-t border-[#d7d4e7]" />
                        </div>
                    </>
                )}

                {/* Google user badge */}
                {googleUser && (
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                        <Chrome className="size-5 shrink-0 text-green-600" />
                        <div className="min-w-0 flex-1 text-sm">
                            <p className="font-medium text-green-800 dark:text-green-200">
                                Akun Google terverifikasi
                            </p>
                            <p className="truncate text-green-600 dark:text-green-400">
                                {googleUser.email}
                            </p>
                        </div>
                    </div>
                )}

                <Separator className="my-2" />

                {/* Informasi Admin */}
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoFocus
                            autoComplete="name"
                            placeholder="Nama lengkap"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            placeholder="email@example.com"
                            className={
                                googleUser
                                    ? 'bg-muted/50 text-muted-foreground'
                                    : ''
                            }
                            readOnly={!!googleUser}
                        />
                        {googleUser && (
                            <p className="text-[11px] text-green-600">
                                Email terverifikasi dari Google
                            </p>
                        )}
                        <InputError message={errors.email} />
                    </div>
                </div>

                {/* Password */}
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            placeholder="Minimal 8 karakter"
                        />
                        {form.password.length > 0 && (
                            <ul className="mt-1 space-y-1">
                                <li className="flex items-center gap-1.5 text-xs">
                                    {passwordMinLen ? (
                                        <Check className="size-3.5 text-green-600" />
                                    ) : (
                                        <X className="size-3.5 text-red-500" />
                                    )}
                                    <span
                                        className={
                                            passwordMinLen
                                                ? 'text-green-700'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        Minimal 8 karakter
                                    </span>
                                </li>
                            </ul>
                        )}
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi Password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            placeholder="Ulangi password"
                        />
                        {form.password_confirmation.length > 0 && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs">
                                {passwordsMatch ? (
                                    <Check className="size-3.5 text-green-600" />
                                ) : (
                                    <X className="size-3.5 text-red-500" />
                                )}
                                <span
                                    className={
                                        passwordsMatch
                                            ? 'text-green-700'
                                            : 'text-muted-foreground'
                                    }
                                >
                                    {passwordsMatch
                                        ? 'Password cocok'
                                        : 'Password belum cocok'}
                                </span>
                            </p>
                        )}
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="mt-2 w-full gap-2"
                    disabled={processing}
                >
                    {processing ? <Spinner /> : <User className="size-4" />}
                    {processing ? 'Memproses...' : 'Daftar'}
                </Button>

                {errors.form && (
                    <p className="text-center text-sm text-red-600">
                        {errors.form}
                    </p>
                )}

                <div className="text-center text-sm text-muted-foreground">
                    Sudah punya akun? <TextLink href={login()}>Login</TextLink>
                </div>
            </form>
        </>
    );
}

Register.layout = {
    title: 'Buat Akun Baru',
    description: 'Daftar untuk memulai',
};
