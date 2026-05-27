'use client';

import { useState, useCallback } from 'react';

const SPP_SERVICE = '00001101-0000-1000-8000-00805f9b34fb';

interface UseBluetoothPrintResult {
    print: (data: Uint8Array) => Promise<void>;
    isSupported: boolean;
    isPrinting: boolean;
}

export function useBluetoothPrint(): UseBluetoothPrintResult {
    const [isPrinting, setIsPrinting] = useState(false);
    const isSupported =
        typeof navigator !== 'undefined' && 'bluetooth' in navigator;

    const print = useCallback(
        async (data: Uint8Array) => {
            if (!isSupported) {
                throw new Error(
                    'Web Bluetooth tidak didukung di browser ini. Gunakan Chrome Android atau Chrome Desktop.',
                );
            }

            setIsPrinting(true);

            try {
                const device = await navigator.bluetooth!.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: [SPP_SERVICE],
                });

                const server = await device.gatt!.connect();
                const service = await server.getPrimaryService(SPP_SERVICE);
                const characteristic =
                    await service.getCharacteristic(SPP_SERVICE);

                await characteristic.writeValue(data);

                await new Promise((resolve) => setTimeout(resolve, 1000));
                device.gatt?.disconnect();
            } finally {
                setIsPrinting(false);
            }
        },
        [isSupported],
    );

    return { print, isSupported, isPrinting };
}
