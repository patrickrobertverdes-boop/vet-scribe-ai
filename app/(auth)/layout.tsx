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
        <div className="min-h-dvh bg-white text-black flex flex-col overflow-x-hidden [--background:0_0%_100%] [--foreground:0_0%_0%] [--border:0_0%_90%] selection:bg-black selection:text-white">
            {/* Clinical Header */}
            <header className="h-16 border-b border-slate-200 flex items-center px-6 bg-white shrink-0">
                <Link href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                    <div className="h-6 w-6 bg-black rounded-sm flex items-center justify-center text-white">
                        <Zap className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight leading-none text-black">VetScribe</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500 mt-0.5">Clinical Access</span>
                    </div>
                </Link>
            </header>

            {/* Anchored Content Area */}
            <main className="flex-1 w-full max-w-sm mx-auto pt-10 px-4 pb-8 bg-white text-black">
                {children}
            </main>

            {/* Utility Footer */}
            <footer className="py-8 border-t border-slate-100 text-center bg-white mt-auto shrink-0">
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-[0.2em]">
                    Authorized Clinical Personnel Only
                </p>
            </footer>
        </div>
    );
}
