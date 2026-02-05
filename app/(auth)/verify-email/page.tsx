'use client';
export const dynamic = "force-dynamic";

import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
    const { user, logout, resendVerification } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        if (user) {
            const isGoogleUser = user.providerData.some(p => p.providerId.includes('google'));
            if (user.emailVerified || isGoogleUser) {
                window.location.href = '/';
            } else {
                setIsChecking(false);
            }
        } else {
            const timer = setTimeout(() => setIsChecking(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [user, router]);

    if (isChecking) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
                <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                    Checking Status...
                </p>
            </div>
        );
    }

    const handleManualRefresh = async () => {
        if (!user) return;
        const loadingToast = toast.loading('Synchronizing...');
        try {
            console.log("[Verify-Email] Refreshing user state...");
            await user.reload();

            if (user.emailVerified) {
                console.log("[Verify-Email] Verified. Refreshing token and provisioning...");
                const idToken = await user.getIdToken(true);

                // Call provisioning to ensure Firestore doc exists
                const provRes = await fetch('/api/provision-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ uid: user.uid })
                });

                if (!provRes.ok) {
                    throw new Error("Provisioning failed. Contact support.");
                }

                // CRITICAL: Force-refresh the token AGAIN after provisioning
                console.log("[Verify-Email] Synchronizing final claims...");
                const tokenResult = await user.getIdTokenResult(true);
                console.log("[Verify-Email] PROOF - CLAIMS:", tokenResult.claims);

                toast.success('Access granted.', { id: loadingToast });
                window.location.href = '/';
            } else {
                toast.error('Pending verification.', { id: loadingToast });
            }
        } catch (error: any) {
            console.error("[Verify-Email] Manual refresh error:", error);
            toast.error(error.message || 'Sync failed.', { id: loadingToast });
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setIsResending(true);
        try {
            await resendVerification();
            setCooldown(60); // 60 second cooldown
        } catch (error: any) {
            toast.error(error.message || 'Transmission error.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Verification Pending</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Security link sent to <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span>
                </p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={handleManualRefresh}
                    className="w-full h-10 rounded-md bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw className="h-3.5 w-3.5" /> Check Status
                </button>

                <button
                    onClick={handleResend}
                    disabled={isResending || cooldown > 0}
                    className="w-full h-10 border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isResending ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : cooldown > 0 ? (
                        `Wait ${cooldown}s`
                    ) : (
                        'Resend Link'
                    )}
                </button>

                <button
                    onClick={logout}
                    className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="h-3 w-3" /> Sign Out
                </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Post-Office Status</span>
                    <ConnectivityStatus />
                </div>
            </div>
        </div>
    );
}

function ConnectivityStatus() {
    const [status, setStatus] = useState<'testing' | 'online' | 'error'>('testing');

    useEffect(() => {
        fetch('/api/auth/healthcheck')
            .then(res => res.ok ? setStatus('online') : setStatus('error'))
            .catch(() => setStatus('error'));
    }, []);

    if (status === 'testing') return <span className="text-[9px] text-slate-400 animate-pulse">Scanning...</span>;
    if (status === 'online') return <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Linked</span>;
    return <span className="text-[9px] text-rose-500 font-bold">Connection Degraded</span>;
}
