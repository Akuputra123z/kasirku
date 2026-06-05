'use client';

import { useState, useCallback, useRef } from 'react';

interface UseUsbPrintResult {
    print: (data: Uint8Array) => Promise<void>;
    isSupported: boolean;
    isPrinting: boolean;
    deviceName: string | null;
}

export function useUsbPrint(): UseUsbPrintResult {
    const [isPrinting, setIsPrinting] = useState(false);
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const deviceRef = useRef<USBDevice | null>(null);

    const isSupported = typeof navigator !== 'undefined' && 'usb' in navigator;

    const print = useCallback(
        async (data: Uint8Array) => {
            if (!isSupported) {
                throw new Error(
                    'WebUSB tidak didukung di browser ini. Gunakan Chrome atau Edge versi terbaru.',
                );
            }

            setIsPrinting(true);

            try {
                let device = deviceRef.current;

                if (!device) {
                    device = await navigator.usb!.requestDevice({
                        filters: [
                            { classCode: 0xff },
                            { classCode: 0x02 },
                            { classCode: 0x07 },
                        ],
                    });

                    deviceRef.current = device;
                    setDeviceName(device.productName || 'USB Printer');
                }

                await device.open();

                await device.selectConfiguration(1);

                let endpoint: USBEndpoint | undefined;

                for (const iface of device.configuration!.interfaces) {
                    const alt = iface.alternate;
                    const hasBulkOut = alt.endpoints.some(
                        (ep: USBEndpoint) =>
                            ep.direction === 'out' && ep.type === 'bulk',
                    );

                    if (hasBulkOut) {
                        try {
                            await device.claimInterface(iface.interfaceNumber);
                            endpoint = alt.endpoints.find(
                                (ep: USBEndpoint) =>
                                    ep.direction === 'out' &&
                                    ep.type === 'bulk',
                            );
                            break;
                        } catch {
                            continue;
                        }
                    }
                }

                if (!endpoint) {
                    for (const iface of device.configuration!.interfaces) {
                        try {
                            await device.claimInterface(iface.interfaceNumber);
                            const ep = iface.alternate.endpoints.find(
                                (ep: USBEndpoint) => ep.direction === 'out',
                            );

                            if (ep) {
                                endpoint = ep;
                                break;
                            }
                        } catch {
                            continue;
                        }
                    }
                }

                if (!endpoint) {
                    throw new Error(
                        'Tidak dapat menemukan endpoint USB untuk menulis data. Pastikan printer terhubung.',
                    );
                }

                await device.transferOut(
                    endpoint.endpointNumber,
                    data.buffer as ArrayBuffer,
                );

                await new Promise((r) => setTimeout(r, 1000));
                device.close();
            } catch (err: any) {
                deviceRef.current = null;
                setDeviceName(null);

                throw new Error(err?.message || 'Gagal mencetak via USB.');
            } finally {
                setIsPrinting(false);
            }
        },
        [isSupported],
    );

    return { print, isSupported, isPrinting, deviceName };
}
