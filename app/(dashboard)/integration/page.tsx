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
    Lock,
    ListChecks,
    Activity,
    Stethoscope,
    Users,
    Clock,
    Plus,
    Wand2,
    Calendar
} from 'lucide-react';
import { CustomSelect } from "@/components/ui/custom-select";
import toast from 'react-hot-toast';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

export default function IntegrationPage() {
    const router = useRouter();
    const [sourcePath, setSourcePath] = useState('C:\\PMS\\Data');

    return (
        <div className="flex flex-col flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 md:pb-20 px-1">
            {/* Practice Command Header - MIRRORING DASHBOARD */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-[0.22em] border border-primary px-2 py-0.5 rounded bg-primary">
                            Gateway Active
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
                            Server <span className="text-foreground font-normal">Bridge</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => router.push('/analytics')}
                        className="h-10 px-4 border border-border rounded text-foreground hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2.5 bg-card"
                    >
                        <Activity className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Analytics</span>
                    </button>

                    <div className="h-10 border border-border px-4 rounded flex items-center gap-3 bg-card">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="text-left">
                            <p className="text-[11px] font-bold text-foreground leading-none">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            const connector = (window as any).avimarkConnector;
                            if (connector) {
                                toast.promise(
                                    connector.shadowCopy(sourcePath, 'C:\\VetScribe\\ShadowData'),
                                    {
                                        loading: 'Syncing...',
                                        success: 'Protocol Synced',
                                        error: 'Sync Failed',
                                    }
                                );
                            } else {
                                toast.error("Bridge Connection Required");
                            }
                        }}
                        className="h-10 px-5 bg-primary text-primary-foreground rounded font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2.5 shadow-none border border-primary"
                    >
                        <RefreshCw className="h-4 w-4 no-demote" />
                        Sync Now
                    </button>
                </div>
            </header>

            {/* Performance Stats - MIRRORING DASHBOARD */}
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Gateway Node', value: '01', trend: 'Local', icon: HardDrive },
                    { label: 'Success Rate', value: '100', trend: 'Live', icon: ShieldCheck },
                    { label: 'Sync Cycles', value: '42', trend: 'Live', icon: RefreshCw },
                    { label: 'Latency', value: '08', trend: 'ms', icon: Activity },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="bg-card border border-border rounded-xl p-6 group transition-all cursor-pointer hover:border-primary/50 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="icon-square">
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-border transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                                {stat.trend}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</p>
                            <p className="text-3xl font-bold font-serif tracking-tight text-foreground">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Operating Modules - MIRRORING DASHBOARD */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Configuration Module (Replaces Checklist) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full shadow-sm transition-colors">
                        <div className="px-8 py-5 border-b border-border/60 flex items-center justify-between bg-card transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-9 w-9 border border-black dark:border-border rounded flex items-center justify-center text-foreground">
                                    <Database className="h-4 w-4" />
                                </div>
                                <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Protocol Configuration</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-7 px-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-none">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-10">
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-foreground tracking-tight underline border-b-2 border-primary/20 pb-1 w-fit">Local Gateway Parameters</p>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl font-medium">
                                    Configure the direct link between VetScribe and your local PMS database. This protocol initiates a secure, read-only shadow copy to ensure absolute production stability.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <FolderOpen className="h-3 w-3" /> Source Data Directory
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="input-premium flex-1"
                                            placeholder="C:\PMS\Data"
                                            value={sourcePath}
                                            onChange={(e) => setSourcePath(e.target.value)}
                                        />
                                        <button className="h-12 px-6 border border-border rounded-xl text-foreground hover:bg-muted text-[10px] font-bold uppercase tracking-widest transition-all bg-card shadow-sm">
                                            Browse
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">
                                        * Target root clinical database (e.g. C:\AVImark\Data)
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRightLeft className="h-3 w-3" /> Sync Frequency
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
                        </div>
                    </div>
                </div>

                {/* Status Sidebar (Replaces Command Actions) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border p-8 rounded-xl flex flex-col gap-8 shadow-sm h-full transition-colors">
                        <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">Protocol Health</h2>

                        <div className="flex flex-col gap-4">
                            <div className="w-full min-h-[4.5rem] flex items-center gap-5 px-6 rounded-xl border border-border bg-card group">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border bg-card transition-all shrink-0">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-left py-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Integrity Lock</p>
                                    <p className="font-bold text-sm text-foreground">Read-Only Active</p>
                                </div>
                            </div>

                            <div className="w-full min-h-[4.5rem] flex items-center gap-5 px-6 rounded-xl border border-border bg-card group">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border bg-card transition-all shrink-0">
                                    <Lock className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-left py-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Security Standard</p>
                                    <p className="font-bold text-sm text-foreground">AES-256 Encrypted</p>
                                </div>
                            </div>
                        </div>

                        {/* System Health Module - MIRRORING DASHBOARD */}
                        <div className="pt-8 border-t border-black dark:border-slate-800 mt-auto space-y-5">
                            <div className="p-5 rounded-xl bg-primary/5 border border-border space-y-3 border-dashed">
                                <div className="flex items-center gap-3">
                                    <Download className="h-3 w-3 text-primary" />
                                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">Desktop Required</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight leading-relaxed">
                                    Direct filesystem access requires the Pro Bridge Agent.
                                </p>
                                <button className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline pt-1">
                                    Download Agent
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-md shadow-emerald-500/20" />
                                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest leading-none">
                                        Interface Stability
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Nominal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
