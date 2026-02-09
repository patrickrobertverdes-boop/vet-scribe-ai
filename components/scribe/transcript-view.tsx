'use client';

import { useEffect, useRef } from "react";
import { Mic, Waves, Activity, Zap, Binary } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptViewProps {
    transcript: string;
    interimTranscript?: string;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'finished';
}

export function TranscriptView({ transcript, interimTranscript, connectionStatus }: TranscriptViewProps) {
    console.log('[TranscriptView] Render - final:', transcript.length, 'interim:', interimTranscript?.length, 'status:', connectionStatus);
    const bottomRef = useRef<HTMLDivElement>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((!transcript && !interimTranscript) || !containerRef.current) return;

        const container = containerRef.current;
        // Check if user is scrolled near bottom (within 100px)
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }, [transcript, interimTranscript]);

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] leading-none mb-1.5">AI Transcription</h3>
                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Real-time Stream</p>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all duration-500",
                    connectionStatus === 'connected' ? "bg-emerald-50 text-emerald-700 border-emerald-100 ring-1 ring-emerald-500/10" :
                        connectionStatus === 'connecting' ? "bg-amber-50 text-amber-700 border-amber-100 ring-1 ring-amber-500/10" :
                            "bg-slate-50 text-slate-500 border-slate-100"
                )}>
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all",
                        connectionStatus === 'connected' ? "bg-emerald-500 animate-pulse" :
                            connectionStatus === 'connecting' ? "bg-amber-500 animate-bounce" :
                                "bg-slate-300"
                    )} />
                    {connectionStatus === 'connected' ? 'Capture Active' :
                        connectionStatus === 'connecting' ? 'Calibrating...' : 'Standby Mode'}
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 min-h-[400px] glass border border-slate-200/50 rounded-2xl p-6 md:p-10 overflow-y-auto custom-scrollbar relative group transition-all bg-white/40 hover:bg-white shadow-2xl focus-within:ring-4 focus-within:ring-primary/5 scroll-smooth"
            >
                {(!transcript && !interimTranscript) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 transition-opacity">
                        <div className="h-16 w-16 md:h-20 md:w-20 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner">
                            <Waves className={cn(
                                "h-8 w-8 md:h-10 md:w-10",
                                connectionStatus === 'connected' ? "text-primary animate-pulse" : "text-slate-300"
                            )} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                {connectionStatus === 'connected' ? 'AI Synced & Listening' : `Awaiting Audio Data (${connectionStatus})`}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest italic px-4">
                                {connectionStatus === 'connected'
                                    ? 'Speech will appear here as you talk during the exam'
                                    : 'Start recording to begin medical record'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pb-4">
                        <p className="text-slate-800 font-serif font-medium leading-[1.8] text-base md:text-lg tracking-tight whitespace-pre-wrap break-words">
                            {transcript}
                            {interimTranscript && (
                                <span className="text-slate-500 italic transition-opacity duration-300 ml-1">
                                    {interimTranscript}
                                </span>
                            )}
                            <span className="inline-block h-4 w-1 md:h-5 md:w-1.5 bg-primary ml-1 animate-pulse rounded-full align-middle" />
                        </p>
                    </div>
                )}
                <div ref={bottomRef} className="h-4" />
            </div>

            {/* metadata Overlay removed as per user request */}
        </div>
    );
}
