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
        <div className="lg:hidden sticky bottom-0 left-0 right-0 w-full z-50 bg-white dark:bg-slate-950 border-t border-black dark:border-slate-800 safe-bottom shadow-none transition-transform duration-300">
            <nav className="h-[4.5rem] grid grid-cols-4 w-full">
                {navigation.map((item) => {
                    const isActive = item.activeMatch
                        ? pathname.startsWith(item.activeMatch)
                        : pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-full h-full active:scale-95 transition-all text-center select-none",
                                isActive ? "text-black dark:text-white" : "text-black dark:text-slate-500"
                            )}
                        >
                            <item.icon className={cn(
                                "h-6 w-6 transition-all duration-300",
                                isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                            )} />
                            <span className={cn(
                                "text-[9px] uppercase font-bold tracking-[0.1em]",
                                isActive ? "opacity-100" : "opacity-0 hidden"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
