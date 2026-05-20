import { useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { LogIn, Shield } from 'lucide-react';
import AuthLayout from '@/layouts/auth-layout';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function AdminLogin() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <>
            <Head title="Admin - Masuk" />

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="size-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Panel Admin</CardTitle>
                    <CardDescription>
                        Masuk sebagai administrator pusat
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                                autoFocus
                                autoComplete="email"
                                placeholder="superadmin@mypos.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                required
                                autoComplete="current-password"
                                placeholder="Masukkan password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) =>
                                    setData('remember', !!checked)
                                }
                            />
                            <Label
                                htmlFor="remember"
                                className="cursor-pointer text-sm font-normal"
                            >
                                Ingat saya
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full gap-2"
                            disabled={processing}
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <LogIn className="size-4" />
                            )}
                            {processing ? 'Memproses...' : 'Masuk'}
                        </Button>

                        {typeof errors === 'string' && (
                            <p className="text-center text-sm text-red-600">
                                {errors}
                            </p>
                        )}
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Login untuk pengguna toko?{' '}
                        <a
                            href="/login"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            Masuk di sini
                        </a>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

AdminLogin.layout = {
    title: 'Admin Panel',
    description: 'Masuk sebagai administrator pusat',
};
