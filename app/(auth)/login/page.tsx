'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, login, signInWithGoogle } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const isMobileAuth = searchParams.get('mobile_auth') === 'true';

    useEffect(() => {
        if (searchParams.get('verified')) {
            toast.success('Identity verified. Proceed with login.');
        }
    }, [searchParams]);

    useEffect(() => {
        if (user && isMobileAuth) {
            const triggerBackendHandoff = async () => {
                try {
                    const token = await user.getIdToken();
                    console.log("[NativeReturn] Routing to backend bridge...");
                    // Using server-side 302 via the bridge API
                    window.location.href = `/api/auth/bridge?token=${token}`;
                } catch (err) {
                    console.error("[NativeReturn] Token retrieval failed:", err);
                    router.replace('/');
                }
            };
            triggerBackendHandoff();
        } else if (user) {
            router.replace('/');
        }
    }, [user, router, searchParams, isMobileAuth]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please enter both email and password.');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email, password);
            // Router push is handled in AuthContext but good to have fallback
        } catch (error) {
            // Error handled in AuthContext
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            setIsSubmitting(false);
        }
    };

    // Specialist Handoff UI for APK users
    if (user && isMobileAuth) {
        return (
            <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700 py-12">
                <div className="h-16 w-16 border border-border rounded-2xl flex items-center justify-center bg-white shadow-xl overflow-hidden animate-pulse">
                    <img src="/icons/icon-512.png" className="h-full w-full object-cover" alt="VetScribe" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold text-foreground tracking-tight uppercase">Handoff Protocol</h1>
                    <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                        Identity verified. Synchronizing session with the native APK...
                    </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={async () => {
                            const token = await user.getIdToken();
                            window.location.href = `/api/auth/bridge?token=${token}`;
                        }}
                        className="w-full h-12 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-md shadow-lg"
                    >
                        Enter App Manually
                    </button>
                    <button
                        onClick={() => router.replace('/')}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2"
                    >
                        Continue on Web
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-sm mx-auto w-full">

            <div className="space-y-4 text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 border border-border rounded-[2rem] flex items-center justify-center bg-white shadow-2xl overflow-hidden p-1">
                        <img src="/icons/icon-512.png" className="h-full w-full object-cover rounded-[1.8rem]" alt="VetScribe Pro" />
                    </div>
                </div>
                <h1 className="text-2xl font-serif font-black text-foreground tracking-tighter uppercase leading-none">VetScribe <span className="text-primary">Pro</span></h1>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                    Clinical Documentation Intelligence
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-premium"
                        autoCapitalize="none"
                        autoCorrect="off"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-premium"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-premium w-full h-12"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ChevronRight className="h-4 w-4" /></>}
                    </button>
                </div>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                    <span className="bg-background px-2 text-muted-foreground">Or access via</span>
                </div>
            </div>

            <div className="space-y-4">
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Google Workspace
                </button>

                <div className="flex flex-col items-center gap-4 border-t border-border/50 pt-6">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">New to VetScribe?</p>
                    <Link href="/signup" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">
                        Create Clinical Account
                    </Link>
                </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-6">
                <Link href="/privacy" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/terms" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground transition-colors">Terms</Link>
                <Link href="/security" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground transition-colors">Security</Link>
            </div>
        </div >
    );
}
