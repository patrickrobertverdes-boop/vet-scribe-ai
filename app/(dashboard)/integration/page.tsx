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
    ShieldCheck
} from 'lucide-react';
import { CustomSelect } from "@/components/ui/custom-select";
import toast from 'react-hot-toast';

export default function IntegrationPage() {
    const [sourcePath, setSourcePath] = useState('C:\\PMS\\Data');

    return (
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 md:pb-20">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 bg-slate-900 dark:bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                        <HardDrive className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">System Interconnect</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-none mb-4 md:mb-6">Server <span className="text-primary italic">Bridge</span></h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">Configure local gateway parameters for on-premise clinical data synchronization.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                {/* Main Config Card */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-border shadow-inner space-y-8 relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-start gap-6 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
                                <Database className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground tracking-tight">Clinic Server Bridge</h3>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-lg mt-2">
                                    Securely link VetScribe to your local practice management server. This creates a read-only shadow copy of your patient database to ensure zero performance impact on your live system.
                                </p>
                            </div>
                        </div>

                        {/* Connection Status */}
                        <div className="relative z-10 flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Gateway Active</span>
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <FolderOpen className="h-3 w-3" /> Source Data Path
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="C:\ClinicData\Server"
                                        className="flex-1 h-12 bg-card border border-border rounded-xl px-4 text-xs font-mono text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={sourcePath}
                                        onChange={(e) => setSourcePath(e.target.value)}
                                    />
                                    <button className="h-12 px-6 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                        Browse
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground/60 italic">
                                    * Point this to the root folder of your PMS database files (e.g. .dbf, .dat)
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <ArrowRightLeft className="h-3 w-3" /> Shadow Copy Frequency
                                </label>
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

                            <div className="pt-6 border-t border-border/50 flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={() => {
                                        const connector = (window as any).avimarkConnector;
                                        if (connector) {
                                            toast.promise(
                                                connector.shadowCopy(sourcePath, 'C:\\VetScribe\\ShadowData'),
                                                {
                                                    loading: 'Syncing database...',
                                                    success: 'Database synced successfully!',
                                                    error: 'Sync failed. Check permissions.',
                                                }
                                            );
                                        } else {
                                            toast.error("Bridge not detected. Please install the Desktop App.");
                                        }
                                    }}
                                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-3"
                                >
                                    <RefreshCw className="h-4 w-4" /> Force Sync Now
                                </button>
                                <button className="flex-1 h-12 bg-card border border-border text-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-3">
                                    <FileText className="h-4 w-4" /> View Sync Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-white text-lg font-bold tracking-tight mb-2">Operational Security</h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed mb-6">
                                All local data transfers are encrypted and audit-logged. Your live practice server is never written to, ensuring absolute data integrity.
                            </p>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Read-Only Protocol</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-emerald-500/20 rounded-full blur-3xl" />
                    </div>

                    {/* Desktop App Promo (Visible if web) */}
                    <div className="p-6 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 flex items-start gap-5">
                        <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                            <Download className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wide">Desktop App Required</h4>
                            <p className="text-[10px] text-orange-700/80 dark:text-orange-300/80 leading-relaxed">
                                Direct local database access requires the VetScribe Pro Desktop Application.
                            </p>
                            <button className="mt-2 text-[10px] font-bold text-orange-800 dark:text-orange-200 underline decoration-2 underline-offset-4 hover:text-orange-950">
                                Download Installer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
