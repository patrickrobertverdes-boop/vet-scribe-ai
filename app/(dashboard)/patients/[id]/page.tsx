'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronRight,
    Calendar,
    User,
    Scale,
    Pill,
    AlertTriangle,
    FileText,
    ArrowLeft,
    Loader2,
    PlusCircle,
    Edit3,
    Activity,
    History,
    MoreHorizontal,
    Phone,
    Mail,
    Heart,
    ShieldCheck,
    Wand2,
    Mic,
    ClipboardCheck,
    Layers,
    Waves,
    Camera,
    Binary,
    Database,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { PatientDocuments } from '@/components/patient/patient-documents';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';
import { Patient, Consultation } from '@/lib/types';
import { EditPatientModal } from '@/components/patient/edit-patient-modal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PatientProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);

    useEffect(() => {
        // Wait for connection
        if (authLoading) return;

        if (!user || !params.id) {
            setIsLoading(false);
            return;
        }

        // FAIL-FAST
        const timer = setTimeout(() => {
            if (isLoading && !patient) setIsLoading(false);
        }, 8000);

        // CACHING
        try {
            const cachedP = localStorage.getItem(`patient_${params.id}`);
            if (cachedP && !patient) {
                setPatient(JSON.parse(cachedP));
                setIsLoading(false);
            }
        } catch (e) { }

        setIsLoading(true);

        // 1. Subscribe to Patient document
        const unsubscribePatient = firebaseService.subscribeToPatient(user.uid, params.id as string, (pData) => {
            if (pData) {
                setPatient(pData);
                try {
                    localStorage.setItem(`patient_${params.id}`, JSON.stringify(pData));
                } catch (e) { }
            }
            setIsLoading(false);
            clearTimeout(timer);
        });

        // 2. Subscribe to Consultations Summary
        const unsubscribeConsultations = firebaseService.subscribeToConsultations(user.uid, (cData) => {
            setConsultations(cData);
        }, params.id as string);

        return () => {
            unsubscribePatient();
            unsubscribeConsultations();
            clearTimeout(timer);
        };
    }, [user, params.id, authLoading]);

    const loadMoreConsultations = async () => {
        if (!user || isPaginating || !hasMore || !params.id) return;
        setIsPaginating(true);
        const result = await firebaseService.getConsultations(user.uid, params.id as string, lastDoc);
        if (result.consultations.length < 25) setHasMore(false);
        setConsultations(prev => [...prev, ...result.consultations]);
        setLastDoc(result.lastDoc);
        setIsPaginating(false);
    };

    // Skeleton state
    const renderSkeleton = () => (
        <div className="max-w-7xl mx-auto space-y-12 animate-pulse pb-32">
            <div className="flex flex-col gap-8">
                <div className="h-12 w-48 bg-slate-100 rounded-xl" />
                <div className="flex gap-4">
                    <div className="h-12 w-32 bg-slate-100 rounded-xl" />
                    <div className="h-12 w-64 bg-slate-100 rounded-xl" />
                </div>
            </div>
            <div className="h-64 sm:h-80 bg-slate-50 border border-slate-100 rounded-3xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 h-96 bg-slate-50 rounded-3xl" />
                <div className="lg:col-span-8 h-96 bg-slate-50 rounded-3xl" />
            </div>
        </div>
    );

    if (isLoading && !patient) {
        return renderSkeleton();
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center h-[60dvh] surface p-10 text-center">
                <div className="h-16 w-16 bg-slate-50 border border-border rounded flex items-center justify-center mb-6">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <h2 className="text-xl font-serif font-medium text-foreground mb-3">Patient Record Deficit</h2>
                <p className="max-w-xs text-muted-foreground mb-8">
                    The requested identifier <span className="font-mono text-foreground">{params.id}</span> does not exist within the primary data registry.
                </p>
                <Link href="/patients" className="btn-premium bg-primary text-primary-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Return to Directory
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Clinical Record Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/patients')}
                        className="h-9 w-9 border border-border rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                            <button onClick={() => router.push('/patients')} className="hover:text-primary transition-colors">Patients</button>
                            <span>/</span>
                            <span className="text-foreground">{patient.name}</span>
                        </div>
                        <h1 className="text-2xl font-serif font-medium text-foreground">Clinical Profile</h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-transparent dark:border dark:border-emerald-500/20 border border-border text-[10px] font-medium text-muted-foreground uppercase tracking-widest rounded">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 opacity-70" /> Integrity Verified
                    </div>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="h-9 px-4 border border-border rounded text-muted-foreground font-medium text-xs hover:bg-muted transition-all flex items-center gap-2"
                    >
                        <Edit3 className="h-3.5 w-3.5" /> Modify Parameters
                    </button>
                    <button
                        onClick={() => {
                            toast.success(`Initializing AI Scribe for ${patient.name}`);
                            router.push(`/record?patientId=${patient.id}`);
                        }}
                        className="btn-premium bg-primary text-primary-foreground ml-auto"
                    >
                        <Mic className="h-4 w-4 mr-2" /> Initialize AI Scribe
                    </button>
                </div>
            </div>

            {/* Structural Profile */}
            <div className="surface p-6 sm:p-10 flex flex-col lg:flex-row gap-8 items-center lg:items-center relative bg-card">
                <div className="relative group shrink-0">
                    <div
                        className="h-32 w-32 sm:h-40 sm:w-40 bg-slate-50 border border-border rounded flex items-center justify-center relative overflow-hidden cursor-pointer"
                        onClick={() => setShowEditModal(true)}
                    >
                        {patient.image?.startsWith('data:') || patient.image?.startsWith('http') ? (
                            <img src={patient.image} alt={patient.name} className="h-full w-full object-cover" />
                        ) : (
                            <Binary className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30" />
                        )}
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-card border border-border px-2.5 py-1 rounded text-[9px] font-medium text-emerald-700 flex items-center gap-1.5 shadow-sm uppercase tracking-widest">
                        <Activity className="h-3 w-3 text-emerald-500" /> Operational
                    </div>
                </div>

                <div className="flex-1 space-y-6 text-center lg:text-left w-full">
                    <div>
                        <div className="flex flex-col sm:flex-row items-baseline gap-3 mb-4">
                            <h1 className="text-3xl font-serif font-medium text-foreground tracking-tight leading-none">{patient.name}</h1>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest border border-border px-2 py-0.5 rounded">ID: {patient.id.slice(0, 8)}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 justify-center lg:justify-start">
                            {[
                                { label: 'Breed', value: patient.breed, icon: Heart, color: 'text-rose-600' },
                                { label: 'Species', value: patient.species, icon: Activity, color: 'text-indigo-600' },
                                { label: 'Age', value: `${patient.age}Y ${patient.age_months}M`, icon: Calendar, color: 'text-amber-600' },
                                { label: 'Weight', value: `${patient.weight} lbs`, icon: Scale, color: 'text-slate-600' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border px-4 py-2.5 rounded shadow-none min-w-[120px]">
                                    <item.icon className={cn("h-3.5 w-3.5 shrink-0 opacity-70", item.color)} />
                                    <div className="min-w-0 text-left">
                                        <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                        <p className="text-xs font-medium text-foreground tracking-tight truncate">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {patient.allergies?.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border px-3 py-1.5 rounded text-[10px] font-medium uppercase tracking-wider text-foreground">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 opacity-70" /> <span className="opacity-60">Allergy:</span> {a}
                            </div>
                        ))}
                        {patient.medications?.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border px-3 py-1.5 rounded text-[10px] font-medium uppercase tracking-wider text-foreground">
                                <Pill className="h-3.5 w-3.5 text-blue-600 opacity-70" /> <span className="opacity-60">Medication:</span> {m}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-end gap-6 self-stretch justify-center pr-4">
                    <div className="text-right">
                        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-2">Clinical Score</p>
                        <p className="text-4xl font-serif font-medium text-primary">94.2</p>
                    </div>
                    <div className="h-px w-12 bg-border" />
                    <div className="text-right">
                        <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest flex items-center gap-2 justify-end">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Stable Status
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Client and Insights Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="surface p-8 space-y-8 bg-card">
                        <div>
                            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" /> Client Entity
                            </h3>
                            <div className="p-6 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-primary text-primary-foreground rounded flex items-center justify-center shadow-sm">
                                        <User className="h-6 w-6 no-demote" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Primary Owner</p>
                                        <p className="text-lg font-serif font-medium text-foreground">{patient.owner}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-6 border-t border-border">
                                    <div onClick={() => toast.success(`Calling ${patient.owner}...`)} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all cursor-pointer group/item">
                                        <div className="h-8 w-8 border border-border rounded flex items-center justify-center group-hover/item:bg-muted transition-all">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <span className="text-[11px] font-medium uppercase tracking-widest">(555) 123-4567</span>
                                    </div>
                                    <div onClick={() => router.push('/team')} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all cursor-pointer group/item">
                                        <div className="h-8 w-8 border border-border rounded flex items-center justify-center group-hover/item:bg-muted transition-all">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <span className="text-[11px] font-medium uppercase tracking-widest truncate">Message Owner</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group cursor-pointer" onClick={() => router.push('/analytics')}>
                            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Wand2 className="h-3.5 w-3.5" /> Clinical Analysis
                            </h3>
                            <div className="p-6 bg-slate-900 text-white rounded border border-white/5 hover:bg-slate-800 transition-colors shadow-sm">
                                <p className="text-[13px] leading-relaxed font-normal italic tracking-tight opacity-90">
                                    "{patient.historySummary || 'AI is structuralizing medical history for clinical summarization.'}"
                                </p>
                                <div className="mt-6 flex items-center gap-3">
                                    <div className="h-0.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-primary" />
                                    </div>
                                    <span className="text-[8px] font-medium text-white uppercase tracking-widest opacity-60">Live Status</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded text-center">
                                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Last Visit</p>
                                <p className="text-[10px] font-medium text-foreground uppercase tracking-widest">{patient.lastVisit}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded text-center">
                                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Records</p>
                                <p className="text-[10px] font-medium text-foreground uppercase tracking-widest">{consultations.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical Record Timeline */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="surface overflow-hidden flex flex-col h-full bg-card">
                        {/* Timeline Header */}
                        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-100 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded flex items-center justify-center">
                                    <History className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-serif font-medium text-foreground leading-none mb-1.5">Medical History</h2>
                                    <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        Data Log <span className="h-1 w-1 bg-border rounded-full" /> {consultations.length} Consultations
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/record?patientId=${patient.id}`)}
                                className="h-9 px-4 border border-border rounded text-[10px] font-medium uppercase tracking-widest text-foreground hover:bg-muted transition-all flex items-center gap-2"
                            >
                                <PlusCircle className="h-3.5 w-3.5" /> Log Encounter
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {consultations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 px-12 text-center opacity-60">
                                    <Database className="h-12 w-12 text-muted-foreground/30 mb-6" />
                                    <h3 className="text-lg font-medium text-foreground uppercase tracking-tight mb-2">Null Data State</h3>
                                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest">
                                        No clinical history records found in this partition.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {consultations.map((c) => (
                                        <div
                                            key={c.id}
                                            className="p-8 hover:bg-slate-50 dark:hover:bg-card/50 transition-all group relative cursor-pointer"
                                            onClick={() => router.push(`/consultations/${c.id}`)}
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                                <div className="space-y-4 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                                            {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[9px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/50 uppercase tracking-widest">
                                                            Finalized
                                                        </div>
                                                    </div>
                                                    <h3 className="text-xl font-serif font-medium text-foreground group-hover:text-primary transition-colors leading-none">Clinical Encounter</h3>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                        <div className="p-4 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded">
                                                            <div className="flex items-center gap-2 mb-2 opacity-50">
                                                                <Zap className="h-3 w-3" />
                                                                <p className="text-[8px] font-medium uppercase tracking-widest">Preview</p>
                                                            </div>
                                                            <p className="text-[13px] font-normal text-muted-foreground leading-relaxed italic line-clamp-2">
                                                                "{c.soapPreview || 'Clinical observations documented.'}"
                                                            </p>
                                                        </div>
                                                        <div className="p-4 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded">
                                                            <div className="flex items-center gap-2 mb-2 opacity-50">
                                                                <Binary className="h-3 w-3" />
                                                                <p className="text-[8px] font-medium uppercase tracking-widest">Status</p>
                                                            </div>
                                                            <p className="text-[11px] font-medium text-foreground uppercase tracking-wider">
                                                                {c.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-12 w-12 border border-border rounded flex items-center justify-center text-muted-foreground/40 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                            </div>

                                            <div className="mt-8 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-slate-100 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded flex items-center justify-center text-muted-foreground font-medium text-[10px]">
                                                        DOC
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">Attending</p>
                                                        <p className="text-[11px] font-medium text-foreground uppercase tracking-tight">Verified Clinician</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/consultations/${c.id}`)}
                                                    className="h-8 px-4 border border-border rounded text-[9px] font-medium uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center gap-2 group/btn"
                                                >
                                                    Full Log <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {consultations.length >= 25 && hasMore && (
                            <div className="p-8 flex justify-center border-t border-border">
                                <button
                                    onClick={loadMoreConsultations}
                                    disabled={isPaginating}
                                    className="h-9 px-6 border border-border rounded text-[10px] font-medium uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all flex items-center gap-2"
                                >
                                    {isPaginating ? (
                                        <Activity className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Layers className="h-3 w-3" />
                                    )}
                                    Load Sequential Data
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Gallery Partition */}
            <div className="surface p-8 sm:p-12 bg-card">
                <div className="flex items-center gap-4 mb-10">
                    <div className="h-10 w-10 bg-primary text-primary-foreground rounded flex items-center justify-center shadow-sm">
                        <Layers className="h-5 w-5 no-demote" />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif font-medium text-foreground leading-none mb-1">External Records</h2>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Imaging & Partitioned Documentation</p>
                    </div>
                </div>
                <PatientDocuments />
            </div>

            {showEditModal && patient && (
                <EditPatientModal
                    patient={patient}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={() => { }}
                />
            )}
        </div>
    );
}
