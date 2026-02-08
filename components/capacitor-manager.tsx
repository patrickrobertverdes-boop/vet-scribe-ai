'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

export function CapacitorManager() {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const initCapacitor = async () => {
            try {
                // Hide Status Bar for immersive feel
                await StatusBar.hide();

                // Note: NavigationBar plugin requires additional installation
                // For now, we use StatusBar settings to optimize space
                if (Capacitor.getPlatform() === 'android') {
                    await StatusBar.setOverlaysWebView({ overlay: true });
                }
            } catch (err) {
                console.warn('Capacitor plugin issue:', err);
            }
        };

        initCapacitor();
    }, []);

    return null;
}
