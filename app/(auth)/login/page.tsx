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

    useEffect(() => {
        if (searchParams.get('verified')) {
            toast.success('Identity verified. Proceed with login.');
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            router.replace('/');
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Mobile First Deployment Section */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-black dark:bg-white rounded flex items-center justify-center text-white dark:text-black">
                        <Zap className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mobile Deployment</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                        href="#"
                        className="flex items-center justify-center gap-3 h-12 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl hover:border-black dark:hover:border-white transition-all group"
                    >
                        <svg className="h-5 w-5 fill-current grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white">Download iOS App</span>
                    </a>
                    <a
                        href="#"
                        className="flex items-center justify-center gap-3 h-12 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl hover:border-black dark:hover:border-white transition-all group"
                    >
                        <svg className="h-5 w-5 fill-current grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" viewBox="0 0 24 24">
                            <path d="M17.523 15.3414L12 12L17.523 8.65863C17.8285 8.47353 18.0163 8.13645 18 7.7651V4.2651C18 3.56637 17.243 3.12941 16.636 3.48316L3.36361 11.2185C2.75704 11.5721 2.75704 12.4278 3.36361 12.7815L16.636 20.5168C17.243 20.8706 18 20.4336 18 19.7349V16.2349C18.0163 15.8635 17.8285 15.5265 17.523 15.3414Z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white">Download APK</span>
                    </a>
                </div>
            </div>

            <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System Login</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Authenticate to access patient records.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Username / Email</label>
                        <input
                            type="email"
                            required
                            autoFocus
                            className="w-full h-10 px-3 rounded-md bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all outline-none placeholder:text-slate-400"
                            placeholder="user@clinic.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</label>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full h-10 px-3 rounded-md bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all outline-none placeholder:text-slate-400"
                            placeholder="Authorized credentials"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 rounded-md bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Authenticate <ArrowRight className="ml-2 h-3 w-3" />
                            </>
                        )}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                        <span className="flex-shrink-0 mx-4 text-[10px] text-slate-400 uppercase tracking-widest">Single Sign-On</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    </div>

                    <button
                        type="button"
                        onClick={useAuth().signInWithGoogle}
                        className="w-full h-10 border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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
                        Google Workspace
                    </button>

                    <div className="pt-2 text-center">
                        <Link href="/signup" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                            Register New Console
                        </Link>
                    </div>
                </div>
            </form>
        </div >
    );
}
