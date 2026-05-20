import { Icon } from '@iconify/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Tenant } from '@/types/tenant';
import type { ColorTheme, ThemePreset } from '@/types/theme';
import { themePresets } from '@/types/theme';

export default function StoreSettings() {
    const { tenant } = usePage().props as { tenant?: Tenant | null };
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const currentTheme = (tenant?.color_theme ?? 'default') as ColorTheme;

    const { data, setData, post, processing, errors } = useForm({
        name: tenant?.name ?? '',
        address: tenant?.address ?? '',
        phone: tenant?.phone ?? '',
        logo: null as File | null,
        color_theme: currentTheme,
        _method: 'PATCH' as const,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/settings/store', {
            forceFormData: true,
            onSuccess: () => {
                setLogoPreview(null);
                toast.success('Store settings updated successfully');
            },
            onError: (err) => {
                const firstError = Object.values(err)[0];

                if (firstError) {
                    toast.error(firstError as string);
                }
            },
            preserveScroll: true,
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleThemeChange = (presetId: string) => {
        setData('color_theme', presetId as ColorTheme);
    };

    return (
        <>
            <Head title="Store settings" />
            <h1 className="sr-only">Store settings</h1>
            <div className="space-y-8">
                <Heading
                    variant="small"
                    title="Store information"
                    description="Update your store name, address, phone number, logo, and theme"
                />
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Store Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="Store name"
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="Store address"
                        />
                        <InputError message={errors.address} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="Phone number"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
                        <div className="mb-4 flex items-center gap-2">
                            <Icon
                                icon="solar:gallery-bold-duotone"
                                className="size-4 text-neutral-400"
                            />
                            <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                Store Logo
                            </Label>
                        </div>
                        <div className="flex items-start gap-6">
                            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/30">
                                {logoPreview || tenant?.logo_url ? (
                                    <img
                                        src={logoPreview ?? tenant!.logo_url!}
                                        className="size-full object-contain"
                                        alt="Logo preview"
                                    />
                                ) : (
                                    <Icon
                                        icon="solar:gallery-round-bold-duotone"
                                        className="size-8 text-neutral-300"
                                    />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="logo"
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-black px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
                                >
                                    <Icon
                                        icon="solar:upload-bold-duotone"
                                        className="size-4"
                                    />
                                    Choose Image
                                </Label>
                                <Input
                                    ref={fileInputRef}
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                <p className="text-[11px] font-medium text-neutral-400">
                                    PNG, JPG, WebP up to 2MB
                                </p>
                                <InputError message={errors.logo} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
                        <div className="mb-4 flex items-center gap-2">
                            <Icon
                                icon="solar:palette-bold-duotone"
                                className="size-4 text-neutral-400"
                            />
                            <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                Color Theme
                            </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {themePresets.map((preset: ThemePreset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleThemeChange(preset.id)}
                                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                                        data.color_theme === preset.id
                                            ? 'border-black bg-neutral-100 dark:border-white dark:bg-neutral-900'
                                            : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700'
                                    }`}
                                >
                                    <div className="flex gap-1">
                                        <div
                                            className="size-5 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    preset.colors.primary,
                                            }}
                                        />
                                        <div
                                            className="size-5 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    preset.colors.sidebar,
                                            }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                                        {preset.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.color_theme} />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            disabled={processing}
                            data-test="update-store-button"
                        >
                            {processing ? (
                                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

StoreSettings.layout = {
    breadcrumbs: [{ title: 'Store settings', href: '/settings/store' }],
};
