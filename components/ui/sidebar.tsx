'use client';

import { useState } from 'react';
import {
    LayoutDashboard,
    BarChart3,
    Calendar,
    Mic2,
    Users,
    Pill,
    FlaskConical,
    MessageSquare,
    History,
    Settings,
    ChevronLeft,
    ChevronRight,
    Brain,
    Zap,
    Binary,
    ListChecks
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
    onNavigate?: () => void;
    className?: string;
    isMobile?: boolean;
}

export function Sidebar({ onNavigate, className, isMobile }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Patients', href: '/patients', icon: Users },
        { name: 'AI Scribe', href: '/record', icon: Mic2, activeMatch: '/record' },
        { name: 'Clinical History', href: '/history', icon: History },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Checklist', href: '/checklist', icon: ListChecks },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];


    return (
        <aside
            className={cn(
                "h-full flex flex-col bg-card border-r border-border transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
                isCollapsed ? "w-24" : "w-80",
                className
            )}
        >
            {/* Clinical Infrastructure Brand */}
            {!isMobile && (
                <div className="h-20 px-6 flex items-center justify-between border-b border-border/50">
                    <div className={cn("flex items-center gap-3 transition-all duration-300", isCollapsed && "opacity-0 invisible w-0")}>
                        <div className="h-9 w-9 border border-border rounded-xl flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0">
                            <img src="/icons/icon-192.png" className="h-full w-full object-cover" alt="VetScribe Logo" />
                        </div>
                        <div>
                            <span className="text-lg font-serif font-black tracking-tighter text-foreground leading-none block">VetScribe</span>
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em] mt-1 block">Clinical Node</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="h-10 w-10 border border-border rounded-xl flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all bg-card"
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4 no-demote" /> : <ChevronLeft className="h-4 w-4 no-demote" />}
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar space-y-0.5">
                {navigation.map((item, index) => {
                    const isActive = item.activeMatch
                        ? pathname.startsWith(item.activeMatch)
                        : pathname === item.href;

                    return (
                        <div key={item.name}>
                            {/* Structural Separator for grouping (visual anchor) */}
                            {index === 3 && <div className="h-px bg-border/40 mx-3 my-4" />}

                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative border border-transparent",
                                    isActive
                                        ? "bg-primary/5 border-primary/20 text-primary"
                                        : "text-foreground hover:bg-muted transition-all"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 shrink-0 transition-all",
                                    isActive ? "stroke-[3px] text-primary" : "stroke-[2px]"
                                )} />

                                {!isCollapsed && (
                                    <span className={cn(
                                        "text-sm tracking-tight",
                                        isActive ? "font-black" : "font-semibold"
                                    )}>
                                        {item.name}
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute left-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                )}
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* Infrastructure Metadata */}
            <div className="p-4 border-t border-border/40 bg-muted/30">
                {!isCollapsed ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-foreground dark:text-muted-foreground uppercase tracking-[0.12em] leading-none">System Load</span>
                            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        </div>
                        <div className="h-0.5 w-full bg-background border border-border rounded-full overflow-hidden">
                            <div className="h-full w-[92%] bg-primary" />
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center opacity-40">
                        <Binary className="h-4 w-4" />
                    </div>
                )}
            </div>
        </aside>
    );
}
