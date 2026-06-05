'use client';

import { useState, useCallback, useRef } from 'react';

const THERMAL_PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    '0000aabb-0000-1000-8000-00805f9b34fb',
    '00001101-0000-1000-8000-00805f9b34fb',
    '0000aabb-c0c1-11e2-9a2e-0002a5d5c51b',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

const THERMAL_PRINTER_CHARACTERISTICS = [
    '000018f1-0000-1000-8000-00805f9b34fb',
    '0000aabc-0000-1000-8000-00805f9b34fb',
    '00001101-0000-1000-8000-00805f9b34fb',
    '00002902-0000-1000-8000-00805f9b34fb',
];

interface UseBluetoothPrintResult {
    print: (data: Uint8Array) => Promise<void>;
    isSupported: boolean;
    isPrinting: boolean;
    deviceName: string | null;
}

export function useBluetoothPrint(): UseBluetoothPrintResult {
    const [isPrinting, setIsPrinting] = useState(false);
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const deviceRef = useRef<BluetoothDevice | null>(null);
    const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(
        null,
    );

    const isSupported =
        typeof navigator !== 'undefined' && 'bluetooth' in navigator;

    const writeChunks = async (
        characteristic: BluetoothRemoteGATTCharacteristic,
        data: Uint8Array,
        chunkSize = 512,
    ) => {
        for (let offset = 0; offset < data.length; offset += chunkSize) {
            const chunk = data.slice(offset, offset + chunkSize);
            await characteristic.writeValue(chunk);
        }
    };

    const print = useCallback(
        async (data: Uint8Array) => {
            if (!isSupported) {
                throw new Error(
                    'Web Bluetooth tidak didukung di browser ini. Gunakan Chrome Android atau Chrome Desktop.',
                );
            }

            setIsPrinting(true);

            try {
                let characteristic = characteristicRef.current;

                if (!characteristic) {
                    const device = await navigator.bluetooth!.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: THERMAL_PRINTER_SERVICES,
                    });

                    deviceRef.current = device;
                    setDeviceName(device.name || 'Bluetooth Printer');

                    device.addEventListener('gattserverdisconnected', () => {
                        characteristicRef.current = null;
                        deviceRef.current = null;
                    });

                    const server = await device.gatt!.connect();

                    let foundChar: BluetoothRemoteGATTCharacteristic | null =
                        null;

                    for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
                        let service: BluetoothRemoteGATTService;

                        try {
                            service =
                                await server.getPrimaryService(serviceUuid);
                        } catch {
                            continue;
                        }

                        for (const charUuid of THERMAL_PRINTER_CHARACTERISTICS) {
                            try {
                                foundChar =
                                    await service.getCharacteristic(charUuid);
                                break;
                            } catch {
                                continue;
                            }
                        }

                        if (foundChar) {
                            break;
                        }

                        try {
                            const characteristics =
                                await service.getCharacteristics();

                            for (const char of characteristics) {
                                if (
                                    char.properties.write ||
                                    char.properties.writeWithoutResponse
                                ) {
                                    foundChar = char;
                                    break;
                                }
                            }
                        } catch {
                            continue;
                        }

                        if (foundChar) {
                            break;
                        }
                    }

                    if (!foundChar) {
                        try {
                            const services = await server.getPrimaryServices();

                            for (const svc of services) {
                                const chars = await svc.getCharacteristics();

                                for (const char of chars) {
                                    if (
                                        char.properties.write ||
                                        char.properties.writeWithoutResponse
                                    ) {
                                        foundChar = char;
                                        break;
                                    }
                                }

                                if (foundChar) {
                                    break;
                                }
                            }
                        } catch {
                            // ignore
                        }
                    }

                    if (!foundChar) {
                        throw new Error(
                            'Tidak dapat menemukan karakteristik write pada printer Bluetooth. Pastikan printer dalam mode BLE (Bluetooth Low Energy).',
                        );
                    }

                    characteristicRef.current = foundChar;
                    characteristic = foundChar;
                }

                await writeChunks(characteristic, data);

                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (err: any) {
                characteristicRef.current = null;
                deviceRef.current = null;
                setDeviceName(null);

                throw new Error(
                    err?.message || 'Gagal mencetak via Bluetooth.',
                );
            } finally {
                setIsPrinting(false);
            }
        },
        [isSupported],
    );

    return { print, isSupported, isPrinting, deviceName };
}
