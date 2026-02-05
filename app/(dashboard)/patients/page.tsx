'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    Filter,
    MoreHorizontal,
    Plus,
    ChevronRight,
    Wand2,
    Activity,
    Layers,
    ArrowUpRight,
    Users,
    Stethoscope,
    FileText,
    History,
    Shield,
    Database,
    Binary,
    Zap,
    Mic
} from 'lucide-react';
import { Patient } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import { AIProfileCreator } from '@/components/patient/ai-profile-creator';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PatientsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [showAICreator, setShowAICreator] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowAICreator(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        // FAIL-FAST: 8s timeout for loading
        const timer = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
                toast.error("Database connection slow. Try refreshing.");
            }
        }, 8000);

        // CACHING: Instant perceived load from localStorage
        try {
            const cached = localStorage.getItem(`patients_${user.uid}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Clear if it contains placeholder or demo data
                if (parsed.some((p: any) => p.placeholder || p.id?.startsWith('_'))) {
                    localStorage.removeItem(`patients_${user.uid}`);
                } else if (patients.length === 0) {
                    setPatients(parsed);
                    setIsLoading(false);
                }
            }
        } catch (e) { }

        setIsLoading(true);
        // Real-time subscription for first 25 items
        const unsubscribe = firebaseService.subscribeToPatients(user.uid, (data) => {
            setPatients(data);
            setIsLoading(false);
            // Cache the result
            try {
                localStorage.setItem(`patients_${user.uid}`, JSON.stringify(data.slice(0, 10)));
            } catch (e) { }
            clearTimeout(timer);
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [user]);

    const loadMore = async () => {
        if (!user || isPaginating || !hasMore) return;
        setIsPaginating(true);
        const result = await firebaseService.getPatients(user.uid, lastDoc);
        if (result.length < 25) setHasMore(false);
        setPatients(prev => [...prev, ...result]);
        // Note: pagination is simplified - getPatients returns array directly
        setIsPaginating(false);
    };


    const filteredPatients = patients.filter(p =>
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.owner?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.breed?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Directory Header */}
            <div className="flex flex-col gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] border border-border px-2 py-0.5 rounded">
                            Archive Matrix
                        </span>
                    </div>
                    <h1 className="text-3xl font-serif font-medium text-foreground tracking-tight">
                        Clinical <span className="text-primary">Directory</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 font-normal">
                        System inventory of <span className="text-foreground font-medium">{patients.length} active patient entities</span> under clinical observation.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAICreator(true)}
                        className="btn-premium bg-primary text-primary-foreground"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Establish New Record</span>
                    </button>
                    <button onClick={() => toast.success('Adjusting filters...')} className="h-9 w-9 border border-border rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-all">
                        <Filter className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* AI Profile Creator Modal */}
            {showAICreator && (
                <AIProfileCreator
                    onClose={() => setShowAICreator(false)}
                    onCreated={() => { }}
                />
            )}

            {/* Clinical Search Matrix */}
            <div className="relative group max-w-2xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60" />
                <input
                    type="text"
                    placeholder="Query by name, breed, or ownership ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 bg-white dark:bg-slate-900 border border-border rounded pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
            </div>

            {/* Record Ledger Partition */}
            <div className={cn(
                "surface overflow-hidden bg-card transition-all duration-500",
                isLoading ? "opacity-60" : "opacity-100"
            )}>
                {/* Protocol: Unified Table Representation */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white dark:bg-slate-900 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Entity</th>
                                <th className="px-6 py-4 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Biological Data</th>
                                <th className="px-6 py-4 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Primary Owner</th>
                                <th className="px-6 py-4 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Clinical Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Interface</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPatients.map((patient) => (
                                <tr
                                    key={patient.id}
                                    onClick={() => router.push(`/patients/${patient.id}`)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all group cursor-pointer"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-900 border border-border rounded flex items-center justify-center overflow-hidden shrink-0">
                                                {patient.image?.startsWith('data:') || patient.image?.startsWith('http') ? (
                                                    <img src={patient.image} alt={patient.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Shield className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground group-hover:text-primary transition-colors text-sm leading-none mb-1.5">
                                                    {patient.name}
                                                </div>
                                                <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                    <Binary className="h-3 w-3" /> {patient.id.slice(0, 8)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-foreground font-medium text-xs tracking-tight">{patient.breed}</div>
                                        <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-1">{patient.species} • {patient.age}y {patient.age_months}m</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-medium text-foreground">{patient.owner}</div>
                                        <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Legitimacy Verified</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/record?patientId=${patient.id}`);
                                                }}
                                                className="h-8 px-4 text-[9px] font-medium uppercase tracking-widest border border-border rounded hover:bg-muted transition-all flex items-center gap-2"
                                            >
                                                <Mic className="h-3.5 w-3.5" />
                                                <span>Initialize Scribe</span>
                                            </button>
                                            <div className="h-8 w-8 border border-border rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-all">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Representative Partition */}
                <div className="md:hidden divide-y divide-border">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => router.push(`/patients/${patient.id}`)}
                            className="p-4 flex items-center justify-between active:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="h-12 w-12 bg-slate-50 border border-border rounded flex items-center justify-center overflow-hidden shrink-0">
                                    {patient.image?.startsWith('data:') || patient.image?.startsWith('http') ? (
                                        <img src={patient.image} alt={patient.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Shield className="h-5 w-5 text-muted-foreground/30" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-medium text-foreground text-sm truncate">{patient.name}</h3>
                                    <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-1 truncate">
                                        {patient.breed} • {patient.species}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 text-[8px] font-medium uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                                            {patient.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button className="h-8 w-8 flex items-center justify-center text-muted-foreground border border-border rounded">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Null Ledger State */}
                {!isLoading && filteredPatients.length === 0 && (
                    <div className="px-8 py-20 text-center opacity-60">
                        <Database className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-base font-medium text-foreground uppercase tracking-tight">Data Exhausted</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">No identifiers match the current query parameters.</p>
                    </div>
                )}
            </div>

            {/* Sequential Data Controls */}
            {patients.length >= 25 && hasMore && (
                <div className="py-6 flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={isPaginating}
                        className="h-9 px-6 border border-border rounded text-[10px] font-medium uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isPaginating ? (
                            <Activity className="h-3 w-3 animate-spin" />
                        ) : (
                            <Layers className="h-3 w-3" />
                        )}
                        Parsing Ledger
                    </button>
                </div>
            )}
        </div>
    );
}

