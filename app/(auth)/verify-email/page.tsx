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
            await user.reload();
            if (user.emailVerified) {
                toast.success('Access granted.', { id: loadingToast });
                window.location.href = '/';
            } else {
                toast.error('Pending verification.', { id: loadingToast });
            }
        } catch (error: any) {
            toast.error('Sync failed.', { id: loadingToast });
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await resendVerification();
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
                    disabled={isResending}
                    className="w-full h-10 border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isResending ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
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
        </div>
    );
}
