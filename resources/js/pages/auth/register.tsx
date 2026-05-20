import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Store, User, Mail, Lock, Check, X } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';

export default function Register() {
    const [form, setForm] = useState({
        store_name: '',
        store_slug: '',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-');
        setForm((prev) => ({ ...prev, store_slug: slug }));
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
                    'Accept': 'application/json',
                },
                body: JSON.stringify(form),
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
            setErrors(Object.keys(mapped).length ? mapped : { form: 'Terjadi kesalahan. Silakan coba lagi.' });
        } catch {
            setErrors({ form: 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setProcessing(false);
        }
    };

    const domain = typeof window !== 'undefined' ? window.location.host : '';
    const passwordsMatch =
        form.password &&
        form.password_confirmation &&
        form.password === form.password_confirmation;
    const passwordMinLen = form.password.length >= 8;

    return (
        <>
            <Head title="Buat Toko Baru" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Informasi Toko */}
                <div className="grid gap-1">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Store className="size-4" />
                        Informasi Toko
                    </h3>
                    <p className="mb-3 text-xs text-muted-foreground">
                        Data toko yang akan digunakan untuk login pelanggan
                    </p>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="store_name">Nama Toko</Label>
                        <Input
                            id="store_name"
                            name="store_name"
                            value={form.store_name}
                            onChange={handleChange}
                            required
                            autoFocus
                            placeholder="Contoh: Amerta Komputer"
                        />
                        <InputError message={errors.store_name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="store_slug">Alamat Toko</Label>
                        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                            <span className="text-muted-foreground">
                                https://
                            </span>
                            <Input
                                id="store_slug"
                                name="store_slug"
                                value={form.store_slug}
                                onChange={handleSlugChange}
                                required
                                placeholder="nama-toko"
                                className="inline-flex h-7 min-h-0 w-36 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                            />
                            <span className="break-all text-muted-foreground">
                                .{domain}/
                            </span>
                        </div>
                        <InputError message={errors.store_slug} />
                    </div>
                </div>

                <Separator className="my-2" />

                {/* Informasi Admin */}
                <div className="grid gap-1">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <User className="size-4" />
                        Informasi Admin
                    </h3>
                    <p className="mb-3 text-xs text-muted-foreground">
                        Data pemilik toko untuk login ke sistem
                    </p>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
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
                        />
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
                    {processing ? <Spinner /> : <Store className="size-4" />}
                    {processing ? 'Memproses...' : 'Buat Toko Baru'}
                </Button>

                {errors.form && (
                    <p className="text-center text-sm text-red-600">
                        {errors.form}
                    </p>
                )}

                <div className="text-center text-sm text-muted-foreground">
                    Sudah punya toko? <TextLink href={login()}>Login</TextLink>
                </div>
            </form>
        </>
    );
}

Register.layout = {
    title: 'Buat Toko Baru',
    description: 'Daftarkan toko Anda untuk memulai',
};
