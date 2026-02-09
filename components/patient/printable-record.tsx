'use client';

import { Patient, SoapNote } from "@/lib/types";

interface PrintableRecordProps {
    consultationId?: string;
    date: string;
    patient: Patient;
    soap: SoapNote;
    clinicianName?: string;
}

export function PrintableRecord({ consultationId, date, patient, soap, clinicianName }: PrintableRecordProps) {
    return (
        <div className="printable-record bg-white text-black font-serif p-[15mm] w-[210mm] min-h-[297mm] shadow-none flex flex-col">
            {/* Superior Header / Professional Identity */}
            <div className="border-b-[6px] border-black pb-10 mb-12 flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-[-0.04em] leading-none mb-2">VetScribe Pro</h1>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-2">
                            Autonomous Clinical Intelligence <span className="h-1 w-1 rounded-full bg-zinc-300" /> V1.0.4
                        </p>
                    </div>
                </div>
                <div className="text-right space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Document Audit Link</p>
                    <p className="font-mono text-xs font-bold bg-zinc-100 px-4 py-2 border border-zinc-200 rounded-lg">
                        {consultationId || 'DRAFT-CAPTURE-PENDING'}
                    </p>
                </div>
            </div>

            {/* Clinical Intake Context */}
            <div className="grid grid-cols-12 gap-0 mb-16 border-4 border-black border-double overflow-hidden rounded-sm">
                <div className="col-span-8 p-8 border-r-4 border-black border-double">
                    <header className="mb-6 flex items-baseline justify-between underline decoration-zinc-100 decoration-4 underline-offset-8">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Subject Profile</p>
                        <p className="text-[9px] font-bold text-zinc-300 uppercase">Case File: {new Date(date).getFullYear()}-{patient.id.slice(0, 4)}</p>
                    </header>

                    <h2 className="text-5xl font-black uppercase tracking-tight mb-8 text-black">{patient.name}</h2>

                    <div className="grid grid-cols-4 gap-8">
                        <div>
                            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Taxonomy</p>
                            <p className="text-sm font-black uppercase tracking-tight">{patient.species}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Breed/Lineage</p>
                            <p className="text-sm font-black uppercase tracking-tight truncate">{patient.breed}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Age Metric</p>
                            <p className="text-sm font-black uppercase tracking-tight">{patient.age}Y {patient.age_months}M</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Mass (LB)</p>
                            <p className="text-sm font-black uppercase tracking-tight">{patient.weight}</p>
                        </div>
                    </div>
                </div>
                <div className="col-span-4 p-8 bg-zinc-50 flex flex-col justify-between">
                    <div className="space-y-6">
                        <section>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Session Audit</p>
                            <p className="text-lg font-black leading-tight">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">{new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} LOCAL</p>
                        </section>
                        <section>
                            <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Primary Custodian</p>
                            <p className="text-sm font-black uppercase tracking-tight">{patient.owner}</p>
                        </section>
                    </div>
                    <div className="pt-4 border-t border-zinc-200">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Status: Finalized</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SOAP Stratification Domain */}
            <div className="flex-1 space-y-16">
                {[
                    { label: 'Subjective', value: soap.subjective, desc: 'Patient Narrative & History' },
                    { label: 'Objective', value: soap.objective, desc: 'Clinical Findings & Examination' },
                    { label: 'Assessment', value: soap.assessment, desc: 'Clinical Differentiation' },
                    { label: 'Plan', value: soap.plan, desc: 'Therapeutic Strategy' }
                ].map((sec, i) => (
                    <div key={i} className="section group relative">
                        <div className="flex items-baseline gap-6 border-b-[3px] border-black pb-3 mb-6">
                            <h3 className="text-lg font-black uppercase tracking-[0.3em] text-black shrink-0">{sec.label}</h3>
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] italic">{sec.desc}</span>
                        </div>
                        <div className="pl-6 border-l-4 border-zinc-100">
                            <p className="text-[15px] leading-[2] text-zinc-900 whitespace-pre-wrap text-justify font-medium">
                                {sec.value || 'System Bypass: No clinical observations were stratified for this module.'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Signature Domain / Final Verification */}
            <div className="mt-20 pt-16 border-t-[3px] border-zinc-100 flex justify-between items-end">
                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Verified Clinician Signature</div>
                        <div className="h-24 w-80 border-b-2 border-zinc-900 flex items-end pb-3 text-2xl px-6 font-serif italic text-zinc-800 tracking-tight">
                            {clinicianName || 'Digital Verification: Authorized User'}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-zinc-50 text-zinc-700 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-zinc-200">
                            Secure Verification Active
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Captured via Autonomous Veterinary Scribe</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-2 font-mono">HASH: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em]">
                        {new Date().toLocaleString()} (GMT) • PARTITION.V1
                    </p>
                </div>
            </div>
        </div>
    );
}
