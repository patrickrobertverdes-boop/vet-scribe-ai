'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (error: any) {
            toast.error(error.message);
            setIsSubmitting(false);
        }
    };

    // Specialist Handoff UI for APK users
    if (user && isMobileAuth) {
        return (
            <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700 py-12">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                    <Zap className="h-8 w-8 text-primary" />
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground tracking-tight">System Login</h1>
                <p className="text-sm text-muted-foreground">
                    Authenticate to access patient records.
                </p>
            </div>

            <div className="space-y-6">
                <button
                    onClick={() => {
                        setIsSubmitting(true);
                        // Mocking login for UI calibration phase as requested
                        toast.success('System Access Granted');
                        router.push('/');
                    }}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Initialize Console <Zap className="h-4 w-4 fill-current" /></>}
                </button>

                <div className="pt-4 flex items-center justify-center gap-6 border-t border-border/50">
                    <Link href="/privacy" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground transition-colors">Privacy</Link>
                    <Link href="/terms" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground transition-colors">Terms</Link>
                    <Link href="/security" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground transition-colors">Security</Link>
                </div>
            </div>
        </div >
    );
}
