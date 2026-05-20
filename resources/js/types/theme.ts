export type ColorTheme =
    | 'default'
    | 'emerald'
    | 'violet'
    | 'amber'
    | 'rose'
    | 'blue'
    | 'slate';

export interface ThemePreset {
    id: ColorTheme;
    name: string;
    description: string;
    colors: {
        primary: string;
        sidebar: string;
        ring: string;
        chart1: string;
        chart2: string;
        chart3: string;
    };
}

export const themePresets: ThemePreset[] = [
    {
        id: 'default',
        name: 'Neutral',
        description: 'Classic gray tones',
        colors: {
            primary: 'oklch(0.205 0 0)',
            sidebar: 'oklch(0.985 0 0)',
            ring: 'oklch(0.708 0 0)',
            chart1: 'oklch(0.87 0 0)',
            chart2: 'oklch(0.556 0 0)',
            chart3: 'oklch(0.439 0 0)',
        },
    },
    {
        id: 'emerald',
        name: 'Emerald',
        description: 'Fresh green tones',
        colors: {
            primary: 'oklch(0.5 0.15 160)',
            sidebar: 'oklch(0.98 0.02 160)',
            ring: 'oklch(0.6 0.12 160)',
            chart1: 'oklch(0.65 0.18 160)',
            chart2: 'oklch(0.55 0.14 160)',
            chart3: 'oklch(0.45 0.1 160)',
        },
    },
    {
        id: 'violet',
        name: 'Violet',
        description: 'Purple creative vibes',
        colors: {
            primary: 'oklch(0.48 0.24 290)',
            sidebar: 'oklch(0.98 0.02 290)',
            ring: 'oklch(0.6 0.18 290)',
            chart1: 'oklch(0.65 0.22 290)',
            chart2: 'oklch(0.55 0.18 290)',
            chart3: 'oklch(0.45 0.14 290)',
        },
    },
    {
        id: 'amber',
        name: 'Amber',
        description: 'Warm sunset palette',
        colors: {
            primary: 'oklch(0.55 0.2 70)',
            sidebar: 'oklch(0.98 0.02 70)',
            ring: 'oklch(0.65 0.16 70)',
            chart1: 'oklch(0.7 0.22 70)',
            chart2: 'oklch(0.6 0.18 70)',
            chart3: 'oklch(0.5 0.14 70)',
        },
    },
    {
        id: 'rose',
        name: 'Rose',
        description: 'Soft pink elegance',
        colors: {
            primary: 'oklch(0.5 0.2 15)',
            sidebar: 'oklch(0.98 0.02 15)',
            ring: 'oklch(0.62 0.16 15)',
            chart1: 'oklch(0.65 0.22 15)',
            chart2: 'oklch(0.55 0.18 15)',
            chart3: 'oklch(0.45 0.14 15)',
        },
    },
    {
        id: 'blue',
        name: 'Ocean',
        description: 'Cool blue tones',
        colors: {
            primary: 'oklch(0.5 0.18 250)',
            sidebar: 'oklch(0.98 0.02 250)',
            ring: 'oklch(0.6 0.14 250)',
            chart1: 'oklch(0.68 0.2 250)',
            chart2: 'oklch(0.58 0.16 250)',
            chart3: 'oklch(0.48 0.12 250)',
        },
    },
    {
        id: 'slate',
        name: 'Slate',
        description: 'Modern blue-gray',
        colors: {
            primary: 'oklch(0.3 0.03 250)',
            sidebar: 'oklch(0.97 0.01 250)',
            ring: 'oklch(0.55 0.02 250)',
            chart1: 'oklch(0.6 0.04 250)',
            chart2: 'oklch(0.5 0.03 250)',
            chart3: 'oklch(0.4 0.02 250)',
        },
    },
];
