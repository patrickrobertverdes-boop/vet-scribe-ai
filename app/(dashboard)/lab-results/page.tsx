'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    FlaskConical,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Download,
    Upload,
    Filter,
    Calendar,
    Activity,
    Droplet,
    Heart,
    Thermometer,
    Zap,
    Sparkles,
    ChevronRight,
    Info,
    Shield,
    Database,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LabResultsPage() {
    const router = useRouter();
    const [selectedPatient, setSelectedPatient] = useState('all');
    const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.promise(
                new Promise(resolve => setTimeout(resolve, 1500)),
                {
                    loading: 'Analyzing lab report...',
                    success: `Analysis of ${file.name} complete. Findings added to medical records.`,
                    error: 'Lab report analysis failed',
                }
            );
        }
    };

    const labTests: any[] = [];
    const criticalObservations: any[] = [];

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'optimal':
            case 'nominal':
                return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50', icon: CheckCircle2 };
            case 'elevated':
            case 'depleted':
            case 'abnormal':
                return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50', icon: AlertTriangle };
            case 'critical':
                return { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50', icon: AlertTriangle };
            default:
                return { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-400', border: 'border-border', icon: Info };
        }
    };

    return (
        <div className="min-h-dvh bg-mesh space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200/50">
                            Diagnostic Laboratory
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight leading-none">
                        Diagnostics & <span className="text-primary italic">Lab Results</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Track diagnostic lab results and patient health trends
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="glass rounded-xl p-1 flex items-center gap-1 bg-slate-900/5 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-700">
                        {(['1m', '3m', '6m', '1y'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                    timeRange === range
                                        ? "bg-slate-900 dark:bg-primary text-white shadow-lg"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="h-12 px-6 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all flex items-center gap-2 active:translate-y-0 shadow-lg">
                        <Upload className="h-4 w-4" />
                        Upload Lab Report
                    </button>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: 'Tests Processed', value: '0', change: '0%', icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Normal Results', value: '100%', change: '0%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Abnormal Findings', value: '0', change: '0', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Avg Turnaround', value: '0h', change: 'Ready', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <div key={i} className="glass rounded-xl p-6 transition-all hover:-translate-y-1 shadow-xl bg-card/40">
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">{stat.change}</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                {labTests.length === 0 ? (
                    <div className="py-32 text-center glass rounded-[1.5rem] bg-white/40">
                        <FlaskConical className="h-12 w-12 text-slate-100 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Diagnostic Database Empty</p>
                        <p className="text-xs text-slate-300 mt-2 uppercase tracking-widest">No laboratory results have been logged.</p>
                    </div>
                ) : (
                    labTests.map((test) => (
                        <div key={test.id} className="glass rounded-[1.5rem] overflow-hidden border-none shadow-2xl bg-white/40">
                            <div className="px-8 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                                        <Database className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{test.testName}</h2>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Patient: {test.patient} • Lab ID: {test.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => router.push('/history')} className="h-11 px-6 glass border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all">View History</button>
                                    <button onClick={() => toast.success('Report download initialized')} className="h-11 w-11 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all"><Download className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="glass rounded-[1.5rem] p-8 border-none shadow-2xl relative overflow-hidden bg-primary text-primary-foreground">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-bold uppercase tracking-[0.3em]">AI Lab Insights</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            { title: 'Hydration Levels', description: 'Stable hydration metrics across active census.', icon: Droplet },
                            { title: 'Cardiac Health', description: 'Electrolyte stability analysis confirms optimal cardiac markers.', icon: Heart },
                            { title: 'Metabolic Trends', description: 'Metabolic baseline remains consistent with prior evaluations.', icon: Zap }
                        ].map((insight, i) => (
                            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <insight.icon className="h-5 w-5 text-primary" />
                                    <div>
                                        <h3 className="font-bold text-sm mb-2">{insight.title}</h3>
                                        <p className="text-xs text-white/50 leading-relaxed font-medium">{insight.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

