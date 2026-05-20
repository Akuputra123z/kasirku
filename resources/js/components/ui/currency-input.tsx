import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { forwardRef, useCallback } from 'react';

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value' | 'type'> {
    value: string | number;
    onChange: (value: string) => void;
    prefix?: string;
}

const formatRupiah = (value: string): string => {
    const numeric = value.replace(/[^\d]/g, '');
    if (!numeric) return '';
    return new Intl.NumberFormat('id-ID').format(Number(numeric));
};

const unformatRupiah = (formatted: string): string => {
    return formatted.replace(/[^\d]/g, '');
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChange, prefix = 'Rp', className, ...props }, ref) => {
        const displayValue = value ? formatRupiah(String(value)) : '';

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                onChange(raw);
            },
            [onChange],
        );

        const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const raw = unformatRupiah((e.target as HTMLInputElement).value);
                const num = parseInt(raw || '0', 10);
                const step = e.key === 'ArrowUp' ? 1000 : -1000;
                const next = Math.max(0, num + step);
                onChange(String(next));
            }
        }, [onChange]);

        return (
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
                        {prefix}
                    </span>
                )}
                <Input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={cn(prefix && 'pl-10', className)}
                    {...props}
                />
            </div>
        );
    },
);

CurrencyInput.displayName = 'CurrencyInput';
