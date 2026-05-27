'use client';
import { Head } from '@inertiajs/react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { themePresets } from '@/types/theme';
import type { ColorTheme } from '@/types/theme';

const modeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
];

function ThemeCard({
    theme,
    isActive,
    onSelect,
}: {
    theme: (typeof themePresets)[number];
    isActive: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'group relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all',
                isActive
                    ? 'border-primary shadow-md shadow-primary/10'
                    : 'border-border hover:border-muted-foreground/30 hover:shadow-sm',
            )}
        >
            {/* Color swatches */}
            <div className="flex gap-1.5" aria-hidden>
                {(['primary', 'sidebar', 'ring'] as const).map(
                    (key) => (
                        <div
                            key={key}
                            className="size-7 rounded-full ring-1 ring-black/5"
                            style={{ backgroundColor: (theme.colors as any)[key] }}
                        />
                    ),
                )}
            </div>

            <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                    {theme.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {theme.description}
                </p>
            </div>

            {isActive && (
                <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary">
                    <Check className="size-3 text-primary-foreground" />
                </div>
            )}
        </button>
    );
}

export default function Themes() {
    const { appearance, colorTheme, updateAppearance, updateColorTheme } =
        useAppearance();

    return (
        <>
            <Head title="Theme settings" />

            <div className="space-y-10">
                {/* Color Theme */}
                <section>
                    <div className="mb-5">
                        <h2 className="text-base font-semibold text-foreground">
                            Color Theme
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Choose a color palette for the dashboard. This
                            affects buttons, sidebar, and charts.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {themePresets.map((t) => (
                            <ThemeCard
                                key={t.id}
                                theme={t}
                                isActive={colorTheme === t.id}
                                onSelect={() => updateColorTheme(t.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Appearance Mode */}
                <section>
                    <div className="mb-5">
                        <h2 className="text-base font-semibold text-foreground">
                            Appearance
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select light, dark, or let the system decide.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {modeOptions.map(({ value, label, icon: Icon }) => (
                            <Button
                                key={value}
                                variant={
                                    appearance === value ? 'default' : 'outline'
                                }
                                onClick={() => updateAppearance(value)}
                                className="h-12 flex-1 gap-2"
                            >
                                <Icon className="size-4" />
                                {label}
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Preview */}
                <section>
                    <div className="mb-5">
                        <h2 className="text-base font-semibold text-foreground">
                            Preview
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            See how the selected theme looks.
                        </p>
                    </div>

                    <Card className="overflow-hidden">
                        <CardContent className="space-y-4 p-6">
                            {/* Mock header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
                                        <span className="text-sm font-bold text-sidebar-primary-foreground">
                                            A
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-2.5 w-24 rounded-full bg-primary/20" />
                                        <div className="h-2 w-16 rounded-full bg-muted" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="size-7 rounded-md bg-primary/10" />
                                    <div className="size-7 rounded-md bg-primary" />
                                </div>
                            </div>

                            {/* Mock chart */}
                            <div className="grid h-24 grid-cols-5 items-end gap-2">
                                {[45, 65, 40, 80, 55].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-full rounded-t-md"
                                        style={{
                                            height: `${h}%`,
                                            backgroundColor: `var(--chart-${(i % 5) + 1})`,
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Mock data row */}
                            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                                <div className="size-2 rounded-full bg-chart-1" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-2 w-full rounded-full bg-primary/10" />
                                    <div className="h-2 w-3/4 rounded-full bg-muted" />
                                </div>
                                <div className="flex h-5 w-16 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
                                    Rp 50K
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

Themes.layout = {
    breadcrumbs: [
        {
            title: 'Theme settings',
            href: '/settings/themes',
        },
    ],
};
