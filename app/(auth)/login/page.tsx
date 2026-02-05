'use client';
export const dynamic = "force-dynamic";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (searchParams.get('verified')) {
            toast.success('Email verified! You can now access your console.');
        }
    }, [searchParams]);

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
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (error: any) {
            toast.error(error.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative z-10 w-full max-w-md p-8 md:p-12 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl animate-in fade-in zoom-in-95 duration-500">
            {/* Simple Clean Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-black dark:bg-white text-white dark:text-black mb-6 shadow-sm">
                    <Zap className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                    Welcome Back
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enter your email and password to access your account.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                    <input
                        type="email"
                        required
                        autoFocus
                        className="w-full h-11 px-4 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all outline-none placeholder:text-slate-400"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                        <button type="button" className="text-xs text-slate-500 hover:text-black dark:hover:text-white transition-colors">
                            Forgot password?
                        </button>
                    </div>
                    <input
                        type="password"
                        required
                        className="w-full h-11 px-4 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all outline-none placeholder:text-slate-400"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="pt-2 space-y-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Log In <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-medium text-slate-500">
                            <span className="bg-white dark:bg-black px-3">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={useAuth().signInWithGoogle}
                        className="w-full h-11 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-lg bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
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
                        Log in with Google
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-black dark:text-white font-semibold hover:underline transition-all">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
