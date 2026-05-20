import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Store, Search, ArrowRight, LogIn } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    tenantName?: string | null;
    tenantSlug?: string;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
    tenantName,
    tenantSlug: initialSlug = '',
}: Props) {
    const [tenantSlug, setTenantSlug] = useState(initialSlug);
    const [slugLoading, setSlugLoading] = useState(false);

    const tenantNotFound = initialSlug !== '' && !tenantName;

    const goToTenant = () => {
        if (!tenantSlug.trim()) return;

        setSlugLoading(true);
        router.get(`/login?tenant=${encodeURIComponent(tenantSlug.trim())}`);
    };

    return (
        <>
            <Head title="Masuk" />

            <div className="flex flex-col gap-6">
                {/* Tenant info banner */}
                {tenantName ? (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                    <Store className="size-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-muted-foreground">
                                        Anda akan masuk ke
                                    </p>
                                    <p className="truncate font-semibold text-foreground">
                                        {tenantName}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        router.get('/login?_tenant_clear=1')
                                    }
                                    className="shrink-0"
                                >
                                    Ganti
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : canRegister ? (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                    <Search className="size-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <p className="text-sm font-medium">
                                        Mau login ke toko tertentu?
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Masukkan nama toko atau langsung login
                                        di bawah
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Store search */}
                {canRegister && !tenantName ? (
                    <div className="grid gap-2">
                        <Label
                            htmlFor="tenant_slug"
                            className="text-sm font-medium"
                        >
                            Nama Toko
                            <span className="ml-1 font-normal text-muted-foreground">
                                (opsional)
                            </span>
                        </Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Store className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="tenant_slug"
                                    value={tenantSlug}
                                    onChange={(e) =>
                                        setTenantSlug(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && goToTenant()
                                    }
                                    placeholder="nama-toko-anda"
                                    className="pl-9"
                                    autoFocus={!initialSlug}
                                />
                            </div>
                            <Button
                                variant="secondary"
                                onClick={goToTenant}
                                disabled={slugLoading || !tenantSlug.trim()}
                                className="shrink-0 gap-1.5"
                            >
                                {slugLoading ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        Cari
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                        {tenantNotFound && (
                            <p className="text-xs text-red-500">
                                Toko &quot;{initialSlug}&quot; tidak ditemukan.
                                Periksa kembali nama tokonya.
                            </p>
                        )}
                        {!tenantNotFound && (
                            <p className="text-xs text-muted-foreground">
                                Kosongkan jika ingin login sebagai admin pusat
                            </p>
                        )}
                    </div>
                ) : null}

                {canRegister && !tenantName ? (
                    <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            atau
                        </span>
                        <Separator className="flex-1" />
                    </div>
                ) : null}

                {/* Login form */}
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus={!!initialSlug}
                                        autoComplete="email"
                                        placeholder="nama@email.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        {canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="text-xs"
                                            >
                                                Lupa password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        placeholder="Masukkan password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox id="remember" name="remember" />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        Ingat saya
                                    </Label>
                                </div>

                                {status && (
                                    <Badge
                                        variant="secondary"
                                        className="justify-center py-1.5"
                                    >
                                        {status}
                                    </Badge>
                                )}

                                {typeof errors === 'string' && (
                                    <p className="text-center text-sm text-red-600">
                                        {errors}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full gap-2"
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <LogIn className="size-4" />
                                    )}
                                    {processing ? 'Memproses...' : 'Masuk'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {canRegister && (
                    <div className="text-center text-sm text-muted-foreground">
                        Belum punya toko?{' '}
                        <TextLink href={register()}>Buat Toko Baru</TextLink>
                    </div>
                )}

                {/* Admin login link */}
                <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                        Admin pusat?{' '}
                        <a
                            href="/admin/login"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            Login di sini
                        </a>
                    </p>
                </div>

                {/* Demo credentials hint */}
                <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-3">
                    <p className="text-center text-xs leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Demo:
                        </span>{' '}
                        <span className="inline-block">
                            admin@demo-toko.com / password
                        </span>
                    </p>
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke Akun Anda',
    description: 'Masukkan email dan password untuk melanjutkan',
};
