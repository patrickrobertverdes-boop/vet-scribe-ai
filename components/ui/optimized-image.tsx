'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
    loadingClassName?: string;
}

/**
 * Optimized image component for APK with:
 * - Progressive loading (blur-up effect)
 * - Lazy loading
 * - Error handling
 * - Smooth transitions
 */
export function OptimizedImage({
    src,
    alt,
    className,
    fallback,
    loadingClassName
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!src) {
            setIsLoading(false);
            setHasError(true);
            return;
        }

        setIsLoading(true);
        setHasError(false);
        setCurrentSrc(null);

        // Preload image
        const img = new Image();
        img.src = src;

        img.onload = () => {
            setCurrentSrc(src);
            setIsLoading(false);
        };

        img.onerror = () => {
            setIsLoading(false);
            setHasError(true);
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    if (hasError || !src) {
        if (fallback) {
            return <>{fallback}</>;
        }
        return (
            <div className={cn(
                "flex items-center justify-center bg-muted",
                className
            )}>
                <span className="text-xs text-muted-foreground">{alt}</span>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Loading skeleton */}
            {isLoading && (
                <div className={cn(
                    "absolute inset-0 bg-muted animate-pulse",
                    loadingClassName
                )} />
            )}

            {/* Actual image with smooth fade-in */}
            <img
                src={currentSrc || ''}
                alt={alt}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100"
                )}
                loading="lazy"
            />
        </div>
    );
}
