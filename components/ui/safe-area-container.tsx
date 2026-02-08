'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

interface SafeAreaContainerProps {
    children: React.ReactNode;
    className?: string;
    top?: boolean;
    bottom?: boolean;
}

/**
 * Reusable container that respects Android and iOS safe areas (notches and home bars).
 * Uses CSS env variables which are populated by Capacitor's WebView.
 */
export function SafeAreaContainer({
    children,
    className,
    top = true,
    bottom = true,
}: SafeAreaContainerProps) {
    const isNative = Capacitor.isNativePlatform();

    return (
        <div
            className={cn(
                "flex flex-col min-h-screen w-full relative",
                // Only apply safe area padding if we are on a native platform
                // or if specifically requested. env() variables default to 0 in browsers.
                top && "pt-[env(safe-area-inset-top,0px)]",
                bottom && "pb-[env(safe-area-inset-bottom,0px)]",
                className
            )}
        >
            {children}
        </div>
    );
}
