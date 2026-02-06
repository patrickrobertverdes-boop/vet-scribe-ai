'use client';

import { useState, useEffect } from 'react';
import { firebaseService } from '@/lib/firebase-service';
import { usePathname, useRouter } from 'next/navigation';
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
    const pathname = usePathname();

    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (!user || user.isAnonymous) return;
        let unsubscribe = () => { };
        try {
            unsubscribe = firebaseService.subscribeToUserProfile(user.uid, (data: any) => {
                setProfile(data);
            });
        } catch (err) {
            console.error("[Header] Early profile access blocked:", err);
        }
        return () => unsubscribe();
    }, [user]);

    const isPatientProfile = pathname.includes('/patients/') && pathname.split('/').pop() !== 'patients';

    return (
        <header className={cn(
            "sticky top-0 z-30 flex items-center justify-between px-6 border-b border-border/60 transition-all duration-300",
            isPatientProfile ? "h-11 sm:h-12 bg-white text-black" : "h-12 sm:h-14 bg-background shadow-none"
        )}>
            {/* Infrastructure Access */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    onClick={onAIAssistantClick}
                    className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-xl transition-all shadow-sm",
                        isPatientProfile ? "bg-white text-black border border-black" : "text-foreground border border-black dark:border-border bg-card hover:bg-black hover:text-white"
                    )}
                >
                    <Brain className="h-5 w-5" />
                </button>
                <button
                    onClick={onMenuClick}
                    className={cn(
                        "lg:hidden h-10 w-10 flex items-center justify-center rounded-xl transition-all shadow-sm",
                        isPatientProfile ? "bg-white text-black border border-black" : "text-foreground border border-black dark:border-border bg-card hover:bg-black hover:text-white"
                    )}
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Data Query Interface */}
                <div className="relative w-full max-w-md group hidden lg:block ml-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                    <input
                        className={cn(
                            "w-full h-10 border rounded-xl pl-10 pr-10 text-sm focus:ring-1 outline-none transition-all shadow-sm",
                            isPatientProfile
                                ? "bg-white border-black text-black placeholder:text-zinc-400 focus:ring-black"
                                : "bg-white border-black dark:bg-card dark:border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-black"
                        )}
                        placeholder="Clinical directory query..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                router.push(`/patients?q=${encodeURIComponent(val)}`);
                            }
                        }}
                    />
                </div>
            </div>

            {/* System Controls */}
            <div className="flex items-center gap-3">
                <div className="hidden xl:flex items-center gap-2 mr-4">
                    <div className={cn("h-1 w-1 rounded-full", isPatientProfile ? "bg-black" : "bg-black dark:bg-emerald-500")} />
                    <span className="text-[9px] font-bold text-foreground uppercase tracking-[0.15em]">Secure Node</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push('/notifications')}
                        className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                            isPatientProfile ? "bg-white text-black border border-black" : "text-foreground border border-black dark:border-border bg-card hover:bg-black hover:text-white"
                        )}
                    >
                        <Bell className="h-4 w-4" />
                    </button>
                </div>

                <div className="h-4 w-px bg-border/40 mx-2" />

                {user ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/settings')}
                            className={cn(
                                "flex items-center gap-3 pl-2 pr-4 h-10 border rounded-xl transition-all max-w-[220px]",
                                isPatientProfile ? "bg-white text-black border-black" : "border-black dark:border-border bg-card hover:bg-black hover:text-white"
                            )}
                        >
                            <div className="h-7 w-7 bg-white dark:bg-black border border-black dark:border-white/20 rounded-lg flex items-center justify-center text-black dark:text-white shrink-0 overflow-hidden">
                                {profile?.image ? (
                                    <img
                                        src={profile.image}
                                        alt="User"
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-demote"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                        }}
                                    />
                                ) : (
                                    <User className="h-4 w-4 no-demote" />
                                )}
                            </div>
                            <div className="text-left hidden lg:block overflow-hidden">
                                <p className="text-sm font-bold leading-none truncate">{profile?.displayName || profile?.name || user.email?.split('@')[0]}</p>
                            </div>
                        </button>
                        <button
                            onClick={logout}
                            className={cn(
                                "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                                isPatientProfile ? "bg-white text-black border border-black" : "text-foreground border border-black dark:border-border bg-card hover:bg-black hover:text-white dark:hover:bg-rose-600"
                            )}
                        >
                            <LogOut className="h-4 w-4" />
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
    );
}
