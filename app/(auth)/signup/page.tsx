'use client';
export const dynamic = "force-dynamic";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();
    const { user, signup } = useAuth();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            const isGoogleUser = user.providerData.some(p => p.providerId.includes('google'));
            if (user.emailVerified || isGoogleUser) {
                router.replace('/');
            }
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (firstName.trim().length === 0 || lastName.trim().length === 0) {
            toast.error("Please enter your full name");
            return;
        }

        setIsSubmitting(true);
        try {
            await signup(email, password, firstName, lastName);
            // Redirect happens in AuthContext
        } catch (error: any) {
            console.error("Signup error:", error);
            toast.error(error.message);
        } finally {
            // Always clear loading state
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative z-10 w-full max-w-md p-8 md:p-12 glass border-none shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-500">
            {/* Clinical Brand Identity */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded bg-primary text-primary-foreground mb-6 shadow-sm">
                    <Zap className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                    Practice Registration
                </h1>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Establish clinical credentials for your practice.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">First Name</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                            placeholder="Alex"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Name</label>
                        <input
                            type="text"
                            required
                            className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                            placeholder="Smith"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Professional Email</label>
                    <input
                        type="email"
                        required
                        className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                        placeholder="doctor@practice.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Security Key</label>
                    <input
                        type="password"
                        required
                        className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confirm Key</label>
                    <input
                        type="password"
                        required
                        className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <div className="pt-4 space-y-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-premium w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Initialize Account <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">
                            <span className="bg-card px-3">Infrastructure SSO</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={useAuth().signInWithGoogle}
                        className="w-full h-10 border border-border text-foreground font-medium text-sm rounded bg-card hover:bg-muted transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                            />
                        </svg>
                        Clinical Onboarding
                    </button>
                </div>
            </form>

            <div className="mt-10 text-center">
                <p className="text-xs text-muted-foreground">
                    Existing credentials?{' '}
                    <Link href="/login" className="text-primary font-semibold hover:underline decoration-primary/30 transition-all">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
