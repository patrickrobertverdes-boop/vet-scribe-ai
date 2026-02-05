import { Zap } from 'lucide-react';
import Link from 'next/link';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh bg-white dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col">
            {/* Clinical Header */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6">
                <Link href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                    <div className="h-6 w-6 bg-black dark:bg-white rounded-sm flex items-center justify-center text-white dark:text-black">
                        <Zap className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight leading-none text-black dark:text-white">VetScribe</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500 mt-0.5">Clinical Access</span>
                    </div>
                </Link>
            </header>

            {/* Anchored Content Area */}
            <main className="flex-1 w-full max-w-sm mx-auto pt-16 px-4 pb-12">
                {children}
            </main>

            {/* Utility Footer */}
            <footer className="py-6 border-t border-slate-100 dark:border-slate-900 text-center">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    Authorized Clinical Personnel Only
                </p>
            </footer>
        </div>
    );
}
