'use client';

import { Info, AlertTriangle, Pill, User, ChevronRight, Activity, ShieldCheck, Database, Binary } from 'lucide-react';
import { Patient } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PatientContextProps {
    patient?: Patient | null;
}

export function PatientContext({ patient }: PatientContextProps) {
    if (!patient) return (
        <div className="p-10 text-center glass rounded-[1.5rem] border-none shadow-xl bg-slate-50/30 flex flex-col items-center gap-6 animate-in fade-in duration-700 m-8">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                <Database className="h-8 w-8" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-3">Neural Directory Standby</p>
                <p className="text-sm font-bold text-slate-600 tracking-tight">No therapeutic subject selected for the current session.</p>
            </div>
            <Link href="/patients">
                <button className="h-11 px-8 glass border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm">
                    Access Repository
                </button>
            </Link>
        </div>
    );

    return (
        <div className="p-10 space-y-10 animate-in slide-in-from-left-8 duration-700">
            {/* Subject Identity Matrix */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-slate-100 relative group overflow-hidden">
                        {patient.image?.startsWith('data:') || patient.image?.startsWith('http') ? (
                            <img src={patient.image} alt={patient.name} className="h-full w-full object-cover" />
                        ) : (
                            <Binary className="h-10 w-10 text-slate-200 group-hover:text-primary transition-colors" />
                        )}
                        <div className="absolute -bottom-2 -right-2 h-7 w-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg border-4 border-white scale-0 group-hover:scale-100 transition-transform duration-300">
                            <Activity className="h-4 w-4 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none uppercase">{patient.name}</h2>
                            <div className="px-2.5 py-1 bg-slate-900 text-white text-[8px] font-bold uppercase tracking-[0.2em] rounded">UID-{patient.id}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] bg-primary/5 px-2.5 py-1 rounded border border-primary/10">
                                {patient.species} • {patient.breed}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                                {patient.age}Y {patient.age_months}M <span className="text-slate-200 mx-1">|</span> {patient.weight} LBS
                            </span>
                        </div>
                    </div>
                </div>

                <Link href={`/patients/${patient.id}`}>
                    <button className="h-12 w-12 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white hover:shadow-xl transition-all active:scale-95 group">
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </Link>
            </div>

            {/* Tactical Parameter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 glass rounded-xl flex items-center gap-5 bg-white/40 border border-white hover:bg-white transition-all shadow-md">
                    <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Authorized Steward</p>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">{patient.owner}</p>
                    </div>
                </div>
                <div className="p-5 glass rounded-xl flex items-center gap-5 bg-emerald-50/30 border border-emerald-100 hover:bg-emerald-50 transition-all shadow-md">
                    <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-[0.2em] leading-none mb-1.5">Bio-Marker Sync</p>
                        <p className="text-sm font-bold text-emerald-700 tracking-tight uppercase">Nominal</p>
                    </div>
                </div>
            </div>

            {/* Critical Alert Ledger */}
            {(patient.allergies?.length || patient.medications?.length) ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">Critical Biosignal Alert Matrix</span>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {patient.allergies?.map((a) => (
                            <div key={a} className="flex items-center gap-3 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:translate-y-[-1px] transition-all ring-2 ring-rose-500/20">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> <span className="text-rose-400">Allergy:</span> {a}
                            </div>
                        ))}
                        {patient.medications?.map((m) => (
                            <div key={m} className="flex items-center gap-3 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:translate-y-[-1px] transition-all ring-2 ring-blue-500/20">
                                <Pill className="h-3.5 w-3.5 text-blue-400" /> <span className="text-blue-400">Active Regimen:</span> {m}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-5 glass rounded-xl bg-slate-50/40 border border-slate-100 flex items-center gap-4">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">No Anomaly Detected: Clinical Alerts Clear</span>
                </div>
            )}
        </div>
    );
}
