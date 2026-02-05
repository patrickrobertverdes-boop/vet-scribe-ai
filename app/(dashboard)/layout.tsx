'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/ui/header';
import { MobileNav } from '@/components/ui/mobile-nav';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { useChatStore } from '@/lib/chat-store';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, isSigningUp, isLoggingIn } = useAuth();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            } else {
                const isGoogleUser = user.providerData.some(p => p.providerId.includes('google'));

                if (!user.emailVerified && !isGoogleUser) {
                    router.replace('/verify-email');
                }
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

    // Strict guard: If they are not verified and not Google, do not show the dashboard content
    const isGoogleAccount = user.providerData.some(p => p.providerId.includes('google'));
    if (!user.emailVerified && !isGoogleAccount) {
        return null;
    }

    return (
        <div className="flex bg-mesh min-h-dvh lg:h-dvh lg:overflow-hidden relative flex-col lg:flex-row">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none fixed" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none fixed" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden transition-opacity duration-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close menu overlay"
                />
            )}

            {/* Sidebar - Desktop (Fixed Height/Scroll internally handled by flex parent) */}
            <div className="hidden lg:flex w-80 flex-col border-r border-border bg-card relative z-20 shrink-0">
                <Sidebar className="w-full h-full" />
            </div>

            {/* Sidebar - Mobile */}
            <div className={`
                fixed inset-y-0 left-0 right-0 z-50 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:hidden
                ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}
            `}>
                <div className="flex flex-col w-full h-full relative bg-background mobile-solid">
                    {/* Close Button - Clean & Solid */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute right-4 top-4 h-12 w-12 flex items-center justify-center text-foreground hover:bg-muted/20 transition-all z-[60] active:scale-95"
                        aria-label="Close menu"
                    >
                        <X className="h-6 w-6 relative top-[1px] left-[0.5px]" />
                    </button>

                    {/* Sidebar Content with bottom padding for mobile nav */}
                    <div className="flex-1 overflow-y-auto pb-24">
                        <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} className="w-full border-none h-full" />
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
                <main className="flex-1 lg:overflow-y-auto p-3 sm:p-8 lg:p-10 pb-20 lg:pb-10 relative z-10 w-full scroll-smooth">
                    <div className="mx-auto max-w-[1600px] w-full">
                        {children}
                    </div>
                </main>

                <MobileNav />
            </div>

            <AIAssistant />
        </div>
    );
}
