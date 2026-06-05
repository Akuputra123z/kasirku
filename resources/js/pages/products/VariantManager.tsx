'use client';

import { Icon } from '@iconify/react';
import { Plus, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductVariant {
    id?: number;
    name: string;
    additional_price: number | string;
    stock: number | string;
    sku: string | null;
}

interface VariantManagerProps {
    variants: ProductVariant[];
    onChange: (variants: ProductVariant[]) => void;
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
    const addVariant = () => {
        onChange([
            ...variants,
            { name: '', additional_price: 0, stock: 0, sku: '' },
        ]);
    };

    const removeVariant = (index: number) => {
        onChange(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (
        index: number,
        field: keyof ProductVariant,
        value: any,
    ) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        onChange(newVariants);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <Label className="text-[12px] font-black tracking-[0.2em] text-neutral-400 uppercase">
                        Available Variants
                    </Label>
                    <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
                        Define different versions of this product
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                    className="h-9 gap-2 rounded-xl border-neutral-200 px-4 text-[12px] font-bold transition-all hover:bg-neutral-50 active:scale-95 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    <Plus className="size-3.5" /> Add New Variant
                </Button>
            </div>

            {variants.length === 0 ? (
                <div className="rounded-[2rem] border-2 border-dashed border-neutral-100 bg-neutral-50/30 p-12 text-center dark:border-neutral-900/50 dark:bg-neutral-900/10">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <Icon
                            icon="solar:layers-bold-duotone"
                            className="size-8 text-neutral-300"
                        />
                    </div>
                    <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
                        No Variants Defined
                    </p>
                    <p className="mx-auto mt-1 max-w-[200px] text-[12px] font-medium text-neutral-400">
                        Add variants to offer different prices or track stock
                        for specific versions.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {variants.map((variant, index) => (
                        <div
                            key={index}
                            className="group relative grid animate-in grid-cols-1 gap-4 rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 fade-in slide-in-from-top-2 hover:border-neutral-300 hover:shadow-md md:grid-cols-12 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                        >
                            <div className="space-y-2 md:col-span-4">
                                <div className="ml-1 flex items-center gap-2">
                                    <Icon
                                        icon="solar:pen-new-square-bold-duotone"
                                        className="size-3 text-neutral-400"
                                    />
                                    <Label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                                        Name
                                    </Label>
                                </div>
                                <Input
                                    placeholder="e.g. Large, 1kg, etc."
                                    value={variant.name}
                                    onChange={(e) =>
                                        updateVariant(
                                            index,
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 rounded-xl border-neutral-100 bg-neutral-50/50 text-[13px] font-bold transition-all focus:bg-white dark:border-neutral-800 dark:bg-neutral-950/50 dark:focus:bg-neutral-950"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-3">
                                <div className="ml-1 flex items-center gap-2">
                                    <Icon
                                        icon="solar:wad-of-money-bold-duotone"
                                        className="size-3 text-neutral-400"
                                    />
                                    <Label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                                        Add. Price
                                    </Label>
                                </div>
                                <CurrencyInput
                                    value={variant.additional_price}
                                    onChange={(v) =>
                                        updateVariant(
                                            index,
                                            'additional_price',
                                            v,
                                        )
                                    }
                                    prefix="+Rp"
                                    placeholder="0"
                                    className="h-10 rounded-xl border-neutral-100 bg-neutral-50/50 text-[13px] font-bold transition-all focus:bg-white dark:border-neutral-800 dark:bg-neutral-950/50 dark:focus:bg-neutral-950"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <div className="ml-1 flex items-center gap-2">
                                    <Icon
                                        icon="solar:box-bold-duotone"
                                        className="size-3 text-neutral-400"
                                    />
                                    <Label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                                        Stock
                                    </Label>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={variant.stock}
                                    onChange={(e) => {
                                        const val = e.target.value;

                                        if (val.startsWith('-')) {
                                            updateVariant(
                                                index,
                                                'stock',
                                                val.replace('-', ''),
                                            );
                                        } else {
                                            updateVariant(index, 'stock', val);
                                        }
                                    }}
                                    className="h-10 rounded-xl border-neutral-100 bg-neutral-50/50 text-center text-[13px] font-bold transition-all focus:bg-white dark:border-neutral-800 dark:bg-neutral-950/50 dark:focus:bg-neutral-950"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <div className="ml-1 flex items-center gap-2">
                                    <Icon
                                        icon="solar:qr-code-bold-duotone"
                                        className="size-3 text-neutral-400"
                                    />
                                    <Label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                                        SKU
                                    </Label>
                                </div>
                                <Input
                                    placeholder="SKU"
                                    value={variant.sku || ''}
                                    onChange={(e) =>
                                        updateVariant(
                                            index,
                                            'sku',
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 rounded-xl border-neutral-100 bg-neutral-50/50 text-[13px] font-bold transition-all focus:bg-white dark:border-neutral-800 dark:bg-neutral-950/50 dark:focus:bg-neutral-950"
                                />
                            </div>

                            <div className="flex items-end pb-0.5 md:col-span-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeVariant(index)}
                                    className="size-10 rounded-xl text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
