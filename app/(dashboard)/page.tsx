'use client';

import { useState, useEffect } from 'react';
import {
    Stethoscope,
    Users,
    FileText,
    Clock,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Wand2,
    Plus,
    Activity,
    TrendingUp,
    ShieldCheck,
    Waves,
    ExternalLink,
    Search,
    Shield,
    Database,
    Zap,
    ListChecks,
    Check,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AIProfileCreator } from '@/components/patient/ai-profile-creator';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ChecklistItem } from '@/lib/types';

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [showAICreator, setShowAICreator] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState({ patients: 0, consultations: 0 });
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);

    useEffect(() => {
        setMounted(true);
        if (!user || user.isAnonymous) return;

        let unsubscribeStats = () => { };
        let unsubscribeChecklist = () => { };

        try {
            unsubscribeStats = firebaseService.subscribeToPracticeStats(user.uid, (data) => {
                setStats(data);
            });

            unsubscribeChecklist = firebaseService.subscribeToChecklist(user.uid, (items) => {
                setChecklist(items);
                setIsLoadingChecklist(false);
            });
        } catch (err) {
            console.error("[Dashboard] Early access error handled:", err);
            setIsLoadingChecklist(false);
        }

        return () => {
            unsubscribeStats();
            unsubscribeChecklist();
        };
    }, [user]);

    if (!mounted) return null;

    const handleCreated = () => {
        toast.success('New patient added successfully!');
        router.push('/patients');
    };

    const handleInitializeScribe = async () => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
        }
        toast.success('Opening recording...');
        router.push('/record');
    };

    const handleToggleCheckItem = async (itemId: string, completed: boolean) => {
        if (!user) return;
        try {
            await firebaseService.toggleChecklistItem(user.uid, itemId, !completed);
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const pendingTasksCount = checklist.filter(i => !i.completed).length;

    return (
        <div className="flex flex-col flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 md:pb-20 px-1">
            {/* Practice Command Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-[0.22em] border border-primary px-2 py-0.5 rounded bg-primary">
                            System Standby
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
                            Welcome Back, <span className="text-foreground font-normal">Dr. {user?.displayName?.split(' ')[1] || user?.email?.split('@')[0] || 'Physician'}</span>
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
                        onClick={handleInitializeScribe}
                        className="h-10 px-5 bg-primary text-primary-foreground rounded font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2.5 shadow-none border border-primary"
                    >
                        <Zap className="h-4 w-4 no-demote" />
                        Initialize Scribe
                    </button>
                </div>
            </header>

            {/* Performance Stats */}
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Active Clinic', value: '01', trend: 'Local', icon: Stethoscope },
                    { label: 'Saved Records', value: stats.consultations.toString().padStart(2, '0'), trend: 'Live', icon: ShieldCheck },
                    { label: 'Total Patients', value: stats.patients.toString().padStart(2, '0'), trend: 'Live', icon: Users },
                    { label: 'Current Date', value: new Date().getDate().toString().padStart(2, '0'), trend: 'System', icon: Clock },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="bg-card border border-border rounded-xl p-6 group transition-all cursor-pointer hover:border-primary/50"
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

            {/* Operating Modules */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Clinical Checklist Module */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full shadow-sm transition-colors">
                        <div className="px-8 py-5 border-b border-border/60 flex items-center justify-between bg-card transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-9 w-9 border border-black dark:border-border rounded flex items-center justify-center text-foreground">
                                    <ListChecks className="h-4 w-4" />
                                </div>
                                <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Protocol Checklist</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href="/checklist" className="text-[10px] font-bold text-foreground hover:underline transition-all uppercase tracking-widest leading-none">
                                    Index
                                </Link>
                                <Link href="/checklist?focus=true" className="h-7 px-3 bg-primary text-primary-foreground hover:opacity-90 border border-border rounded text-[9px] font-bold uppercase tracking-widest flex items-center transition-all ml-4">
                                    + Add
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 divide-y divide-border/20 relative min-h-[300px]">
                            {isLoadingChecklist ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mt-4">Syncing Archive...</p>
                                </div>
                            ) : checklist.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                    <Shield className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-1">No Active Tasks</p>
                                    <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">Your clinical checklist is clear. Add new tasks to track protocols.</p>
                                </div>
                            ) : (
                                checklist.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-5 px-8 py-5 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer group"
                                        onClick={() => handleToggleCheckItem(item.id, item.completed)}
                                    >
                                        <div className={cn(
                                            "h-5 w-5 rounded border transition-all flex items-center justify-center shrink-0",
                                            item.completed
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "border-border group-hover:border-primary-foreground"
                                        )}>
                                            {item.completed && <Check className="h-3 w-3" />}
                                        </div>
                                        <span className={cn(
                                            "text-sm font-bold flex-1 leading-relaxed",
                                            item.completed ? "line-through opacity-50" : "text-foreground"
                                        )}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))
                            )}
                            {!isLoadingChecklist && checklist.length > 5 && (
                                <div className="px-8 py-4 bg-muted/50 border-t border-border flex justify-center">
                                    <Link href="/checklist" className="text-[10px] font-bold text-foreground uppercase tracking-widest hover:underline">
                                        View {checklist.length - 5} More Tasks
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Command Actions Module */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border p-8 rounded-xl flex flex-col gap-8 shadow-sm h-full transition-colors">
                        <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">Command Protocol</h2>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleInitializeScribe}
                                className="w-full min-h-[4.5rem] flex items-center gap-5 px-6 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground transition-all group bg-card"
                            >
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border bg-card group-hover:bg-primary-foreground/20 transition-all shrink-0">
                                    <Wand2 className="h-5 w-5 no-demote" />
                                </div>
                                <div className="text-left py-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-primary-foreground/60">Voice Protocol</p>
                                    <p className="font-bold text-sm text-foreground group-hover:text-primary-foreground">Launch AI Scribe</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowAICreator(true)}
                                className="w-full min-h-[4.5rem] flex items-center gap-5 px-6 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground transition-all group bg-card"
                            >
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border bg-card group-hover:bg-primary-foreground/20 transition-all shrink-0">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <div className="text-left py-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-primary-foreground/60">Patient Database</p>
                                    <p className="font-bold text-sm text-foreground group-hover:text-primary-foreground">Add New Patient</p>
                                </div>
                            </button>
                        </div>

                        {/* System Health Module */}
                        <div className="pt-8 border-t border-black dark:border-slate-800 mt-auto space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-black dark:bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest leading-none">
                                        System Integrity
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-black dark:text-emerald-400 uppercase tracking-widest bg-white dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-black dark:border-emerald-500/20">Nominal</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <span>Sync Latency</span>
                                    <span>24ms</span>
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-border rounded-full w-[2%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {
                showAICreator && (
                    <AIProfileCreator
                        onClose={() => setShowAICreator(false)}
                        onCreated={handleCreated}
                    />
                )
            }
        </div >
    );
}
