'use client';

import { useCallback, useRef } from 'react';

type BeepType = 'success' | 'error';

interface UseBeepResult {
    beep: (type: BeepType) => void;
}

export function useBeep(): UseBeepResult {
    const ctxRef = useRef<AudioContext | null>(null);

    const beep = useCallback((type: BeepType) => {
        try {
            if (!ctxRef.current) {
                ctxRef.current = new AudioContext();
            }

            const ctx = ctxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            gain.gain.value = 0.15;

            if (type === 'success') {
                osc.frequency.value = 880;
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    ctx.currentTime + 0.1,
                );
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else {
                osc.frequency.value = 330;
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    ctx.currentTime + 0.25,
                );
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            }

            osc.connect(gain);
            gain.connect(ctx.destination);
        } catch {
            // Audio tidak tersedia — abaikan
        }
    }, []);

    return { beep };
}
