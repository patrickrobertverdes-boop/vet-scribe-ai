'use client';

import React, { useState, useEffect } from 'react';
import {
    HardDrive,
    Database,
    FolderOpen,
    ArrowRightLeft,
    RefreshCw,
    ShieldCheck,
    Activity,
    Calendar,
    Settings2,
    Lock,
    Download,
    Terminal,
    Check
} from 'lucide-react';
import { CustomSelect } from "@/components/ui/custom-select";
import toast from 'react-hot-toast';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

export default function IntegrationPage() {
    const router = useRouter();
    const [sourcePath, setSourcePath] = useState('C:\\PMS\\Data');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        const connector = (window as any).avimarkConnector;

        if (connector) {
            try {
                await connector.shadowCopy(sourcePath, 'C:\\VetScribe\\ShadowData');
                setLastSync(new Date().toLocaleTimeString());
                toast.success('Protocol Synced Successfully');
            } catch (error) {
                toast.error('Sync Failed: Connector Error');
            }
        } else {
            // Mock success for web preview if not in Electron
            await new Promise(resolve => setTimeout(resolve, 1500));
            setLastSync(new Date().toLocaleTimeString());
            toast.success('Sync Simulated (Web Preview)');
        }
        setIsSyncing(false);
    };

    return (
        <div className="flex flex-col flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 md:pb-20 px-1">
            {/* Header - Mirroring Dashboard */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-[0.22em] border border-primary px-2 py-0.5 rounded bg-primary">
                            Bridge Active
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
                        className="h-10 px-4 border border-border rounded text-foreground hover:bg-muted transition-all flex items-center gap-2.5 bg-card"
                    >
                        <Activity className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Logs</span>
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
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="h-10 px-5 bg-primary text-primary-foreground rounded font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2.5 shadow-none border border-primary disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4 no-demote", isSyncing && "animate-spin")} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </header>

            {/* Bridge Stats - Simplified like Dashboard */}
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Gateway Node', value: '01', trend: 'Local', icon: HardDrive },
                    { label: 'Integrity', value: 'Live', trend: 'Encrypted', icon: ShieldCheck },
                    { label: 'Last Sync', value: lastSync || '--:--', trend: 'Status', icon: Clock },
                    { label: 'Latency', value: '04', trend: 'ms', icon: Activity },
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
                            <p className="text-2xl font-bold font-serif tracking-tight text-foreground">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Configuration - Clean like Dashboard modules */}
            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full">
                        <div className="px-8 py-5 border-b border-border/60 flex items-center justify-between bg-card">
                            <div className="flex items-center gap-4">
                                <div className="h-9 w-9 border border-black dark:border-border rounded flex items-center justify-center text-foreground">
                                    <Database className="h-4 w-4" />
                                </div>
                                <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Protocol Setup</h2>
                            </div>
                            <div className="h-7 px-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Optimal Connection</span>
                            </div>
                        </div>

                        <div className="p-8 space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground tracking-tight">Local Database Parameters</h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                                    Define the direct link between VetScribe and your clinic management system.
                                    A read-only shadow copy will be utilized to ensure zero impact on production data performance.
                                </p>
                            </div>

                            <div className="space-y-8 max-w-2xl">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <FolderOpen className="h-3 w-3" /> Data Source Path
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="h-11 px-4 flex-1 bg-muted/30 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="C:\AVImark\Data"
                                            value={sourcePath}
                                            onChange={(e: any) => setSourcePath(e.target.value)}
                                        />
                                        <button className="h-11 px-6 border border-border rounded-lg text-foreground hover:bg-muted text-[10px] font-bold uppercase tracking-widest transition-all bg-card active:scale-95">
                                            Browse
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">
                                        * Target root clinical database directory
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRightLeft className="h-3 w-3" /> Sync Frequency
                                    </label>
                                    <div className="max-w-xs">
                                        <CustomSelect
                                            value="15"
                                            onChange={() => { }}
                                            options={[
                                                { label: "Real-time (5 min)", value: "5" },
                                                { label: "Standard (15 min)", value: "15" },
                                                { label: "Hourly", value: "60" },
                                                { label: "Manual", value: "manual" },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border p-8 rounded-xl flex flex-col gap-8 shadow-sm h-full">
                        <div className="space-y-6">
                            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Security Protocol</h2>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border bg-card">
                                        <Lock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Standard</p>
                                        <p className="font-bold text-sm text-foreground">AES-256 Lock</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border bg-card">
                                        <Terminal className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Bridge Agent</p>
                                        <p className="font-bold text-sm text-foreground">v{(process as any).env?.NEXT_PUBLIC_APP_VERSION || '1.0.4'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-6">
                            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Download className="h-4 w-4 text-primary" />
                                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">Update Required</p>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Ensure the Pro Bridge Agent is active on your server for direct database access.
                                </p>
                                <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline pt-1 flex items-center gap-2">
                                    Download Agent <ArrowRightLeft className="h-3 w-3" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/40 animate-pulse" />
                                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Interface Stability</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Nominal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Re-using some components for cleaner import structure
import {
    Clock
} from 'lucide-react';
