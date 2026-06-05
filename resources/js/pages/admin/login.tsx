'use client';

import { useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { LogIn, Shield } from 'lucide-react';
import type { FormEventHandler } from 'react';
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

            <Card className="w-full max-w-md border-gray-100 shadow-lg shadow-indigo-100/30">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-sm">
                        <Shield className="size-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">
                        Panel Admin
                    </CardTitle>
                    <CardDescription className="text-gray-500">
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
                                className="border-gray-200 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                                className="border-gray-200 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                                className="data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600"
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
                            className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200/50 transition-all hover:brightness-90 active:scale-[0.97]"
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
                            className="font-bold text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline"
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
    title: 'Panel Admin',
    description: 'Masuk sebagai administrator pusat',
};
