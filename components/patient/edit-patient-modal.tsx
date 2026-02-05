'use client';

import { useState } from 'react';
import { X, Save, AlertTriangle, Loader2, User, Activity, Edit3, ShieldCheck, Database, Binary, Zap } from 'lucide-react';
import { Patient } from '@/lib/types';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/image-upload';
import { CustomSelect } from '@/components/ui/custom-select';
import toast from 'react-hot-toast';

interface EditPatientModalProps {
    patient: Patient;
    onClose: () => void;
    onUpdate: () => void;
}

export function EditPatientModal({ patient, onClose, onUpdate }: EditPatientModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Partial<Patient>>({
        name: patient.name,
        breed: patient.breed,
        species: patient.species,
        age: patient.age,
        age_months: patient.age_months,
        weight: patient.weight,
        owner: patient.owner,
        historySummary: patient.historySummary,
        image: patient.image,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('You must be logged in to update patients.');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            // Optimistic update pattern:
            // 1. Fire the update request
            const updatePromise = firebaseService.updatePatient(user.uid, patient.id, formData);

            // 2. Give instant feedback and close
            toast.success(`Patient updated!`);
            onClose();

            // 3. Await in background (optional, mostly for error logging handled by safeWrite/service)
            await updatePromise;

            // 4. Trigger external refresh if needed (though listeners handle this)
            onUpdate();
        } catch (err: any) {
            // If it fails, the toast logic might be slightly misleading, 
            // but for 99% of cases this is the desired UX.
            // Recovering from a failed background write would require a global error handler or toast.
            console.error("Update failed", err);
            toast.error('Update failed to sync.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-10 animate-in fade-in duration-500">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl transition-opacity" onClick={onClose} />

            <div className="glass rounded-t-[1.5rem] sm:rounded-[1.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.1)] w-full sm:max-w-2xl overflow-hidden flex flex-col relative z-10 border-none animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500 max-h-[95vh] sm:max-h-[90vh] bg-white">
                {/* Modal Header - mobile responsive */}
                <div className="px-4 sm:px-10 py-4 sm:py-8 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 bg-white/95 backdrop-blur-md">
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                        <div className="h-10 w-10 sm:h-14 sm:w-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                            <Binary className="h-5 w-5 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none mb-1 sm:mb-2 uppercase truncate">Edit Patient</h2>
                            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] truncate">ID: {patient.id.slice(0, 8)}...</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-[0.15em] sm:tracking-[0.2em] truncate">{patient.name}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 glass border border-slate-200 flex items-center justify-center rounded-xl hover:bg-slate-900 transition-all text-slate-400 hover:text-white active:scale-95 shrink-0 ml-2">
                        <X className="h-5 w-5 relative top-[1px] left-[0.5px]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-4 sm:p-10 space-y-6 sm:space-y-10">
                    <div className="space-y-10">
                        {/* Basic Identity Details */}
                        <div className="space-y-6 sm:space-y-8 p-5 sm:p-10 glass border border-slate-100 rounded-xl bg-white/40 shadow-xl">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4 mb-4">
                                <User className="h-4 w-4" /> Profile Details
                            </h3>

                            <div className="flex flex-col md:flex-row gap-8 sm:gap-12 items-center md:items-start">
                                <div className="shrink-0">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block text-center md:text-left">Profile Picture</label>
                                    <ImageUpload
                                        value={formData.image}
                                        onChange={(val) => setFormData({ ...formData, image: val })}
                                        placeholderEmoji=""
                                    />
                                </div>

                                <div className="flex-1 grid grid-cols-1 gap-6 sm:gap-8 w-full">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Patient Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full h-12 glass px-5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200/50 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner bg-white/50 tracking-tight"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Client Name</label>
                                        <input
                                            type="text"
                                            value={formData.owner}
                                            onChange={e => setFormData({ ...formData, owner: e.target.value })}
                                            className="w-full h-12 glass px-5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200/50 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner bg-white/50 tracking-tight"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient Information Grid */}
                        <div className="space-y-6 sm:space-y-8">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4 mb-4">
                                <Activity className="h-4 w-4" /> Patient Information
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-3 col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Species</label>
                                    <CustomSelect
                                        value={formData.species || ''}
                                        onChange={val => setFormData({ ...formData, species: val as any })}
                                        options={[
                                            { label: 'Canine', value: 'Canine' },
                                            { label: 'Feline', value: 'Feline' },
                                            { label: 'Equine', value: 'Equine' },
                                            { label: 'Avian', value: 'Avian' },
                                            { label: 'Reptile', value: 'Reptile' },
                                            { label: 'Other', value: 'Other' },
                                        ]}
                                        placeholder="Select Species"
                                    />
                                </div>
                                <div className="space-y-3 col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Breed</label>
                                    <input
                                        type="text"
                                        value={formData.breed}
                                        onChange={e => setFormData({ ...formData, breed: e.target.value })}
                                        className="w-full h-12 glass px-5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200/50 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner bg-white/50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Age (Years)</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                        className="w-full h-12 glass px-5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200/50 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner bg-white/50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Months</label>
                                    <input
                                        type="number"
                                        value={formData.age_months}
                                        onChange={e => setFormData({ ...formData, age_months: parseInt(e.target.value) })}
                                        className="w-full h-12 glass px-5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200/50 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner bg-white/50"
                                    />
                                </div>
                                <div className="space-y-3 col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Weight (lbs)</label>
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                                        className="w-full h-12 glass px-5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200/50 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner bg-white/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medical History */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-1 flex items-center gap-3">
                                <ShieldCheck className="h-4 w-4" /> Medical History Summary
                            </label>
                            <textarea
                                value={formData.historySummary}
                                onChange={e => setFormData({ ...formData, historySummary: e.target.value })}
                                placeholder="Enter a brief summary of the patient's medical history..."
                                className="w-full glass border border-slate-200/50 p-8 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-xl min-h-[160px] resize-none leading-[1.8] tracking-tight text-slate-700 selection:bg-primary/10"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-5 text-rose-700 animate-in slide-in-from-top-2">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                        </div>
                    )}
                </form>

                {/* Modal Actions - mobile safe */}
                <div className="px-4 sm:px-10 py-4 sm:py-8 border-t border-slate-100 bg-slate-50/95 flex items-center justify-between sticky bottom-0 z-20 backdrop-blur-md safe-bottom">
                    <button
                        onClick={onClose}
                        className="h-11 sm:h-12 px-4 sm:px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="h-12 sm:h-14 px-6 sm:px-12 bg-slate-900 text-primary rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:translate-y-[-2px] hover:shadow-2xl shadow-slate-900/20 transition-all active:translate-y-0 disabled:opacity-50 flex items-center gap-2 sm:gap-4 border border-white/10"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span className="hidden sm:inline">Update Profile</span>
                        <span className="sm:hidden">Update</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
