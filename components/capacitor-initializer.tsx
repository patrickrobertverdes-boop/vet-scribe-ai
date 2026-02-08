'use client';

import { useEffect } from 'react';

export function CapacitorInitializer() {
    useEffect(() => {
        const initCapacitor = async () => {
            if (typeof window !== 'undefined' && (window as any).Capacitor) {
                try {
                    // Import dynamically to avoid SSR issues
                    const { StatusBar } = await import('@capacitor/status-bar');

                    // 4. Use Capacitor Status Bar Properly (Android)
                    // This makes layout behave like a normal Android app.
                    await StatusBar.setOverlaysWebView({ overlay: false });

                    console.log('[Capacitor] Initialized Status Bar');
                } catch (e) {
                    console.warn('[Capacitor] Status Bar plugin not found or failed to init', e);
                }
            }
        };

        initCapacitor();
    }, []);

    return null;
}
