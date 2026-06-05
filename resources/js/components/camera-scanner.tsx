'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

import { useCameraScanner } from '@/hooks/use-camera-scanner';

interface CameraScannerProps {
    isOpen: boolean;
    onScan: (barcode: string) => void;
    onClose: () => void;
}

export function CameraScanner({ isOpen, onScan, onClose }: CameraScannerProps) {
    const containerId = useId();
    const { startCamera, stopCamera, isScanning, error } =
        useCameraScanner({ onScan });

    useEffect(() => {
        if (isOpen) {
            startCamera(containerId);
        }

        if (!isOpen) {
            stopCamera();
        }
    }, [isOpen, containerId, startCamera, stopCamera]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-black shadow-2xl">
                <div
                    id={containerId}
                    className="w-full [&_video]:rounded-none"
                />

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                    <X className="size-5" />
                </button>

                {error && (
                    <div className="absolute top-3 left-3 z-10 rounded-xl bg-red-500/90 px-4 py-2 text-[13px] font-medium text-white shadow-lg backdrop-blur-sm">
                        {error}
                    </div>
                )}

                {isScanning && !error && (
                    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-5 py-2 backdrop-blur-sm">
                        <p className="text-center text-[12px] font-medium tracking-wide text-white/80">
                            Arahkan kamera ke barcode
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
