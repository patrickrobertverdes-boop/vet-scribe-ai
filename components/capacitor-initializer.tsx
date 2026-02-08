'use client';

import { useEffect } from 'react';

export function CapacitorInitializer() {
    useEffect(() => {
        const initCapacitor = async () => {
            if (typeof window !== 'undefined' && (window as any).Capacitor) {
                try {
                    // Import dynamically to avoid SSR issues
                    const { StatusBar } = await import('@capacitor/status-bar');

                    // Immersive mode: Hide status bar for full-screen feel
                    await StatusBar.hide();

                    // Overlay webview to prevent the status bar area from being a black box
                    await StatusBar.setOverlaysWebView({ overlay: true });

                    console.log('[Capacitor] Initialized Immersive Mode');
                } catch (e) {
                    console.warn('[Capacitor] Status Bar plugin issue', e);
                }
            }
        };

        const setupAndroidBridge = () => {
            if (typeof window !== 'undefined' && /Android/i.test(navigator.userAgent)) {
                // Force full screen styling hints
                document.documentElement.style.setProperty('--system-bar-height', '0px');
            }
        };

        initCapacitor();
        setupAndroidBridge();
    }, []);

    return null;
}
