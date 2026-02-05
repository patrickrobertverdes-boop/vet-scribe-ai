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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-500">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-2xl transition-opacity" onClick={onClose} />

                    <div className="w-full max-w-2xl overflow-hidden flex flex-col relative z-10 rounded-[1.5rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 max-h-[90vh] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        {/* Header */}
                        <div className="px-5 sm:px-10 py-5 sm:py-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20 bg-white dark:bg-slate-950">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                    <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-none mb-1.5 sm:mb-0 uppercase truncate">Add New Patient</h2>
                                </div>
                            </div>
                            <button onClick={onClose} className="h-10 w-10 border border-border flex items-center justify-center rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground active:scale-95 shrink-0 ml-2 bg-background">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-10 space-y-6 sm:space-y-10 bg-background">
                            {/* Visual Identity & Manual Entry */}
                            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start p-5 sm:p-8 border border-border rounded-2xl bg-muted/50">
                                <div className="shrink-0 flex flex-col items-center gap-3">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Entity Identity</label>
                                    <ImageUpload
                                        value={image}
                                        onChange={setImage}
                                        className="h-28 w-28 sm:h-32 sm:w-32"
                                    />
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full mt-4 md:mt-0">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Patient Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Luna"
                                            className="w-full h-12 px-5 rounded-xl text-sm font-bold border border-border outline-none focus:ring-2 focus:ring-foreground transition-all shadow-sm text-foreground placeholder:text-muted-foreground bg-background"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Species</label>
                                        <select
                                            value={species}
                                            onChange={(e) => setSpecies(e.target.value)}
                                            className="w-full h-12 px-5 rounded-xl text-sm font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm appearance-none text-slate-900 dark:text-white bg-white dark:bg-slate-950"
                                        >
                                            <option value="Canine">Canine</option>
                                            <option value="Feline">Feline</option>
                                            <option value="Equine">Equine</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Owner Name</label>
                                        <input
                                            type="text"
                                            value={owner}
                                            onChange={(e) => setOwner(e.target.value)}
                                            placeholder="Sarah Johnson"
                                            className="w-full h-12 px-5 rounded-xl text-sm font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-white dark:bg-slate-950"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Breed (Optional)</label>
                                        <input
                                            type="text"
                                            value={breed}
                                            onChange={(e) => setBreed(e.target.value)}
                                            placeholder="Golden Retriever"
                                            className="w-full h-12 px-5 rounded-xl text-sm font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-white dark:bg-slate-950"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Patient Description */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Sparkles className="h-3 w-3 text-black dark:text-white" /> AI Extraction (Optional)
                                    </label>
                                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">Extracts Details</span>
                                </div>
                                <div className="relative group">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Paste clinical notes or type a description to auto-fill fields..."
                                        className="w-full border border-slate-300 dark:border-slate-700 p-8 rounded-xl text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[120px] focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all shadow-sm resize-none leading-relaxed tracking-tight bg-white dark:bg-slate-950"
                                    />
                                    <div className="absolute bottom-6 right-6 flex items-center gap-2">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="h-10 px-6 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-lg hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-3 group"
                                        >
                                            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />}
                                            {isGenerating ? 'Analyzing...' : 'Auto-fill'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-4 text-rose-700 animate-in slide-in-from-top-2">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="p-6 bg-muted border border-border rounded-2xl flex items-start gap-4">
                                <div className="h-8 w-8 bg-background rounded-lg flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                                    <Info className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-foreground uppercase tracking-wide leading-none">Pro Tip</p>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">You can save immediately with just a Name. Our AI will analyze your notes in the background and update the record automatically.</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-5 sm:px-10 py-6 sm:py-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
                            <button
                                onClick={onClose}
                                className="h-12 px-8 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-black dark:hover:text-white transition-all rounded-xl w-full sm:w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isSaving || !name.trim()}
                                onClick={handleSave}
                                className="h-14 px-8 sm:px-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:translate-y-[-2px] hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-3 w-full sm:w-auto"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                <span className="hidden sm:inline">{isSaving ? 'Registering...' : 'Add Patient Instantly'}</span>
                                <span className="sm:hidden">{isSaving ? 'Saving...' : 'Add Patient'}</span>
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

