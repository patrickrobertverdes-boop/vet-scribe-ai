'use client';

import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
    const { user, logout } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            const isGoogleUser = user.providerData.some(p => p.providerId.includes('google'));
            if (user.emailVerified || isGoogleUser) {
                window.location.href = '/';
            } else {
                setIsChecking(false);
            }
        } else {
            // Give Firebase a moment to load the user
            const timer = setTimeout(() => setIsChecking(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [user, router]);

    if (isChecking) {
        return (
            <div className="flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
                    <RefreshCw className="h-12 w-12 text-cyan-500 animate-spin relative z-10" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                    Securing Connection...
                </p>
            </div>
        );
    }

    const handleManualRefresh = async () => {
        if (!user) return;

        const loadingToast = toast.loading('Synchronizing with secure servers...');

        try {
            // Force Firebase to fetch latest user data
            await user.reload();

            if (user.emailVerified) {
                toast.success('Email verified successfully! Access granted.', { id: loadingToast });
                // Use window.location for a clean state reset
                window.location.href = '/';
            } else {
                toast.error('Verification pending. Please check your email.', {
                    id: loadingToast,
                    duration: 4000
                });
            }
        } catch (error: any) {
            console.error('Refresh error:', error);
            toast.error('Failed to sync: ' + error.message, { id: loadingToast });
        }
    };

    const handleResend = async () => {
        if (!user?.email) return;
        setIsResending(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    displayName: user.displayName,
                    uid: user.uid
                })
            });

            if (response.ok) {
                toast.success('Verification email resent!');
            } else {
                const contentType = response.headers.get("content-type");
                let errorMessage = 'Failed to resend verification email.';

                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                }
                toast.error(errorMessage);
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="glass rounded-[1.5rem] p-8 md:p-12 max-w-md w-full relative overflow-hidden transition-all duration-500">
            <div className="relative z-10 text-center mb-10">
                <div className="relative inline-flex mb-8">
                    <div className="absolute inset-0 bg-cyan-600/20 blur-2xl rounded-full" />
                    <div className="relative h-14 w-14 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 shadow-2xl">
                        <Mail className="h-7 w-7 animate-pulse" />
                    </div>
                </div>

                <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">
                    Verify Identity
                </h1>
                <p className="text-[14px] text-muted-foreground leading-relaxed px-4">
                    Security link dispatched to <br />
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">{user?.email}</span>
                </p>
            </div>

            <div className="space-y-4 relative z-10">
                <button
                    onClick={handleManualRefresh}
                    className="btn-premium w-full bg-slate-900 dark:bg-cyan-600 text-white shadow-lg shadow-cyan-900/10 hover:bg-slate-800 dark:hover:bg-cyan-500 group"
                >
                    <RefreshCw className="h-4 w-4" /> I've Verified My Email
                </button>

                <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full h-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-foreground font-semibold text-[13px] rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-white/10 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isResending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        'Resend Link'
                    )}
                </button>

                <button
                    onClick={logout}
                    className="w-full py-2 text-[11px] font-bold text-muted-foreground hover:text-cyan-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="h-3 w-3" /> Cancel & Sign out
                </button>
            </div>

            <div className="relative z-10 mt-10 text-center">
                <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 text-[12px] font-bold text-muted-foreground hover:text-foreground transition-all group/back uppercase tracking-widest"
                >
                    <ArrowLeft className="h-3 w-3 transition-transform group-hover/back:-translate-x-1" /> Back to Login
                </button>
            </div>
        </div>
    );
}
