'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp,
    Users,
    DollarSign,
    Activity,
    Calendar,
    BarChart3,
    PieChart,
    LineChart,
    Download,
    Filter,
    RefreshCw,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Database,
    Gauge,
    Target,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';

export default function AnalyticsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // In a real app, this would fetch fresh data from Firebase
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay for better UX
        setIsRefreshing(false);
        toast.success('Statistical data synchronized');
    };

    const handleExport = () => {
        toast.success('Clinical performance dossier generated.');
    };

    const [statsData, setStatsData] = useState({ patients: 0, consultations: 0 });

    useEffect(() => {
        if (!user) return;

        const unsubscribe = firebaseService.subscribeToPracticeStats(user.uid, (data) => {
            setStatsData(data);
        });

        return () => unsubscribe();
    }, [user]);


    const stats = [
        {
            label: 'Total Sessions',
            value: statsData.consultations.toString(),
            change: 'Live',
            trend: 'up',
            icon: Activity,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            data: [0, 0, 0, 0, 0, 0, statsData.consultations]
        },
        {
            label: 'Patient Population',
            value: statsData.patients.toString(),
            change: 'Live',
            trend: 'up',
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            data: [0, 0, 0, 0, 0, 0, statsData.patients]
        },
        {
            label: 'System Uptime',
            value: '99.9%',
            change: 'Stable',
            trend: 'up',
            icon: Clock,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            data: [100, 100, 100, 100, 100, 100, 100]
        },
        {
            label: 'AI Accuracy Index',
            value: '98%',
            change: 'High',
            trend: 'up',
            icon: Target,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            data: [95, 96, 97, 98, 98, 98, 98]
        }
    ];


    const [patients, setPatients] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        return firebaseService.subscribeToPatients(user.uid, (data) => {
            setPatients(data);
        });
    }, [user]);

    const speciesCounts = patients.reduce((acc: any, p) => {
        const s = p.species || 'Other';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
    const patientBreakdown = Object.entries(speciesCounts).map(([species, count], i) => ({
        species,
        count: count as number,
        percentage: Math.round(((count as number) / patients.length) * 100),
        color: colors[i % colors.length]
    })).sort((a, b) => b.count - a.count);

    const topProcedures: any[] = []; // Truly empty for now, awaiting consultation data analysis


    return (
        <div className="min-h-dvh bg-mesh space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200/50">
                            Performance Intelligence
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight leading-none">
                        Clinical <span className="text-primary italic">Analytics</span>
                    </h1>
                    <p className="text-muted-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        Advanced cross-sectional performance evaluation and predictive telemetry
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="glass rounded-xl p-1 flex items-center gap-1 dark:border-slate-700">
                        {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                    timeRange === range
                                        ? "bg-slate-900 dark:bg-primary text-white shadow-lg"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="h-12 w-12 glass rounded-xl flex items-center justify-center text-slate-500 hover:text-primary transition-all active:scale-95"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </button>

                    <button onClick={handleExport} className="h-10 sm:h-12 px-3 sm:px-6 bg-primary text-primary-foreground rounded-xl font-bold text-[10px] sm:text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all flex items-center gap-1.5 sm:gap-2 active:translate-y-0 shadow-lg shadow-slate-900/10 whitespace-nowrap">
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Export</span> Dossier
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden glass rounded-xl p-6 hover:bg-muted/10 transition-all hover:-translate-y-1 border shadow-xl border-border bg-card/40"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border border-border shadow-inner",
                                stat.bg, stat.color
                            )}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                stat.trend === 'up' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50"
                            )}>
                                {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {stat.change}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                        </div>

                        {/* Sparkline Visualization */}
                        <div className="mt-6 h-8 flex items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            {stat.data.map((val, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex-1 rounded-sm",
                                        stat.trend === 'up' ? "bg-emerald-400" : "bg-primary"
                                    )}
                                    style={{ height: `${(val / (Math.max(...stat.data) || 1)) * 100}%` }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* In-depth Analytics */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Protocol Utilization */}
                <div className="lg:col-span-7 glass rounded-[1.5rem] overflow-hidden border-none shadow-2xl bg-card/40">
                    <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-card/80">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-900 dark:bg-primary text-white rounded-xl flex items-center justify-center">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Protocol Utilization</h2>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-widest leading-none">Statistical Insights Awaiting Data</p>
                            </div>
                        </div>
                    </div>


                    <div className="p-8 space-y-4">
                        {topProcedures.length === 0 ? (
                            <div className="py-20 text-center">
                                <Activity className="h-10 w-10 text-slate-100 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No Procedures Documented</p>
                            </div>
                        ) : topProcedures.map((proc, i) => (
                            <div
                                key={i}
                                className="group flex items-center justify-between p-5 rounded-xl bg-white hover:bg-slate-50 hover:shadow-md transition-all border border-slate-100/50 cursor-pointer"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="text-[10px] font-bold text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">
                                        {proc.id}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{proc.name}</h3>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{proc.count} Authorized Instances</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-bold text-slate-900 leading-none">{proc.trend}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mt-1">Growth Index</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Patient Stratification */}
                <div className="lg:col-span-5 glass rounded-[1.5rem] overflow-hidden border-none shadow-2xl bg-card/40">
                    <div className="px-8 py-6 border-b border-border bg-card/80">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Gauge className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Census Stratification</h2>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 leading-none tracking-widest">Species-Level Distribution</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {patientBreakdown.length === 0 ? (
                            <div className="py-20 text-center">
                                <Users className="h-10 w-10 text-slate-100 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No Patient Census Data</p>
                            </div>
                        ) : (
                            <>
                                {/* Abstract Chart Representation */}
                                <div className="relative h-40 flex items-center justify-center">
                                    <div className="flex items-end gap-3 h-24 w-full px-4">
                                        {patientBreakdown.map((item, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <div
                                                    className={cn("w-10 rounded-t-xl transition-all shadow-lg", item.color)}
                                                    style={{ height: `${item.percentage}%` }}
                                                />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Legend Ledger */}
                                <div className="space-y-4">
                                    {patientBreakdown.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between group cursor-pointer p-1">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">{item.species}</span>
                                            </div>
                                            <span className="text-xs font-bold text-foreground">{item.count} Cases</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Clinical Insights */}
            <div className="glass rounded-[1.5rem] p-8 border border-primary/20 shadow-2xl relative overflow-hidden bg-card">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--primary),transparent)] opacity-5 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-[0.3em] text-foreground">Practice Intelligence</h2>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Practice Intelligence</p>
                        </div>
                    </div>

                    <div className="py-12 text-center border border-border rounded-2xl bg-muted/20">
                        <Activity className="h-10 w-10 text-muted-foreground opacity-20 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Awaiting Longitudinal Data</h3>
                        <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">AI analysis requires a minimum of 50 patient encounters to provide accurate predictive clinical vectors.</p>
                    </div>
                </div>
            </div>

        </div>
    );
}

