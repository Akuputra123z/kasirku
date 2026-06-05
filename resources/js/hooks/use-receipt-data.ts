'use client';

import { useState, useCallback } from 'react';
import printRoute from '@/routes/print';

interface UseReceiptDataResult {
    fetchRaw: (transactionId: number) => Promise<Uint8Array>;
    isLoading: boolean;
    error: string | null;
}

export function useReceiptData(): UseReceiptDataResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRaw = useCallback(
        async (transactionId: number): Promise<Uint8Array> => {
            setIsLoading(true);
            setError(null);

            try {
                const csrfToken =
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '';

                const url = printRoute.raw(transactionId).url;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        Accept: 'application/json',
                    },
                });

                const json = await res.json();

                if (!json.success) {
                    throw new Error(
                        json.message || 'Gagal mengambil data struk',
                    );
                }

                const binaryStr = atob(json.data);
                const bytes = new Uint8Array(binaryStr.length);

                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }

                return bytes;
            } catch (err: any) {
                const msg = err?.message || 'Gagal mengambil data struk';
                setError(msg);

                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    return { fetchRaw, isLoading, error };
}
