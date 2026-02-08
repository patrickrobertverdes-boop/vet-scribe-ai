import { Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
            {/* Global Infrastructure Header */}
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
                <Link href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                    <div className="h-7 w-7 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black shadow-sm">
                        <Zap className="h-4 w-4 fill-current" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-black tracking-tight leading-none text-black dark:text-white font-serif">VetScribe</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-1">Legal Archive</span>
                    </div>
                </Link>
                <Link
                    href="/login"
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Entry
                </Link>
            </header>

            {/* Content Buffer */}
            <main className="flex-1 w-full max-w-3xl mx-auto py-12 px-6 md:py-20 lg:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </main>

            {/* Professional Footer */}
            <footer className="py-12 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="max-w-3xl mx-auto px-6 text-center space-y-4">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.25em]">
                        Clinical Productivity Infrastructure
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms</Link>
                        <Link href="/security" className="hover:text-black dark:hover:text-white transition-colors">Security</Link>
                    </div>
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-700 pt-4">
                        © {new Date().getFullYear()} VetScribe Clinical. Unauthorized duplication is strictly prohibited.
                    </p>
                </div>
            </footer>
        </div>
    );
}
