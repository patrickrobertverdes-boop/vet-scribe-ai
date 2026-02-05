'use client';

import { SoapNote } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    MessageSquareText,
    Microscope,
    Stethoscope,
    ClipboardList,
    Sparkles,
    CheckCircle2,
    Binary,
    ShieldCheck,
    Database,
    Zap
} from "lucide-react";

interface SoapEditorProps {
    soap: SoapNote;
    onChange: (soap: SoapNote) => void;
    readOnly?: boolean;
}

export function SoapEditor({ soap, onChange, readOnly = false }: SoapEditorProps) {

    const handleChange = (field: keyof SoapNote, value: string) => {
        onChange({ ...soap, [field]: value });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 p-8">
            <div className="grid gap-8 md:grid-cols-2">
                <Section
                    label="Subjective"
                    description="History & Clinical Narrative"
                    icon={MessageSquareText}
                    value={soap.subjective}
                    onChange={(v) => handleChange('subjective', v)}
                    readOnly={readOnly}
                    accentColor="text-blue-600"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-100"
                    glowColor="shadow-blue-500/10"
                />
                <Section
                    label="Objective"
                    description="Physiological Findings & Diagnostics"
                    icon={Microscope}
                    value={soap.objective}
                    onChange={(v) => handleChange('objective', v)}
                    readOnly={readOnly}
                    accentColor="text-emerald-600"
                    bgColor="bg-emerald-50"
                    borderColor="border-emerald-100"
                    glowColor="shadow-emerald-500/10"
                />
                <Section
                    label="Assessment"
                    description="Clinical Diagnosis & Stratification"
                    icon={Stethoscope}
                    value={soap.assessment}
                    onChange={(v) => handleChange('assessment', v)}
                    readOnly={readOnly}
                    accentColor="text-amber-600"
                    bgColor="bg-amber-50"
                    borderColor="border-amber-100"
                    glowColor="shadow-amber-500/10"
                />
                <Section
                    label="Plan"
                    description="Therapeutic Regimen & Follow-up"
                    icon={ClipboardList}
                    value={soap.plan}
                    onChange={(v) => handleChange('plan', v)}
                    readOnly={readOnly}
                    accentColor="text-purple-600"
                    bgColor="bg-purple-50"
                    borderColor="border-purple-100"
                    glowColor="shadow-purple-500/10"
                />
            </div>
        </div>
    );
}

interface SectionProps {
    label: string;
    description: string;
    icon: any;
    value: string;
    onChange: (v: string) => void;
    readOnly: boolean;
    accentColor: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
}

function Section({ label, description, icon: Icon, value, onChange, readOnly, accentColor, bgColor, borderColor, glowColor }: SectionProps) {
    return (
        <div className={cn(
            "group relative rounded-2xl glass border border-slate-200/50 overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:bg-white bg-white/40",
            glowColor
        )}>
            {/* Clinical ID Bar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner transition-transform group-hover:scale-105", bgColor, accentColor)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase leading-none mb-1">{label}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                        <ShieldCheck className="h-3 w-3" /> Encrypted
                    </span>
                    <div className="h-4 w-px bg-slate-200" />
                    <Sparkles className="h-4 w-4 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Editing Infrastructure */}
            <div className="p-8">
                <textarea
                    className="w-full h-full min-h-[180px] resize-none bg-transparent border-none p-0 text-slate-700 font-bold placeholder:text-slate-300 placeholder:italic focus:ring-0 text-sm lg:text-base leading-[1.8] tracking-tight selection:bg-primary/20"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    readOnly={readOnly}
                    placeholder={`Awaiting neural clinical synthesis for segment: ${label.toUpperCase()}...`}
                />
            </div>

            {/* Forensic Footer */}
            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Binary className="h-3 w-3 text-slate-300" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Segment Alpha-{label.slice(0, 3)}</span>
                </div>
                {!readOnly && (
                    <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Manual Override Active</span>
                    </div>
                )}
            </div>

            {/* Aesthetic Glow Array */}
            <div className={cn("absolute -bottom-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700", bgColor)} />
        </div>
    );
}
