'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/ui/header';
import { MobileNav } from '@/components/ui/mobile-nav';
import { X, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { useChatStore } from '@/lib/chat-store';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, isSigningUp, isLoggingIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLElement>(null);

    // AUTO-SCROLL: Ensure page starts at top on every navigation
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo(0, 0);
        }
        // Also scroll window for mobile/body-based scrolling
        window.scrollTo(0, 0);
    }, [pathname]);

    // Global Chat State
    const { isOpen: isAIAssistantOpen, setOpen: setAIAssistantOpen } = useChatStore();

    // Prevent body scroll when mobile menu or AI assistant is open
    useEffect(() => {
        if (isMobileMenuOpen || isAIAssistantOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isMobileMenuOpen, isAIAssistantOpen]);

    useEffect(() => {
        // Only evaluate auth state once system is fully ready
        if (!loading && !isLoggingIn && !isSigningUp) {
            if (!user) {
                router.replace('/login');
            }
        }
    }, [user, loading, isLoggingIn, isSigningUp, router]);

    if (loading || isSigningUp || isLoggingIn) {
        return (
            <div className="min-h-dvh w-full flex items-center justify-center bg-mesh">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Initializing System...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex bg-background min-h-dvh lg:h-dvh lg:overflow-hidden relative flex-col lg:flex-row">
            {/* Ambient Background Glows Removed for high contrast */}



            {/* Sidebar - Desktop (Fixed Height/Scroll internally handled by flex parent) */}
            <div className="hidden lg:flex w-80 flex-col border-r border-border bg-card relative z-20 shrink-0">
                <Sidebar className="w-full h-full" />
            </div>

            {/* Sidebar - Mobile */}
            <div className={`
                fixed inset-0 z-[100] lg:hidden
                ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                transition-opacity duration-300
            `}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Menu Panel */}
                <div className={cn(
                    "absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-background border-r border-border shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    {/* Header inside Panel */}
                    <div className="h-20 px-6 flex items-center justify-between border-b border-border/50 bg-background shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                                <Zap className="h-4.5 w-4.5" />
                            </div>
                            <span className="text-sm font-black tracking-tighter text-foreground uppercase">VetScribe</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="h-10 w-10 flex items-center justify-center border border-border rounded-xl active:scale-90 transition-all"
                        >
                            <X className="h-5 w-5 text-foreground" />
                        </button>
                    </div>

                    {/* Navigation - Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        <Sidebar
                            onNavigate={() => setIsMobileMenuOpen(false)}
                            className="w-full border-none h-full shadow-none"
                            isMobile={true}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden relative">
                <div className="sticky top-0 z-40 lg:static">
                    <Header
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                        onAIAssistantClick={() => {
                            setIsMobileMenuOpen(false);
                            setAIAssistantOpen(true);
                        }}
                    />
                </div>

                {/* Scroll Container: Native Body on Mobile, Internal on Desktop */}
                <main
                    ref={scrollContainerRef}
                    className="flex-1 lg:overflow-y-auto p-3 sm:p-8 lg:p-10 pb-10 lg:pb-10 relative z-10 w-full scroll-smooth"
                >
                    <div className="mx-auto max-w-[1600px] w-full">
                        {children}
                    </div>
                </main>
            </div>

            <AIAssistant />
        </div>
    );
}
