'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface LocalAgentStatus {
    available: boolean;
    drivers: string[];
    bluetoothAvailable: boolean;
    usbAvailable: boolean;
    fileAvailable: boolean;
    bluetoothDevice: string;
    bluetoothDeviceExists: boolean;
    usbPrinter: string;
    receiptsDir: string;
}

const AGENT_URL = 'http://localhost:40200';

interface UseLocalPrintAgentResult {
    status: LocalAgentStatus | null;
    isChecking: boolean;
    isPrinting: boolean;
    checkAgent: () => Promise<LocalAgentStatus | null>;
    print: (data: Uint8Array, driver: string, options?: Record<string, string>) => Promise<{ success: boolean; message: string; driver: string }>;
}

export function useLocalPrintAgent(): UseLocalPrintAgentResult {
    const [status, setStatus] = useState<LocalAgentStatus | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const checkedRef = useRef(false);

    const checkAgent = useCallback(async () => {
        try {
            const res = await fetch(`${AGENT_URL}/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });

            if (!res.ok) {
                setStatus(null);
                return null;
            }

            const data = await res.json();
            const result: LocalAgentStatus = {
                available: data.status === 'running',
                drivers: data.drivers?.available ?? [],
                bluetoothAvailable: data.drivers?.bluetooth?.available ?? false,
                usbAvailable: data.drivers?.usb?.available ?? false,
                fileAvailable: data.drivers?.file?.available ?? true,
                bluetoothDevice: data.drivers?.bluetooth?.device ?? '',
                bluetoothDeviceExists: data.drivers?.bluetooth?.device_exists ?? false,
                usbPrinter: data.drivers?.usb?.printer ?? '',
                receiptsDir: data.drivers?.file?.path ?? '',
            };

            setStatus(result);
            return result;
        } catch {
            setStatus(null);
            return null;
        }
    }, []);

    useEffect(() => {
        if (checkedRef.current) return;
        checkedRef.current = true;

        const timeout = setTimeout(() => {
            checkAgent().finally(() => setIsChecking(false));
        }, 300);

        return () => clearTimeout(timeout);
    }, [checkAgent]);

    const print = useCallback(
        async (
            data: Uint8Array,
            driver: string,
            options?: Record<string, string>,
        ) => {
            setIsPrinting(true);

            try {
                const base64Data = btoa(
                    Array.from(data)
                        .map((b) => String.fromCharCode(b))
                        .join(''),
                );

                const res = await fetch(`${AGENT_URL}/print`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: base64Data,
                        driver,
                        options: options ?? {},
                    }),
                    signal: AbortSignal.timeout(35000),
                });

                const result = await res.json();

                return {
                    success: result.success ?? false,
                    message: result.message ?? '',
                    driver: result.driver ?? driver,
                };
            } catch (err: any) {
                return {
                    success: false,
                    message: err?.message || 'Gagal terhubung ke Local Print Agent',
                    driver,
                };
            } finally {
                setIsPrinting(false);
            }
        },
        [],
    );

    return { status, isChecking, checkAgent, isPrinting, print };
}
