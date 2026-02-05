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

export function MobileNav() {
    const pathname = usePathname();

    const navigation = [
        { name: 'Home', href: '/', icon: LayoutDashboard },
        { name: 'Patients', href: '/patients', icon: Users },
        { name: 'Scribe', href: '/record', icon: Mic2, activeMatch: '/record' },
        { name: 'History', href: '/history', icon: History },
    ];


    return (
        <div className="lg:hidden sticky bottom-0 left-0 right-0 w-full z-50 bg-white dark:bg-card border-t border-black dark:border-border safe-bottom shadow-none">
            <nav className="h-[5rem] grid grid-cols-4 w-full px-2">
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
                                isActive ? "text-foreground" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <item.icon className={cn(
                                "h-6 w-6 transition-all duration-300",
                                isActive ? "stroke-[3px] scale-110" : "stroke-[2px]"
                            )} />
                            <p className={cn(
                                "text-[10px] uppercase font-black tracking-widest leading-none transition-all",
                                isActive ? "opacity-100" : "opacity-0 scale-75"
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
