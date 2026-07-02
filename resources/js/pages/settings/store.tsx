'use client';
import { Icon } from '@iconify/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState, useEffect, useCallback } from 'react';
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

    const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
    const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState('');
    const [selectedCityId, setSelectedCityId] = useState('');

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        address: string;
        phone: string;
        logo: File | null;
        color_theme: ColorTheme;
        receipt_footer: string;
        print_driver: string;
        print_usb_printer: string;
        print_bluetooth_device: string;
        print_bluetooth_mac: string;
        print_network_host: string;
        print_network_port: number;
        print_windows_printer: string;
        city: string;
        province: string;
        rajaongkir_city_id: string;
        shipping_cost: number;
        store_description: string;
        _method: 'PATCH';
    }>({
        name: tenant?.name ?? '',
        address: tenant?.address ?? '',
        phone: tenant?.phone ?? '',
        logo: null,
        color_theme: currentTheme,
        receipt_footer:
            (tenant as any)?.settings?.receipt_footer ?? 'TERIMA KASIH',
        print_driver: (tenant as any)?.settings?.printing?.driver ?? 'file',
        print_usb_printer:
            (tenant as any)?.settings?.printing?.connectors?.usb?.printer ?? '',
        print_bluetooth_device:
            (tenant as any)?.settings?.printing?.connectors?.bluetooth
                ?.device ?? '',
        print_bluetooth_mac:
            (tenant as any)?.settings?.printing?.connectors?.bluetooth?.mac ??
            '',
        print_network_host:
            (tenant as any)?.settings?.printing?.connectors?.network?.host ??
            '127.0.0.1',
        print_network_port:
            (tenant as any)?.settings?.printing?.connectors?.network?.port ??
            9100,
        print_windows_printer:
            (tenant as any)?.settings?.printing?.connectors?.windows?.printer ??
            '',
        city: (tenant as any)?.city ?? '',
        province: (tenant as any)?.province ?? '',
        rajaongkir_city_id: (tenant as any)?.rajaongkir_city_id ?? '',
        shipping_cost: (tenant as any)?.shipping_cost ?? 0,
        store_description: (tenant as any)?.store_description ?? '',
        _method: 'PATCH',
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

    const fetchProvinces = useCallback(async () => {
        try {
            const res = await fetch('/rajaongkir/provinces');
            const data = await res.json();
            if (Array.isArray(data)) setProvinces(data);
        } catch {}
    }, []);

    const fetchDistricts = useCallback(async (cityId?: string) => {
        if (!cityId) { setDistricts([]); return; }
        setLoadingDistricts(true);
        try {
            const res = await fetch(`/rajaongkir/districts/${cityId}`);
            const data = await res.json();
            if (Array.isArray(data)) setDistricts(data);
        } catch {} finally {
            setLoadingDistricts(false);
        }
    }, []);

    const fetchCities = useCallback(async (provinceId?: string) => {
        if (!provinceId) { setCities([]); return; }
        setLoadingCities(true);
        try {
            const res = await fetch(`/rajaongkir/cities/${provinceId}`);
            const data = await res.json();
            if (Array.isArray(data)) setCities(data);
        } catch {} finally {
            setLoadingCities(false);
        }
    }, []);

    useEffect(() => { fetchProvinces(); }, [fetchProvinces]);

    useEffect(() => {
        if (provinces.length > 0 && data.province) {
            const p = provinces.find(p => p.name === data.province);
            if (p) setSelectedProvinceId(String(p.id));
        }
    }, [provinces, data.province]);

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
                    <div className="grid gap-2">
                        <Label htmlFor="receipt_footer">
                            Receipt Footer Text
                        </Label>
                        <Input
                            id="receipt_footer"
                            value={data.receipt_footer}
                            onChange={(e) =>
                                setData('receipt_footer', e.target.value)
                            }
                            placeholder="TERIMA KASIH"
                        />
                        <p className="text-[11px] font-medium text-neutral-400">
                            Appears at the bottom of printed receipts
                        </p>
                        <InputError message={errors.receipt_footer} />
                    </div>

                    <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
                        <div className="mb-4 flex items-center gap-2">
                            <Icon
                                icon="solar:cart-bold-duotone"
                                className="size-5 text-neutral-400"
                            />
                            <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                Marketplace & Shipping Settings
                            </Label>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="province">Province</Label>
                                    <select
                                        id="province"
                                        value={selectedProvinceId}
                                        onChange={(e) => {
                                            const p = provinces.find(p => String(p.id) === e.target.value);
                                            setSelectedProvinceId(e.target.value);
                                            setSelectedCityId('');
                                            setDistricts([]);
                                            setData('province', p?.name ?? '');
                                            setData('rajaongkir_city_id', '');
                                            setData('city', '');
                                            fetchCities(e.target.value);
                                        }}
                                        className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
                                    >
                                        <option value="">Select Province</option>
                                        {provinces.map((p) => (
                                            <option key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.province} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="citySelect">City</Label>
                                    <select
                                        id="citySelect"
                                        value={selectedCityId}
                                        onChange={(e) => {
                                            const c = cities.find(c => String(c.id) === e.target.value);
                                            setSelectedCityId(e.target.value);
                                            setData('rajaongkir_city_id', '');
                                            setData('city', c?.name ?? '');
                                            fetchDistricts(e.target.value);
                                        }}
                                        disabled={loadingCities || !selectedProvinceId}
                                        className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
                                    >
                                        <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                                        {cities.map((c) => (
                                            <option key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="rajaongkir_city_id">District</Label>
                                    <select
                                        id="rajaongkir_city_id"
                                        value={data.rajaongkir_city_id}
                                        onChange={(e) => {
                                            const d = districts.find(d => String(d.id) === e.target.value);
                                            setData('rajaongkir_city_id', e.target.value);
                                            if (d) setData('city', d.name);
                                        }}
                                        disabled={loadingDistricts || !selectedCityId}
                                        className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
                                    >
                                        <option value="">{loadingDistricts ? 'Loading...' : 'Select District'}</option>
                                        {districts.map((d) => (
                                            <option key={d.id} value={String(d.id)}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.rajaongkir_city_id} />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="shipping_cost">Shipping Cost (Rp)</Label>
                                    <Input
                                        id="shipping_cost"
                                        type="number"
                                        value={data.shipping_cost}
                                        onChange={(e) =>
                                            setData('shipping_cost', parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="0"
                                    />
                                    <p className="text-[11px] font-medium text-neutral-400">
                                        Flat shipping cost used as fallback when RajaOngkir is unavailable
                                    </p>
                                    <InputError message={errors.shipping_cost} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="store_description">Store Description</Label>
                                <Textarea
                                    id="store_description"
                                    value={data.store_description}
                                    onChange={(e) =>
                                        setData('store_description', e.target.value)
                                    }
                                    placeholder="Describe your store for the marketplace"
                                    rows={3}
                                />
                                <InputError message={errors.store_description} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
                        <div className="mb-4 flex items-center gap-2">
                            <Icon
                                icon="solar:printer-bold-duotone"
                                className="size-5 text-neutral-400"
                            />
                            <Label className="text-[12px] font-bold tracking-widest text-neutral-500 uppercase">
                                Thermal Printer Settings
                            </Label>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="print_driver">
                                    Printer Driver
                                </Label>
                                <select
                                    id="print_driver"
                                    value={data.print_driver}
                                    onChange={(e) =>
                                        setData('print_driver', e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
                                >
                                    <option value="file">
                                        Save to File (.bin)
                                    </option>
                                    <option value="usb">
                                        USB Printer (CUPS / lp)
                                    </option>
                                    <option value="bluetooth">
                                        Bluetooth Printer (Serial / Python)
                                    </option>
                                    <option value="network">
                                        Network Printer (TCP Socket)
                                    </option>
                                    <option value="windows">
                                        Windows Shared Printer (SMB)
                                    </option>
                                </select>
                                <p className="text-[11px] font-medium text-neutral-400">
                                    Select the default printer driver for
                                    receipt printing.
                                </p>
                                <InputError message={errors.print_driver} />
                            </div>

                            {data.print_driver === 'usb' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="print_usb_printer">
                                        USB Printer Name (CUPS)
                                    </Label>
                                    <Input
                                        id="print_usb_printer"
                                        value={data.print_usb_printer}
                                        onChange={(e) =>
                                            setData(
                                                'print_usb_printer',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. STMicroelectronics_58Printer or POS-58"
                                    />
                                    <p className="text-[11px] font-medium text-neutral-400">
                                        The printer queue name registered in the
                                        CUPS system (macOS/Linux).
                                    </p>
                                    <InputError
                                        message={errors.print_usb_printer}
                                    />
                                </div>
                            )}

                            {data.print_driver === 'bluetooth' && (
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="print_bluetooth_device">
                                            Bluetooth Serial Port
                                        </Label>
                                        <Input
                                            id="print_bluetooth_device"
                                            value={data.print_bluetooth_device}
                                            onChange={(e) =>
                                                setData(
                                                    'print_bluetooth_device',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. /dev/cu.RPP02N or /dev/rfcomm0"
                                        />
                                        <p className="text-[11px] font-medium text-neutral-400">
                                            The serial device path for the
                                            Bluetooth printer.
                                        </p>
                                        <InputError
                                            message={
                                                errors.print_bluetooth_device
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="print_bluetooth_mac">
                                            Bluetooth MAC Address (Optional)
                                        </Label>
                                        <Input
                                            id="print_bluetooth_mac"
                                            value={data.print_bluetooth_mac}
                                            onChange={(e) =>
                                                setData(
                                                    'print_bluetooth_mac',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. 00:11:22:33:44:55"
                                        />
                                        <p className="text-[11px] font-medium text-neutral-400">
                                            MAC Address of the Bluetooth
                                            printer.
                                        </p>
                                        <InputError
                                            message={errors.print_bluetooth_mac}
                                        />
                                    </div>
                                </div>
                            )}

                            {data.print_driver === 'network' && (
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="print_network_host">
                                            Printer IP / Host
                                        </Label>
                                        <Input
                                            id="print_network_host"
                                            value={data.print_network_host}
                                            onChange={(e) =>
                                                setData(
                                                    'print_network_host',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. 192.168.1.100"
                                        />
                                        <p className="text-[11px] font-medium text-neutral-400">
                                            IP address of the network printer.
                                        </p>
                                        <InputError
                                            message={errors.print_network_host}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="print_network_port">
                                            Network Port
                                        </Label>
                                        <Input
                                            id="print_network_port"
                                            type="number"
                                            value={data.print_network_port}
                                            onChange={(e) =>
                                                setData(
                                                    'print_network_port',
                                                    parseInt(e.target.value) ||
                                                        9100,
                                                )
                                            }
                                            placeholder="9100"
                                        />
                                        <p className="text-[11px] font-medium text-neutral-400">
                                            The network port of the printer
                                            (default: 9100).
                                        </p>
                                        <InputError
                                            message={errors.print_network_port}
                                        />
                                    </div>
                                </div>
                            )}

                            {data.print_driver === 'windows' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="print_windows_printer">
                                        Windows Shared Printer Path
                                    </Label>
                                    <Input
                                        id="print_windows_printer"
                                        value={data.print_windows_printer}
                                        onChange={(e) =>
                                            setData(
                                                'print_windows_printer',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. //ComputerName/SharedPrinterName"
                                    />
                                    <p className="text-[11px] font-medium text-neutral-400">
                                        SMB network share path for the printer
                                        in Windows.
                                    </p>
                                    <InputError
                                        message={errors.print_windows_printer}
                                    />
                                </div>
                            )}
                        </div>
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
