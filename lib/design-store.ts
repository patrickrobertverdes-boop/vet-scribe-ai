'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DesignState = {
    theme: 'light' | 'dark' | 'contrast';
    accentColor: string;
    density: 'comfortable' | 'compact' | 'spacious';
    fontSize: 'small' | 'medium' | 'large';
    clinicalModel: 'gemini-flash-latest' | 'gemini-pro-latest' | 'gemini-2.0-flash';
    setTheme: (theme: 'light' | 'dark' | 'contrast') => void;
    setAccentColor: (color: string) => void;
    setDensity: (density: 'comfortable' | 'compact' | 'spacious') => void;
    setFontSize: (size: 'small' | 'medium' | 'large') => void;
    setClinicalModel: (model: 'gemini-flash-latest' | 'gemini-pro-latest' | 'gemini-2.0-flash') => void;
};

export const useDesignStore = create<DesignState>()(
    persist(
        (set) => ({
            theme: 'light',
            accentColor: '#000000', // Clinical Black
            density: 'comfortable',
            fontSize: 'medium',
            clinicalModel: 'gemini-flash-latest',
            setTheme: (theme) => set({ theme }),
            setAccentColor: (color) => set({ accentColor: color }),
            setDensity: (density) => set({ density }),
            setFontSize: (fontSize) => set({ fontSize }),
            setClinicalModel: (clinicalModel) => set({ clinicalModel }),
        }),
        {
            name: 'vetscribe-design-storage',
            skipHydration: true,
        }
    )
);
