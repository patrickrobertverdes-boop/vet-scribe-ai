'use client';

import { useEffect } from 'react';
import { useDesignStore } from '@/lib/design-store';

function getLuminance(hex: string): number {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    // Perceptual luminance calculation
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function hexToHsl(hex: string): string {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}



export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, accentColor, density, fontSize } = useDesignStore();

    // Manually rehydrate the store on mount (required when skipHydration: true)
    useEffect(() => {
        useDesignStore.persist.rehydrate();
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        // Apply Theme Class
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Apply High Contrast logic if needed (could be another class)
        if (theme === 'contrast') {
            root.classList.add('contrast'); // Assuming we style .contrast in CSS or just use utility logic
            // For now, let's just make sure we don't conflict with dark
            root.classList.remove('dark');
        } else {
            root.classList.remove('contrast');
        }

        // Apply Accent Color & Calculate accessible foreground
        const hslValue = hexToHsl(accentColor);
        const luminance = getLuminance(accentColor);
        // Use raw HSL numbers for the foreground to stay consistent with primary
        const foregroundColor = luminance > 0.5 ? '222 47% 11%' : '210 40% 98%';

        root.style.setProperty('--primary', hslValue);
        root.style.setProperty('--primary-foreground', foregroundColor);
        root.style.setProperty('--ring', hslValue);


        // Apply Density/Font scaling (Using CSS vars is good)
        // Default text size is 100% (1rem). 
        // Small: 0.875rem, Large: 1.125rem
        if (fontSize === 'small') root.style.fontSize = '87.5%'; // 14px default -> 12.25px
        else if (fontSize === 'medium') root.style.fontSize = '100%'; // 16px
        else if (fontSize === 'large') root.style.fontSize = '112.5%'; // 18px

        // Density affects usage of padding/gap throughout the app?
        // This is harder to do globally without robust var usage.
        // We can set a --gap-factor var.
        let gapFactor = '1';
        if (density === 'compact') gapFactor = '0.75';
        if (density === 'spacious') gapFactor = '1.5';
        root.style.setProperty('--density-factor', gapFactor);

    }, [theme, accentColor, density, fontSize]);

    return <>{children}</>;
}
