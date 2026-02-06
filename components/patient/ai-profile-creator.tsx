'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Wand2,
    X,
    Plus,
    Bone,
    User,
    Info,
    AlertTriangle,
    Pill,
    Check,
    Sparkles,
    Loader2,
    ArrowRight,
    Shield,
    Database,
    Zap,
    Binary,
    ShieldCheck,
    History,
    Activity
} from 'lucide-react';
import { generatePatientProfile } from '@/lib/gemini-client';
import { Patient } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/image-upload';
import toast from 'react-hot-toast';

export function AIProfileCreator({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
    const { user } = useAuth();
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Manual/Preview fields
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('Canine');
    const [owner, setOwner] = useState('');
    const [breed, setBreed] = useState('');
    const [image, setImage] = useState('');

    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setError(null);

        try {
            const data = await generatePatientProfile(prompt);
            if (data) {
                if (data.name) setName(data.name);
                if (data.species) setSpecies(data.species);
                if (data.owner) setOwner(data.owner);
                if (data.breed) setBreed(data.breed);
                toast.success('AI suggestons applied!');
            }
        } catch (err) {
            console.error("AI Generation failed:", err);
            toast.error('AI extraction failed, but you can still add manually.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Patient name is required");
            return;
        }

        setIsSaving(true);

        try {
            if (!user) throw new Error("No user found");

            // 1. BLOCKING CREATE: Ensure we have a real Firestore ID before proceeding
            // This satisfies "ensure ALL patient writes go to users/{auth.uid}/patients"
            const newPatient = await firebaseService.createPatientMinimal(user.uid, {
                name,
                species,
                owner,
                prompt
            });

            // 1.5 Update with image if present
            if (image) {
                await firebaseService.updatePatient(user.uid, newPatient.id, { image });
            }

            // 2. BACKGROUND AI: Fire and forget
            if (prompt.trim()) {
                // Don't await this!
                generatePatientProfile(prompt).then(aiData => {
                    if (aiData) {
                        firebaseService.updatePatientWithAIProfile(user.uid, newPatient.id, {
                            ...aiData,
                            historySummary: prompt
                        });
                    }
                }).catch(e => console.warn("Background AI refinement failed:", e));
            }

            // 3. Navigation & Feedback
            // Only show success if stepping past the await above worked
            toast.success(`Registered ${name}!`);

            // We rely on real-time listeners to update the list, so just close/navigate
            onCreated();
            onClose();

        } catch (err) {
            console.error("Save failed:", err);
            setError('Error: Failed to save patient to database.');
            setIsSaving(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return (
        <>
            {typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 h-[100dvh] animate-in fade-in duration-500">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity" onClick={onClose} />

                    <div className="w-full max-w-2xl overflow-hidden flex flex-col relative z-10 rounded-[1.25rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-6 duration-500 max-h-[92dvh] bg-white dark:bg-slate-900 border border-black dark:border-white/20">
                        {/* Header */}
                        <div className="px-5 sm:px-10 py-5 sm:py-8 border-b border-black dark:border-white/10 flex items-center justify-between sticky top-0 z-20 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="h-10 w-10 sm:h-14 sm:w-14 bg-black dark:bg-white text-white dark:text-black rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shrink-0 border border-black dark:border-white/20">
                                    <Sparkles className="h-5 w-5 sm:h-7 sm:w-7" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg sm:text-2xl font-serif font-black text-foreground tracking-tight leading-none uppercase truncate">Registry Entry</h2>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Clinical Protocol Initiation</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="h-10 w-10 border border-black dark:border-white/20 flex items-center justify-center rounded-xl hover:bg-black hover:text-white transition-all text-foreground active:scale-95 shrink-0 ml-2 bg-white dark:bg-slate-900">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-8 sm:space-y-12 bg-white dark:bg-card">
                            {/* Visual Identity & Manual Entry */}
                            <div className="flex flex-col md:flex-row gap-8 sm:gap-10 items-center md:items-start">
                                <div className="shrink-0 flex flex-col items-center gap-4">
                                    <ImageUpload
                                        value={image}
                                        onChange={setImage}
                                        className="h-32 w-32 sm:h-40 sm:w-40"
                                    />
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Subject Image</label>
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 w-full">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1">Patient Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Luna"
                                            className="input-premium h-14"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1">Species</label>
                                        <div className="relative">
                                            <select
                                                value={species}
                                                onChange={(e) => setSpecies(e.target.value)}
                                                className="input-premium h-14 appearance-none pr-10"
                                            >
                                                <option value="Canine">Canine / Dog</option>
                                                <option value="Feline">Feline / Cat</option>
                                                <option value="Equine">Equine / Horse</option>
                                                <option value="Other">Other Species</option>
                                            </select>
                                            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1">Owner Name</label>
                                        <input
                                            type="text"
                                            value={owner}
                                            onChange={(e) => setOwner(e.target.value)}
                                            placeholder="Full Name"
                                            className="input-premium h-14"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1">Breed (Optional)</label>
                                        <input
                                            type="text"
                                            value={breed}
                                            onChange={(e) => setBreed(e.target.value)}
                                            placeholder="Specific Breed"
                                            className="input-premium h-14"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Patient Description */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                                            Clinical Brief & AI Extraction
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Optional background analysis</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-black/5">
                                        <Binary className="h-4 w-4 text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Paste clinical data or type a description..."
                                        className="w-full border border-black/20 dark:border-white/20 p-5 sm:p-8 rounded-xl sm:rounded-2xl text-[13px] font-bold text-foreground placeholder:text-muted-foreground placeholder:opacity-70 min-h-[140px] focus:border-black dark:focus:border-white outline-none transition-all shadow-sm resize-none leading-relaxed tracking-tight bg-slate-50 dark:bg-slate-950/50"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="btn-premium h-11 px-6 min-w-[160px] text-[10px] uppercase font-black"
                                        >
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                            <span>{isGenerating ? 'Analyzing...' : 'Auto-Refine'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-6 bg-rose-50 border border-black rounded-2xl flex items-center gap-4 text-rose-700">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="p-6 sm:p-8 bg-muted border border-black dark:border-border rounded-2xl flex items-start gap-5">
                                <div className="h-10 w-10 bg-white dark:bg-card rounded-xl flex items-center justify-center text-foreground shrink-0 border border-black dark:border-border shadow-sm">
                                    <Info className="h-5 w-5" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-foreground uppercase tracking-widest leading-none">System Protocol</p>
                                    <p className="text-xs text-muted-foreground font-bold leading-relaxed">Identity verification and document indexing will occur in the background. Immediate registration is supported with minimal data.</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-5 sm:px-10 py-6 sm:py-10 border-t border-black dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
                            <button
                                onClick={onClose}
                                className="h-12 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-all rounded-xl w-full sm:w-auto order-2 sm:order-1"
                            >
                                Cancel Operation
                            </button>
                            <button
                                disabled={isSaving || !name.trim()}
                                onClick={handleSave}
                                className="btn-premium h-14 sm:h-16 px-10 sm:px-16 text-[11px] sm:text-xs tracking-[0.2em] w-full sm:w-auto order-1 sm:order-2 shadow-2xl"
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                <span>{isSaving ? 'Establishing...' : 'Confirm Registration'}</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )
            }
        </>
    );
}

