'use client';

import { useState } from 'react';
import {
    HardDrive,
    Database,
    FolderOpen,
    ArrowRightLeft,
    RefreshCw,
    FileText,
    Download,
    ShieldCheck,
    Zap,
    Lock
} from 'lucide-react';
import { CustomSelect } from "@/components/ui/custom-select";
import toast from 'react-hot-toast';
import { cn } from "@/lib/utils";

export default function IntegrationPage() {
    const [sourcePath, setSourcePath] = useState('C:\\PMS\\Data');

    return (
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 md:pb-20">
            {/* Command Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-[0.22em] border border-primary px-2 py-0.5 rounded bg-primary">
                            Protocol Interface
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
                            Server <span className="text-primary italic font-normal">Bridge</span>
                        </h1>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Local Gateway Configuration</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-10 border border-border px-4 rounded flex items-center gap-3 bg-card">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest group">
                            Secure Handshake
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Configuration Module */}
                <div className="lg:col-span-8">
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
                        <div className="px-8 py-5 border-b border-border/60 flex items-center justify-between bg-card">
                            <div className="flex items-center gap-4">
                                <div className="h-9 w-9 border border-border rounded flex items-center justify-center text-foreground">
                                    <Database className="h-4 w-4" />
                                </div>
                                <h2 className="text-xs font-bold text-foreground uppercase tracking-widest text-nowrap">Clinic Data Sync</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-10 flex-1">
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-foreground tracking-tight">Local Connection Parameters</p>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl font-medium">
                                    Link VetScribe directly to your local database files. This creates a secure, read-only shadow copy to avoid impacting your server's clinical operations.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <FolderOpen className="h-3 w-3" /> Source Data Root
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 h-12 bg-muted/30 border border-border rounded-lg px-4 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                                            value={sourcePath}
                                            onChange={(e) => setSourcePath(e.target.value)}
                                        />
                                        <button className="h-12 px-5 border border-border rounded-lg text-foreground hover:bg-muted text-[10px] font-bold uppercase tracking-widest transition-all bg-card">
                                            Browse
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 italic">
                                        * Point this to the root database folder (e.g. C:\PMS\Data)
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRightLeft className="h-3 w-3" /> Shadow Interval
                                    </label>
                                    <div className="max-w-md">
                                        <CustomSelect
                                            value="15"
                                            onChange={() => { }}
                                            options={[
                                                { label: "Real-time (Every 5 min)", value: "5" },
                                                { label: "Standard (Every 15 min)", value: "15" },
                                                { label: "Hourly", value: "60" },
                                                { label: "Manual Only", value: "manual" },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-border flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => {
                                        const connector = (window as any).avimarkConnector;
                                        if (connector) {
                                            toast.promise(
                                                connector.shadowCopy(sourcePath, 'C:\\VetScribe\\ShadowData'),
                                                {
                                                    loading: 'Initializing sync...',
                                                    success: 'Protocol synchronized.',
                                                    error: 'Sync error detected.',
                                                }
                                            );
                                        } else {
                                            toast.error("Bridge Connection Missing");
                                        }
                                    }}
                                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-95"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Force Data Refresh
                                </button>
                                <button className="flex-1 h-12 border border-border rounded-lg text-foreground hover:bg-muted text-[10px] font-bold uppercase tracking-widest transition-all bg-card flex items-center justify-center gap-2.5">
                                    <FileText className="h-4 w-4" />
                                    Review Audit Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Protocol Module */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Integrity Status */}
                    <div className="bg-card border border-border rounded-xl p-8 space-y-8 shadow-sm h-full flex flex-col">
                        <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">Protocol Health</h2>

                        <div className="space-y-6 flex-1">
                            <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest leading-none">Integrity Lock</p>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                    Read-only access is enforced by hardware protocol. Your primary database remains untouched and performance is never degraded.
                                </p>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-muted-foreground">Gateway Version</span>
                                    <span className="text-foreground">v0.1.0-build</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-muted-foreground">Link Status</span>
                                    <span className="text-emerald-500">Nominal</span>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Bridge Promo */}
                        <div className="mt-auto pt-8 border-t border-border space-y-5">
                            <div className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Download className="h-3 w-3 text-orange-500" />
                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Bridge Agent</p>
                                </div>
                                <p className="text-[10px] text-orange-700/80 dark:text-orange-400 font-medium leading-relaxed">
                                    Local filesystem access requires the Desktop Scribe Agent.
                                </p>
                                <button className="text-[9px] font-bold text-orange-600 uppercase tracking-widest hover:underline pt-2">
                                    Download Agent
                                </button>
                            </div>

                            <div className="flex items-center gap-3 px-1 py-1">
                                <Lock className="h-3 w-3 text-muted-foreground/40" />
                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">End-to-End Encryption Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
