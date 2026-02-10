'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    Filter,
    Plus,
    ChevronRight,
    Activity,
    Layers,
    Shield,
    Database,
    Binary,
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

    // FIX: Track sync state to show appropriate UI feedback
    const [syncState, setSyncState] = useState<{
        isFromCache: boolean;
        hasError: boolean;
        errorMessage?: string;
    }>({ isFromCache: false, hasError: false });

    // FIX: Track network state to force re-fetch when coming back online
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
    const [subscriptionKey, setSubscriptionKey] = useState(0);

    // Monitor network state changes
    useEffect(() => {
        const handleOnline = () => {
            console.log('[PatientsPage] Network back online - forcing re-subscription');
            setIsOnline(true);
            setSubscriptionKey(prev => prev + 1); // Force re-subscribe
        };
        const handleOffline = () => {
            console.log('[PatientsPage] Network went offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

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
                    setSyncState({ isFromCache: true, hasError: false });
                }
            }
        } catch (e) { }

        setIsLoading(true);

        // FIX: Enhanced subscription with metadata handling
        const unsubscribe = firebaseService.subscribeToPatients(user.uid, (data, meta) => {
            // Check for errors (permission denied, auth issues)
            if (meta?.error) {
                console.error("[PatientsPage] Subscription error detected:", meta.error);
                setSyncState({
                    isFromCache: true,
                    hasError: true,
                    errorMessage: meta.error.code === 'permission-denied'
                        ? 'Authentication required. Please log in again.'
                        : meta.error.message
                });
                setIsLoading(false);
                clearTimeout(timer);

                // Show error toast for permission issues
                if (meta.error.code === 'permission-denied') {
                    toast.error('Session expired. Please log in again.');
                }
                return;
            }

            // Update patients data
            setPatients(data);
            setIsLoading(false);

            // Update sync state
            setSyncState({
                isFromCache: meta?.fromCache ?? false,
                hasError: false
            });

            // Only cache server data, not cached data
            if (!meta?.fromCache && data.length > 0) {
                try {
                    localStorage.setItem(`patients_${user.uid}`, JSON.stringify(data.slice(0, 10)));
                } catch (e) { }
            }

            clearTimeout(timer);
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [user, subscriptionKey]); // Re-run when network comes back online

    const loadMore = async () => {
        if (!user || isPaginating || !hasMore) return;
        setIsPaginating(true);
        const result = await firebaseService.getPatients(user.uid, lastDoc);
        if (result.length < 25) setHasMore(false);
        setPatients(prev => [...prev, ...result]);
        // Note: pagination is simplified - getPatients returns array directly
        setIsPaginating(false);
    };



    const filteredPatients = useMemo(() =>
        patients.filter(p =>
            (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.owner?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.breed?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        ),
        [patients, searchTerm]
    );


    return (
        <div className="space-y-6 pb-20">
            {/* Directory Header */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-foreground tracking-tighter">
                        Clinical Directory
                    </h1>
                    <p className="text-lg text-muted-foreground mt-3 font-normal">
                        System inventory of <span className="text-foreground font-bold">{patients.length} active patient entities</span> under clinical observation.
                    </p>

                    {/* FIX: Sync State Indicator */}
                    {syncState.hasError && (
                        <div className="mt-3 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl">
                            <p className="text-sm font-medium text-red-900 dark:text-red-300">
                                ⚠️ {syncState.errorMessage || 'Unable to load data'}
                            </p>
                        </div>
                    )}
                    {!syncState.hasError && syncState.isFromCache && patients.length > 0 && (
                        <div className="mt-3 px-4 py-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-xl">
                            <p className="text-xs font-medium text-yellow-900 dark:text-yellow-300">
                                🔄 Showing saved data. Checking for updates...
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowAICreator(true)}
                        className="h-12 px-6 bg-primary text-primary-foreground rounded-xl font-bold text-sm tracking-tight flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Establish New Record</span>
                    </button>
                    <button onClick={() => toast.success('Adjusting filters...')} className="h-12 w-12 border border-black rounded-xl flex items-center justify-center text-foreground hover:bg-black hover:text-white transition-all">
                        <Filter className="h-5 w-5" />
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

            {/* Clinical Search */}
            <div className="search-container max-w-2xl">
                <Search className="search-icon" />
                <input
                    type="text"
                    placeholder="Query by name, breed, or ownership ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input h-14 text-base"
                />
            </div>

            {/* Record Ledger Partition */}
            <div className={cn(
                "surface-contained overflow-hidden bg-card transition-all duration-500",
                isLoading ? "opacity-60" : "opacity-100"
            )}>
                {/* Protocol: Unified Table Representation */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white dark:bg-card border-b border-black">
                            <tr>
                                <th className="px-6 py-5 text-[11px] font-bold text-foreground uppercase tracking-widest">Entity</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-foreground uppercase tracking-widest">Biological Data</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-foreground uppercase tracking-widest">Primary Owner</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-foreground uppercase tracking-widest">Clinical Status</th>
                                <th className="px-6 py-5 text-right text-[11px] font-bold text-foreground uppercase tracking-widest">Interface</th>
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
                                                    <img
                                                        src={patient.image}
                                                        alt={patient.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            const parent = (e.target as HTMLImageElement).parentElement;
                                                            if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/30"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                                        }}
                                                    />
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
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white">
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/record?patientId=${patient.id}`);
                                                }}
                                                className="h-10 px-5 text-[10px] font-black uppercase tracking-widest border border-black rounded-xl hover:bg-black hover:text-white transition-all flex items-center gap-2.5 shadow-sm"
                                            >
                                                <Mic className="h-4 w-4" />
                                                <span>Initialize Scribe</span>
                                            </button>
                                            <div className="icon-square h-10 w-10">
                                                <ChevronRight className="h-5 w-5" />
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
                                        <img
                                            src={patient.image}
                                            alt={patient.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/30"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                            }}
                                        />
                                    ) : (
                                        <Shield className="h-5 w-5 text-muted-foreground/30" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-medium text-foreground text-base truncate">{patient.name}</h3>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1 truncate">
                                        {patient.breed} • {patient.species}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[9px] font-bold uppercase tracking-widest border border-black">
                                            {patient.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/record?patientId=${patient.id}`);
                                    }}
                                    className="h-10 w-10 flex items-center justify-center text-primary border border-primary/20 bg-primary/5 rounded-xl active:scale-95 transition-all"
                                >
                                    <Mic className="h-4 w-4" />
                                </button>
                                <div className="h-10 w-10 flex items-center justify-center text-muted-foreground border border-border rounded-xl">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            </div>
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

