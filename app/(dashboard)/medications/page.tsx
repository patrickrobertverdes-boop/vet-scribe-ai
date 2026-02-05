'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Pill,
    Search,
    PlusCircle,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Calendar,
    Clock,
    Filter,
    ShieldCheck,
    FlaskConical,
    ChevronRight,
    MoreHorizontal,
    Box,
    FileText,
    Activity,
    Shield,
    Zap,
    Download,
    History as HistoryIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MedicationsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'pharmacy' | 'inventory' | 'history'>('pharmacy');

    const activeMedications: any[] = [];
    const inventory: any[] = [];
    const rxLedger: any[] = [];

    const analytics = [
        { label: 'Active Treatments', value: '0', change: '0%', icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Inventory Alerts', value: '0', change: '0', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Pending Authorizations', value: '0', change: 'Ready', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Clinical Protocol Index', value: '0', change: 'Stable', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' }
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Pharmacy Intelligence Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/5 dark:bg-transparent dark:border dark:border-white/20 text-slate-500 dark:text-slate-100 text-[10px] font-bold uppercase tracking-widest border border-slate-200/50 dark:border-white/10">
                            Pharmacy Management
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight leading-none">
                        Clinical <span className="text-primary italic">Pharmacy</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                        Monitor prescriptions, manage inventory, and track treatment protocols.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => toast.success('Prescription interface loading...')} className="h-12 px-6 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all flex items-center gap-2 active:translate-y-0 shadow-lg">
                        <PlusCircle className="h-4 w-4" />
                        Create Prescription
                    </button>
                    <button onClick={() => router.push('/reports')} className="h-12 w-12 glass border border-border rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-95">
                        <FileText className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Metrics Breakdown */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {analytics.map((stat, i) => (
                    <div key={i} className="glass rounded-xl p-6 transition-all hover:-translate-y-1 shadow-xl bg-card/40">
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 dark:text-white/80 px-2 py-0.5 rounded-full">{stat.change}</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="glass rounded-xl p-1.5 flex items-center gap-1.5 w-fit border border-slate-100/50 dark:border-slate-700/50 shadow-sm bg-card/40">
                {(['pharmacy', 'inventory', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all",
                            activeTab === tab ? "bg-slate-900 dark:bg-transparent dark:border dark:border-white dark:text-white shadow-xl" : "text-slate-500 hover:bg-white dark:hover:bg-slate-800"
                        )}
                    >
                        {tab === 'pharmacy' ? 'Active Treatments' : tab === 'inventory' ? 'Inventory Ledger' : 'Prescription History'}
                    </button>
                ))}
            </div>

            {/* Dynamic Content */}
            <div className="space-y-8">
                {activeTab === 'pharmacy' && (
                    <div className="py-32 text-center glass rounded-[1.5rem] bg-white/40">
                        <Pill className="h-12 w-12 text-slate-100 dark:text-white/20 mx-auto mb-4 opacity-50" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No Active Treatments</p>
                    </div>
                )}
                {activeTab === 'inventory' && (
                    <div className="py-32 text-center glass rounded-[1.5rem] bg-white/40">
                        <Box className="h-12 w-12 text-slate-100 dark:text-white/20 mx-auto mb-4 opacity-50" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inventory Ledger Empty</p>
                        <button onClick={() => router.push('/reports')} className="mt-6 text-primary font-bold text-[10px] uppercase tracking-widest hover:underline">View Audit Logs</button>
                    </div>
                )}
                {activeTab === 'history' && (
                    <div className="py-32 text-center glass rounded-[1.5rem] bg-white/40">
                        <HistoryIcon className="h-12 w-12 text-slate-100 dark:text-white/20 mx-auto mb-4 opacity-50" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Prescription History Ledger Empty</p>
                    </div>
                )}
            </div>

            {/* AI Integration */}
            <div className="glass rounded-[2rem] p-10 bg-primary text-primary-foreground relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Zap className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-bold uppercase tracking-[0.3em]">AI Procurement Diagnostics</h2>
                    </div>
                    <div className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm text-center">
                        <p className="text-xs text-white/40 uppercase tracking-widest">Awaiting clinical data to generate pharmaceutical insights</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

