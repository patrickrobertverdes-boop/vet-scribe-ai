'use client';

import { useState, useEffect } from 'react';
import { firebaseService } from '@/lib/firebase-service';
import { useRouter } from 'next/navigation';
import {
    Search,
    Bell,
    Menu,
    Command,
    LayoutGrid,
    Settings2,
    Activity,
    User,
    Brain,
    LogOut,
    Download
} from 'lucide-react';
import { InstallPWA } from './install-pwa';
import { cn } from '@/lib/utils';
import { AIAssistant } from '@/components/ai/ai-assistant';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
    onMenuClick?: () => void;
    onAIAssistantClick?: () => void;
}

export function Header({ onMenuClick, onAIAssistantClick }: HeaderProps) {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (!user || user.isAnonymous) return;

        // Defensive subscription: will retry or return null on permission error
        // instead of crashing the header
        let unsubscribe = () => { };
        try {
            unsubscribe = firebaseService.subscribeToUserProfile(user.uid, (data) => {
                setProfile(data);
            });
        } catch (err) {
            console.error("[Header] Early profile access blocked:", err);
        }

        return () => unsubscribe();
    }, [user]);

    return (
        <>
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-6 bg-background border-b border-border/60 shadow-none">
                {/* Infrastructure Access */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                        onClick={onAIAssistantClick}
                        className="h-8 w-8 flex items-center justify-center text-primary border border-border/80 rounded-sm hover:bg-muted transition-all"
                    >
                        <Brain className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden h-8 w-8 flex items-center justify-center text-muted-foreground border border-border rounded-sm hover:bg-muted transition-all"
                    >
                        <Menu className="h-4 w-4" />
                    </button>

                    {/* Data Query Interface */}
                    <div className="relative w-full max-w-md group hidden lg:block ml-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors" />
                        <input
                            className="w-full h-8 bg-slate-100/30 dark:bg-slate-900/40 border border-border/80 rounded-sm pl-9 pr-10 text-[13px] text-foreground placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            placeholder="Clinical directory query..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    router.push(`/patients?q=${encodeURIComponent(val)}`);
                                }
                            }}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:flex items-center px-1 py-0.5 border border-border/60 rounded bg-muted/30">
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">CMD+K</span>
                        </div>
                    </div>
                </div>

                {/* System Controls */}
                <div className="flex items-center gap-3">
                    <div className="hidden xl:flex items-center gap-2 mr-4 opacity-70">
                        <div className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.15em]">Secure Node</span>
                    </div>

                    <InstallPWA />

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => router.push('/notifications')}
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground border border-border/60 rounded-sm hover:bg-muted transition-all"
                        >
                            <Bell className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => router.push('/settings')}
                            className="h-8 w-8 hidden md:flex items-center justify-center text-muted-foreground border border-border/60 rounded-sm hover:bg-muted transition-all"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-border/40 mx-2" />

                    {user ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push('/settings')}
                                className="flex items-center gap-2.5 pl-1.5 pr-2.5 h-8 border border-border/60 rounded-sm hover:bg-muted/50 transition-all max-w-[180px]"
                            >
                                <div className="h-5 w-5 bg-slate-100 dark:bg-transparent dark:border dark:border-white/20 rounded-sm flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 overflow-hidden">
                                    {profile?.image ? (
                                        <img
                                            src={profile.image}
                                            alt="User"
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                // If Storage access fails (403), fallback to icon silently
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-demote"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                            }}
                                        />
                                    ) : (
                                        <User className="h-3 w-3 no-demote" />
                                    )}
                                </div>
                                <div className="text-left hidden lg:block overflow-hidden">
                                    <p className="text-[12px] font-medium text-foreground leading-none truncate">{profile?.name || user.email?.split('@')[0]}</p>
                                </div>
                            </button>
                            <button
                                onClick={logout}
                                className="h-8 w-8 flex items-center justify-center text-muted-foreground border border-border/60 rounded-sm hover:text-rose-600 transition-all"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push('/login')}
                            className="h-8 px-3 bg-primary text-primary-foreground font-medium text-[11px] rounded-sm uppercase tracking-widest shadow-none hover:opacity-90 transition-all"
                        >
                            Log Identity
                        </button>
                    )}
                </div>
            </header>

        </>
    );
}
