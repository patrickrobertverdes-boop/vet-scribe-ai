'use client';

import {
    LayoutDashboard,
    Calendar,
    Mic2,
    Users,
    MessageSquare,
    History
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function MobileNav() {
    const pathname = usePathname();
    const isPatientProfile = pathname.includes('/patients/') && pathname.split('/').pop() !== 'patients';
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // FIX C8: Hide nav when keyboard is open
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        import('@capacitor/keyboard').then(({ Keyboard }) => {
            Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
            Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));
        }).catch(() => {
            // Keyboard plugin not available, ignore
        });

        return () => {
            if (!Capacitor.isNativePlatform()) return;
            import('@capacitor/keyboard').then(({ Keyboard }) => {
                Keyboard.removeAllListeners();
            }).catch(() => { });
        };
    }, []);

    const navigation = [
        { name: 'Home', href: '/', icon: LayoutDashboard },
        { name: 'Patients', href: '/patients', icon: Users },
        { name: 'Scribe', href: '/record', icon: Mic2, activeMatch: '/record' },
        { name: 'History', href: '/history', icon: History },
    ];

    return (
        <div className={cn(
            "lg:hidden fixed bottom-14 left-4 right-4 z-[9999] border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl safe-bottom transition-all duration-300",
            isKeyboardVisible ? "hidden" : "block",
            isPatientProfile
                ? "bg-white text-black h-[5rem]"
                : "bg-white dark:bg-card text-foreground h-[6rem]"
        )}>
            <nav className={cn(
                "grid grid-cols-4 w-full h-full px-2 items-center",
            )}>
                {navigation.map((item) => {
                    const isActive = item.activeMatch
                        ? pathname.startsWith(item.activeMatch)
                        : pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 w-full h-full active:scale-95 transition-all text-center select-none rounded-xl",
                                isActive
                                    ? "text-primary scale-105"
                                    : "text-muted-foreground hover:bg-muted/30"
                            )}
                        >
                            <item.icon className={cn(
                                "transition-all duration-300",
                                isPatientProfile ? "h-7 w-7" : "h-8 w-8",
                                isActive ? "stroke-[2.5px] fill-current/10" : "stroke-[1.5px]"
                            )} />
                            <p className={cn(
                                "font-bold tracking-wider leading-none uppercase transition-all",
                                isPatientProfile ? "text-[10px]" : "text-[11px]",
                                isActive ? "opacity-100" : "opacity-70"
                            )}>
                                {item.name}
                            </p>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
