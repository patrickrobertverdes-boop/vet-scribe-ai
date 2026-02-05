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
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
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
            <div className="h-20 px-6 flex items-center justify-between border-b border-border/50">
                <div className={cn("flex items-center gap-3 transition-all duration-300", isCollapsed && "opacity-0 invisible w-0")}>
                    <div className="h-7 w-7 bg-primary rounded-sm flex items-center justify-center text-primary-foreground shadow-sm">
                        <Zap className="h-4 w-4 no-demote" />
                    </div>
                    <div>
                        <span className="text-base font-serif font-medium tracking-tight text-foreground leading-none block">VetScribe</span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.1em] mt-1 block">Clinical Data Matrix</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-7 w-7 border border-border/60 rounded-sm flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3 no-demote" /> : <ChevronLeft className="h-3 w-3 no-demote" />}
                </button>
            </div>

            {/* Navigation Matrix */}
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
                                    "group flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-200 relative",
                                    isActive
                                        ? "nav-item-active"
                                        : "text-muted-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/30 hover:text-foreground"
                                )}
                            >
                                {/* Subtle Left Indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary" />
                                )}

                                <item.icon className={cn(
                                    "h-4 w-4 shrink-0 transition-opacity",
                                    isActive ? "opacity-100" : "opacity-60"
                                )} />

                                {!isCollapsed && (
                                    <span className={cn(
                                        "text-[13px] tracking-tight",
                                        isActive ? "font-semibold" : "font-normal"
                                    )}>
                                        {item.name}
                                    </span>
                                )}
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* Infrastructure Metadata */}
            <div className="p-4 border-t border-border/40 bg-slate-50/30 dark:bg-slate-950/20">
                {!isCollapsed ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.12em] leading-none">System Load</span>
                            <div className="h-1 w-1 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full w-[92%] bg-slate-400 dark:bg-slate-600" />
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
