'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
    const router = useRouter();
    const { user, signup, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Security mismatch: Passwords do not correspond");
            return;
        }

        if (password.length < 6) {
            toast.error("Security insufficient: Minimum 6 characters required");
            return;
        }

        if (firstName.trim().length === 0 || lastName.trim().length === 0) {
            toast.error("Identity incomplete: Full designation required");
            return;
        }

        setIsSubmitting(true);
        try {
            await signup(email, password, firstName, lastName);
        } catch (error: any) {
            console.error("Registry error:", error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">New Registry Entry</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Establish credentials for clinical access.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">First Name</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full h-10 px-3 rounded-md bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all outline-none placeholder:text-slate-400"
                            placeholder="Alex"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Last Name</label>
                        <input
                            type="text"
                            required
                            className="w-full h-10 px-3 rounded-md bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all outline-none placeholder:text-slate-400"
                            placeholder="Smith"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Designation</label>
                    <input
                        type="email"
                        required
                        className="w-full h-10 px-3 rounded-md bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all outline-none placeholder:text-slate-400"
                        placeholder="name@clinic.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Security Key</label>
                    <input
                        type="password"
                        required
                        className="w-full h-10 px-3 rounded-md bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all outline-none placeholder:text-slate-400"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Confirm Key</label>
                    <input
                        type="password"
                        required
                        className="w-full h-10 px-3 rounded-md bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all outline-none placeholder:text-slate-400"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <div className="pt-2 space-y-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 rounded-md bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Initialize Registry <ArrowRight className="ml-2 h-3 w-3" />
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
                        onClick={signInWithGoogle}
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
                        <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                            Return to Login
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
