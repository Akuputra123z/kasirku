'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useRef, useState, useCallback, useEffect } from 'react';

interface UseCameraScannerOptions {
    onScan: (barcode: string) => void;
}

interface UseCameraScannerResult {
    startCamera: (containerId: string) => Promise<void>;
    stopCamera: () => void;
    isScanning: boolean;
    error: string | null;
}

export function useCameraScanner({
    onScan,
}: UseCameraScannerOptions): UseCameraScannerResult {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const stopCamera = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch {
                // already stopped
            }

            scannerRef.current = null;
        }

        setIsScanning(false);
        setError(null);
    }, []);

    useEffect(() => {
        const stopper = stopCamera;

        return () => {
            stopper();
        };
    }, [stopCamera]);

    const startCamera = useCallback(
        async (containerId: string) => {
            setError(null);
            setIsScanning(false);

            const scanner = new Html5Qrcode(containerId);
            scannerRef.current = scanner;

            try {
                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                    },
                    (decodedText) => {
                        onScan(decodedText);
                        stopCamera();
                    },
                    () => {
                        // ignore scan errors between frames
                    },
                );

                setIsScanning(true);
            } catch (err: unknown) {
                const message =
                    err instanceof DOMException &&
                    err.name === 'NotAllowedError'
                        ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser.'
                        : err instanceof Error
                          ? err.message
                          : 'Gagal membuka kamera';

                setError(message);
                setIsScanning(false);
                scannerRef.current = null;
            }
        },
        [onScan, stopCamera],
    );

    return { startCamera, stopCamera, isScanning, error };
}
