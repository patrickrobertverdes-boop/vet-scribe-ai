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
    const isPatientProfile = pathname.includes('/patients/') && pathname.split('/').pop() !== 'patients';

    const navigation = [
        { name: 'Home', href: '/', icon: LayoutDashboard },
        { name: 'Patients', href: '/patients', icon: Users },
        { name: 'Scribe', href: '/record', icon: Mic2, activeMatch: '/record' },
        { name: 'History', href: '/history', icon: History },
    ];

    return (
        <nav className={cn(
            "lg:hidden fixed bottom-6 left-4 right-4 z-50 transition-all duration-300 safe-bottom shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20",
            isPatientProfile
                ? "bg-white/90 border-black/10 text-black h-[4rem]"
                : "bg-white/80 dark:bg-slate-900/80 border-white/20 dark:border-white/10 h-[4.5rem]"
        )}>
            <div className="grid grid-cols-4 w-full h-full items-center justify-items-center">
                {navigation.map((item) => {
                    const isActive = item.activeMatch
                        ? pathname.startsWith(item.activeMatch)
                        : pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-full h-full active:scale-90 transition-all text-center select-none rounded-2xl",
                                isActive
                                    ? (isPatientProfile ? "bg-zinc-100 text-black" : "bg-muted text-foreground")
                                    : (isPatientProfile ? "text-zinc-500" : "text-muted-foreground hover:bg-muted/50")
                            )}
                        >
                            <item.icon className={cn(
                                "transition-all duration-300",
                                isPatientProfile ? "h-5 w-5" : "h-6 w-6",
                                isActive ? "stroke-[3px] scale-110" : "stroke-[2px]"
                            )} />
                            <p className={cn(
                                "font-black tracking-widest leading-none uppercase transition-all",
                                isPatientProfile ? "text-[9px]" : "text-[11px]",
                                isActive ? "opacity-100" : "opacity-0 scale-75"
                            )}>
                                {item.name}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
