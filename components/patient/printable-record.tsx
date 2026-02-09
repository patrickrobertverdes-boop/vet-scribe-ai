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
        <div className="printable-record bg-white text-black font-serif p-[20mm] w-[210mm] min-h-[297mm] shadow-none">
            {/* Header/Letterhead */}
            <div className="border-b-4 border-black pb-8 mb-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-black rounded-xl flex items-center justify-center">
                        {/* Simple SVG Logo representation for reliability in PDF capture */}
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">VetScribe Pro</h1>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Autonomous Clinical Documentation System</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">System Record ID</p>
                    <p className="font-mono text-xs font-bold bg-zinc-100 px-2 py-1 rounded">{consultationId || 'SESSION-TRANSIT-DRAFT'}</p>
                </div>
            </div>

            {/* Patient Summary Box */}
            <div className="grid grid-cols-12 gap-0 mb-12 border-2 border-black">
                <div className="col-span-8 p-6 border-r-2 border-black">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Subject Information</p>
                    <h2 className="text-4xl font-black uppercase tracking-tight mb-4">{patient.name}</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div>
                            <p className="text-[7px] font-black uppercase text-zinc-400">Species</p>
                            <p className="text-xs font-bold uppercase">{patient.species}</p>
                        </div>
                        <div>
                            <p className="text-[7px] font-black uppercase text-zinc-400">Breed</p>
                            <p className="text-xs font-bold uppercase">{patient.breed}</p>
                        </div>
                        <div>
                            <p className="text-[7px] font-black uppercase text-zinc-400">Age/Est</p>
                            <p className="text-xs font-bold uppercase">{patient.age}Y {patient.age_months}M</p>
                        </div>
                        <div>
                            <p className="text-[7px] font-black uppercase text-zinc-400">Weight</p>
                            <p className="text-xs font-bold uppercase">{patient.weight} LB</p>
                        </div>
                    </div>
                </div>
                <div className="col-span-4 p-6 bg-zinc-50">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Session Audit</p>
                            <p className="text-sm font-bold">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-[10px] font-medium text-zinc-400">{new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} MST</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-zinc-400">Custodian</p>
                            <p className="text-xs font-bold uppercase">{patient.owner}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SOAP CONTENT */}
            <div className="space-y-12">
                {[
                    { label: 'Subjective', value: soap.subjective, desc: 'History & Narrative' },
                    { label: 'Objective', value: soap.objective, desc: 'Clinical Findings' },
                    { label: 'Assessment', value: soap.assessment, desc: 'Clinical Stratification' },
                    { label: 'Plan', value: soap.plan, desc: 'Therapeutic Regimen' }
                ].map((sec, i) => (
                    <div key={i} className="section space-y-4">
                        <div className="flex items-baseline gap-4 border-b-2 border-zinc-900 pb-2 mb-4">
                            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-black shrink-0">{sec.label}</h3>
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{sec.desc}</span>
                        </div>
                        <p className="text-[13px] leading-[1.8] text-zinc-900 whitespace-pre-wrap text-justify font-medium">
                            {sec.value || 'No clinical observations documented for this segment.'}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer / Signature */}
            <div className="mt-32 pt-12 border-t-2 border-zinc-100 flex justify-between items-end">
                <div className="space-y-6">
                    <div className="h-16 w-64 border-b-2 border-zinc-200 italic text-zinc-400 flex items-end pb-2 text-sm px-4">
                        {clinicianName || 'Authorized Clinician'} / Electronic Signature
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Digital Protocol Verification: Secured via VetScribe AI</p>
                </div>
                <div className="text-right text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em]">
                    Doc Generated at {new Date().toLocaleString()} • Partition V1
                </div>
            </div>
        </div>
    );
}
