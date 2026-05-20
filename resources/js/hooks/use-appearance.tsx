import { useSyncExternalStore } from 'react';
import type { ColorTheme } from '@/types/theme';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly colorTheme: ColorTheme;
    readonly updateAppearance: (mode: Appearance) => void;
    readonly updateColorTheme: (theme: ColorTheme) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';
let currentColorTheme: ColorTheme = 'default';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.cookie = `${name}=${value};path=/;max-age=${days * 24 * 60 * 60};SameSite=Lax`;
};

const getStored = (key: string, fallback: string): string => {
    if (typeof window === 'undefined') {
        return fallback;
    }

    return localStorage.getItem(key) || fallback;
};

const isDarkMode = (appearance: Appearance): boolean =>
    appearance === 'dark' || (appearance === 'system' && prefersDark());

const applyAppearance = (): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = isDarkMode(currentAppearance);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const applyColorTheme = (): void => {
    if (typeof document === 'undefined') {
        return;
    }

    for (const candidate of [
        'default',
        'emerald',
        'violet',
        'amber',
        'rose',
        'blue',
        'slate',
    ]) {
        document.documentElement.classList.toggle(
            `theme-${candidate}`,
            candidate === currentColorTheme,
        );
    }
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((l) => l());

const systemMediaQuery = (): MediaQueryList | null =>
    typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

const handleSystemChange = (): void => applyAppearance();

export function initializeTheme(serverTheme?: ColorTheme): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (!localStorage.getItem('appearance')) {
        localStorage.setItem('appearance', 'system');
        setCookie('appearance', 'system');
    }

    if (!localStorage.getItem('color_theme')) {
        localStorage.setItem('color_theme', serverTheme ?? 'default');
    }

    currentAppearance = getStored('appearance', 'system') as Appearance;
    currentColorTheme = getStored(
        'color_theme',
        serverTheme ?? 'default',
    ) as ColorTheme;

    applyAppearance();
    applyColorTheme();
    systemMediaQuery()?.addEventListener('change', handleSystemChange);
}

export function useAppearance(): UseAppearanceReturn {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );

    const colorTheme: ColorTheme = useSyncExternalStore(
        subscribe,
        () => currentColorTheme,
        () => 'default',
    );

    const resolvedAppearance: ResolvedAppearance = isDarkMode(appearance)
        ? 'dark'
        : 'light';

    const updateAppearance = (mode: Appearance): void => {
        currentAppearance = mode;
        localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyAppearance();
        notify();
    };

    const updateColorTheme = (theme: ColorTheme): void => {
        currentColorTheme = theme;
        localStorage.setItem('color_theme', theme);
        applyColorTheme();
        notify();
    };

    return {
        appearance,
        resolvedAppearance,
        colorTheme,
        updateAppearance,
        updateColorTheme,
    } as const;
}
