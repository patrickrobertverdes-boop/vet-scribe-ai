'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CheckCircle2, XCircle, Loader2, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function VerifySuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const oobCode = searchParams.get('oobCode');

        if (!oobCode || !auth) {
            setStatus('error');
            setMessage('Invalid or missing verification code.');
            return;
        }

        const verify = async () => {
            try {
                await applyActionCode(auth!, oobCode);
                setStatus('success');
                // Redirect after success
                setTimeout(() => {
                    router.push('/login?verified=true');
                }, 4000);
            } catch (error: any) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage(error.message || 'Failed to verify email. The link may be expired.');
            }
        };

        verify();
    }, [searchParams, router]);

    return (
        <div className="min-h-dvh bg-mesh flex items-center justify-center p-6">
            <div className="glass rounded-[1.5rem] p-8 md:p-12 max-w-md w-full relative overflow-hidden text-center transition-all duration-500">
                {status === 'loading' && (
                    <div className="space-y-6">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-900/5 dark:bg-white/5 text-cyan-500 mb-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-medium tracking-tight text-foreground">
                            Verifying Credentials
                        </h1>
                        <p className="text-[14px] text-muted-foreground">
                            Synchronizing your practice with our secure network...
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 mb-2 shadow-2xl shadow-emerald-500/20">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h1 className="text-3xl font-medium tracking-tight text-foreground">
                            Email Verified
                        </h1>
                        <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                            Welcome to the elite tier of clinical intelligence. Your account is now fully activated.
                        </p>

                        <div className="pt-4">
                            <Link
                                href="/login"
                                className="btn-premium w-full bg-slate-900 dark:bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 hover:bg-slate-800 dark:hover:bg-emerald-500"
                            >
                                Enter Console <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.1em] font-medium">
                            Auto-redirecting in a moments...
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-500 mb-2">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-medium tracking-tight text-foreground">
                            Link Expired
                        </h1>
                        <p className="text-[14px] text-muted-foreground leading-relaxed">
                            {message}
                        </p>
                        <div className="pt-4">
                            <Link
                                href="/login"
                                className="w-full h-12 border border-slate-200 dark:border-white/10 text-foreground font-semibold text-sm rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center"
                            >
                                Return to Login
                            </Link>
                        </div>
                    </div>
                )}

                {/* Bottom Branding */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-500" />
                    <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        VetScribe Pro
                    </span>
                </div>
            </div>
        </div>
    );
}
