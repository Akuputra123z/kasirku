'use client';

import { useEffect, useRef, useState } from 'react';

interface BarcodeScannerOptions {
    onScan: (barcode: string) => void;
    minLength?: number;
    timeThreshold?: number;
    enabled?: boolean;
}

interface BarcodeScannerResult {
    lastScanned: string | null;
}

const DEFAULT_MIN_LENGTH = 5;
const DEFAULT_TIME_THRESHOLD = 30;
const BUFFER_TIMEOUT = 100;

export function useBarcodeScanner({
    onScan,
    minLength = DEFAULT_MIN_LENGTH,
    timeThreshold = DEFAULT_TIME_THRESHOLD,
    enabled = true,
}: BarcodeScannerOptions): BarcodeScannerResult {
    const bufferRef = useRef('');
    const lastTimeRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const [lastScanned, setLastScanned] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) {
                return;
            }

            const now = performance.now();
            const elapsed = now - lastTimeRef.current;
            lastTimeRef.current = now;

            if (e.key === 'Enter') {
                e.preventDefault();

                const barcode = bufferRef.current.trim();

                if (barcode.length >= minLength) {
                    setLastScanned(barcode);
                    onScan(barcode);
                }

                bufferRef.current = '';

                return;
            }

            if (e.key === 'Escape') {
                bufferRef.current = '';

                return;
            }

            if (e.ctrlKey || e.altKey || e.metaKey) {
                bufferRef.current = '';

                return;
            }

            if (e.key.length === 1) {
                if (elapsed > timeThreshold && bufferRef.current.length > 0) {
                    bufferRef.current = '';
                }

                bufferRef.current += e.key;
            } else {
                return;
            }

            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                bufferRef.current = '';
            }, BUFFER_TIMEOUT);
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timeoutRef.current);
        };
    }, [enabled, minLength, timeThreshold, onScan]);

    return { lastScanned };
}
