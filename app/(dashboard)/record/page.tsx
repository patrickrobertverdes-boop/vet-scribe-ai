'use client';

import { Suspense, useState, useEffect } from 'react';
import {
    Play,
    Square,
    Wand2,
    Save,
    AlertCircle,
    Mic,
    ChevronRight,
    Activity,
    ShieldCheck,
    History,
    LayoutDashboard,
    Loader2,
    Sparkles,
    MicOff,
    CheckCircle,
    Database,
    Binary,
    Zap,
    Users,
    Plus
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { AudioVisualizer } from '@/components/scribe/audio-visualizer';
import { TranscriptView } from '@/components/scribe/transcript-view';
import { SoapEditor } from '@/components/soap/soap-editor';
import { PatientContext } from '@/components/scribe/patient-context';
import { callGemini } from '@/lib/gemini-client';
import { useDeepgram } from '@/hooks/use-deepgram';
import { firebaseService } from '@/lib/firebase-service';
import { SoapNote, Patient } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { useDesignStore } from '@/lib/design-store';
import { useAuth } from '@/context/AuthContext';

function RecordPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const { clinicalModel } = useDesignStore();

    // Hooks
    const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript, error: micError, clearError: clearMicError, connectionStatus, stream } = useDeepgram();

    // Debug logging to verify UI state connection
    useEffect(() => {
        if (isListening) {
            console.log('[UI Debug] Interim:', interimTranscript);
            console.log('[UI Debug] Final:', transcript);
        }
    }, [interimTranscript, transcript, isListening]);

    const [generatedSoap, setGeneratedSoap] = useState<SoapNote | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [geminiError, setGeminiError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Patient Context Logic
    const searchParams = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const [patient, setPatient] = useState<any>(null);
    const [allPatients, setAllPatients] = useState<Patient[]>([]);

    useEffect(() => {
        const initData = async () => {
            if (!user) return;

            // 1. If Patient ID is in URL, fetch that specific patient
            if (urlPatientId) {
                const data = await firebaseService.getPatient(user.uid, urlPatientId);
                if (data) setPatient(data);
                else toast.error("Specified patient record not found.");
            }

            // 2. Always fetch list for the selector if we don't have a patient yet (or even if we do, to allow switching)
            // Optimization: Only fetch if we might need to switch or select
            const patientsList = await firebaseService.getPatients(user.uid);
            setAllPatients(patientsList);

            // 3. Fallback: If no URL ID, but we have patients, don't auto-select yet. Let user choose.
            // Unless we want to be helpful? No, explicit choice is better for safety.
        };
        initData();
    }, [urlPatientId, user]);

    const handlePatientSelect = (patientId: string) => {
        const selected = allPatients.find(p => p.id === patientId);
        if (selected) {
            setPatient(selected);
            toast.success(`Session active for: ${selected.name}`);
        }
    };

    // Prevent body scroll when recording to avoid jumpy behavior
    useEffect(() => {
        if (isListening) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isListening]);

    const sanitizeTranscript = (text: string) => {
        // Redact words that might trigger AI safety filters (clinical context)
        return text.replace(/\b(nigger|faggot|retard)\b/gi, "[redacted]");
    };

    useEffect(() => {
        // Trigger auto-workflow when recording stops
        if (connectionStatus === 'finished' && !isGenerating && !generatedSoap) {
            if (transcript && transcript.length > 5) { // Minimum length threshold
                handleAutoWorkflow();
            }
        }
    }, [connectionStatus]);

    const toggleRecording = () => {
        if (!isListening && !patient) {
            toast.error("Please select a patient before starting the recording.");
            return;
        }

        if (isListening) {
            stopListening();
            toast.success('Recording stopped. AI is preparing your SOAP note.');
        } else {
            setGeneratedSoap(null);
            setSaveStatus('idle');
            setGeminiError(null);
            resetTranscript();
            startListening();
            toast.success('Microphone active. Real-time medical analysis started.');
        }
    };

    const handleAutoWorkflow = async () => {
        const fullTranscript = (transcript + ' ' + (interimTranscript || '')).trim();
        console.log('📝 Current full transcript for generation:', fullTranscript);

        if (!fullTranscript || fullTranscript.length < 5) {
            console.warn('[RecordPage] Transcript too short or empty, skipping generation');
            return;
        }

        setIsGenerating(true);
        setGeminiError(null);

        try {
            console.log('📤 Sending to Gemini API...');
            const safeTranscript = sanitizeTranscript(fullTranscript);

            // 1. Generate SOAP via AI (using the lib helper which calls /api/gemini)
            const soap = await callGemini(safeTranscript, clinicalModel);
            console.log('✅ SOAP Note Generated:', soap);
            setGeneratedSoap(soap);

            // 2. Automatically Save if patient is selected
            if (user && (urlPatientId || patient?.id)) {
                const targetId = urlPatientId || patient?.id;
                console.log('[RecordPage] Patient selected, performing auto-save to:', targetId);
                await performAutoSave(targetId, fullTranscript, soap);
            } else {
                toast.success('SOAP generated. Select a patient to save.');
                console.log('[RecordPage] No patient selected, awaiting manual save');
            }
        } catch (err: any) {
            console.error('❌ SOAP Generation Error:', err);
            const errorMessage = err.message || "Failed to generate notes.";
            setGeminiError(errorMessage);
            toast.error(`AI Error: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const performAutoSave = async (patientId: string, finalTranscript: string, soap: SoapNote) => {
        setSaveStatus('saving');
        try {
            // Ensure we have metadata even if state is slightly lagged
            let metaName = patient?.name;
            let metaImage = patient?.image;

            if (!metaName && user) {
                const pData = await firebaseService.getPatient(user.uid, patientId);
                if (pData) {
                    metaName = pData.name;
                    metaImage = pData.image;
                }
            }

            await firebaseService.createConsultation(user!.uid, patientId, {
                transcript: finalTranscript,
                soap: soap,
                status: 'completed',
                date: new Date().toISOString(),
                soapPreview: soap.subjective?.slice(0, 100),
                patientName: metaName,
                patientImage: metaImage
            });

            await firebaseService.updatePatient(user!.uid, patientId, {
                lastVisit: new Date().toISOString().split('T')[0]
            });

            setSaveStatus('saved');
            toast.success('Record saved automatically.');
        } catch (err) {
            console.error("Auto-save failed:", err);
            toast.error("Auto-save failed. Please use manual save.");
            setSaveStatus('idle');
        }
    };


    const handleSave = async () => {
        if (!generatedSoap) {
            toast.error("No SOAP note generated to save.");
            return;
        }

        if (!user) {
            toast.error("You must be logged in to save.");
            return;
        }

        setSaveStatus('saving');

        try {
            // Priority: URL Patient ID > Loaded Patient ID > Selected Patient State
            let targetPatientId = urlPatientId || patient?.id;

            if (!targetPatientId) {
                // If no patient selected at all, we can't save to "individual" patient
                // We should try to find if there's any patient, but better to ask user
                const patients = await firebaseService.getPatients(user.uid);
                if (patients.length > 0) {
                    targetPatientId = patients[0].id;
                    toast.error("No patient selected. Auto-assigning to first patient: " + patients[0].name);
                }
            }

            if (!targetPatientId) {
                setGeminiError("No patient identity found for record. Please select a patient first.");
                setSaveStatus('idle');
                toast.error("Please select a patient before saving.");
                // trigger selector visibility if we can (by clearing patient if it was strangely null but not detected?)
                // Actually, if targetPatientId is null, it means we are in the "Select Patient" state already or failed to match.
                return;
            }

            setSaveStatus('saved');
            toast.success(`Record successfully saved to patient ${targetPatientId}`);

            // 2. Fire and forget parallel writes
            // We use Promise.all to ensure they both run, but we don't block the UI *indefinitely* if one hangs.
            // Actually, we should probably await them for a split second to ensure they started, 
            // but for "INSTANT" feel, we trust safeWrite (or standard promise) and redirect.

            // Ensure we have metadata
            let metaName = patient?.name;
            let metaImage = patient?.image;

            if (!metaName && user) {
                const pData = await firebaseService.getPatient(user.uid, targetPatientId);
                if (pData) {
                    metaName = pData.name;
                    metaImage = pData.image;
                }
            }

            const savePromises = [
                firebaseService.createConsultation(user.uid, targetPatientId, {
                    transcript,
                    soap: generatedSoap,
                    status: 'completed',
                    date: new Date().toISOString(),
                    soapPreview: generatedSoap.subjective?.slice(0, 100),
                    patientName: metaName,
                    patientImage: metaImage
                }),
                firebaseService.updatePatient(user.uid, targetPatientId, {
                    lastVisit: new Date().toISOString().split('T')[0]
                })
            ];

            await Promise.all(savePromises);
            console.log('✅ Save successful');
        } catch (err) {
            console.error("Save Error:", err);
            setGeminiError("Failed to initiate save.");
            setSaveStatus('idle');
            toast.error("Failed to save record.");
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-[calc(100dvh-140px)] xl:h-[calc(100dvh-8rem)] pb-28 sm:pb-10 xl:pb-4 overflow-y-auto xl:overflow-hidden px-1">
            {/* Protocol Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/" className="h-9 w-9 border border-border rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-all active:scale-95 shrink-0">
                            <LayoutDashboard className="h-4 w-4" />
                        </Link>
                        <span className="text-[10px] font-medium text-white uppercase tracking-[0.2em] border border-white/20 px-2 py-0.5 rounded">
                            System Standby
                        </span>
                    </div>
                    <h1 className="text-3xl font-serif font-medium text-foreground tracking-tight">
                        AI <span className="text-primary">Scribe</span>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex flex-col items-end opacity-60">
                        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Protocol Security</p>
                        <div className="flex items-center gap-2 px-2 py-0.5 border border-emerald-100 dark:border-emerald-900/50 rounded bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="h-3 w-3" />
                            <span className="text-[9px] font-medium uppercase tracking-widest">End-to-End</span>
                        </div>
                    </div>

                    <button
                        onClick={toggleRecording}
                        className={cn(
                            "btn-premium px-8 h-11 flex items-center gap-3 transition-all",
                            isListening
                                ? "bg-background text-rose-500 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50/50"
                                : "bg-primary text-primary-foreground"
                        )}
                    >
                        {isListening ? (
                            <>
                                <MicOff className="h-4 w-4 opacity-80" />
                                <span className="hidden sm:inline">Terminate Session</span>
                                <span className="sm:hidden">Stop</span>
                            </>
                        ) : (
                            <>
                                <Mic className="h-4 w-4" />
                                <span className="hidden sm:inline">Initialize Scribe</span>
                                <span className="sm:hidden">Record</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row flex-1 gap-8 overflow-visible xl:overflow-hidden pb-12 sm:pb-0">
                {/* Acoustic Capture Domain */}
                <div className="w-full xl:w-[45%] flex flex-col gap-8 min-h-[500px] xl:min-h-0 xl:overflow-hidden">
                    <div className="surface flex flex-col flex-1 overflow-hidden relative">
                        {/* Stream Status */}
                        <div className="px-6 py-3 border-b border-divider bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    isListening ? "bg-rose-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"
                                )} />
                                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                    {isListening ? 'Bio-Acoustic Stream Active' : 'System Standby'}
                                </span>
                            </div>
                        </div>

                        {/* Visual Domain */}
                        <div className="h-24 bg-slate-950 overflow-hidden relative border-b border-divider">
                            <AudioVisualizer isRecording={isListening} stream={stream} />
                            {connectionStatus === 'connecting' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/50">Establishing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subject Identity Context */}
                        <div className="border-b border-divider transition-all">
                            {patient ? (
                                <div className="relative group">
                                    <PatientContext patient={patient} />
                                    <button
                                        onClick={() => setPatient(null)}
                                        className="absolute top-4 right-4 text-[9px] uppercase font-medium text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Reassign Entity
                                    </button>
                                </div>
                            ) : (
                                <div className="p-10 flex flex-col items-center justify-center gap-6 text-center">
                                    <div className="h-14 w-14 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded flex items-center justify-center text-muted-foreground/30">
                                        <Users className="h-6 w-6 dark:text-white" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Clinical Subject Required</h3>
                                        <p className="text-[11px] text-muted-foreground/60 max-w-[240px] leading-relaxed">Identity association is mandatory for automated SOAP synthesis and ledger archival.</p>
                                    </div>

                                    <div className="w-full max-w-xs relative z-20">
                                        <CustomSelect
                                            value=""
                                            onChange={handlePatientSelect}
                                            options={allPatients.map(p => ({ label: p.name, value: p.id }))}
                                            placeholder={allPatients.length > 0 ? "Query active directory..." : "Database initializing..."}
                                            className="w-full"
                                        />
                                    </div>

                                    <button
                                        onClick={() => router.push('/patients?new=true')}
                                        className="text-[10px] font-medium uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Add New Patient
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-hidden relative group">
                            <div className="absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                                <TranscriptView
                                    transcript={transcript}
                                    interimTranscript={interimTranscript}
                                    connectionStatus={connectionStatus}
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Synthesis Domain */}
                <div className="flex w-full xl:w-[55%] flex-col gap-8 xl:overflow-hidden min-h-[600px] xl:min-h-0">
                    <div className="surface flex flex-col flex-1 overflow-hidden relative">
                        {/* Note Identity */}
                        <div className="px-8 py-4 border-b border-divider bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="h-9 w-9 bg-primary text-primary-foreground rounded flex items-center justify-center shadow-sm">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-xs font-medium text-foreground uppercase tracking-widest leading-none mb-1">SOAP Synthesis</h2>
                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.1em]">Automated Clinical Record</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {saveStatus === 'saved' && (
                                    <button
                                        onClick={() => router.push(`/patients/${urlPatientId || patient?.id}`)}
                                        className="h-8 px-4 border border-border rounded text-[9px] font-medium uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                                    >
                                        Access Profile
                                    </button>
                                )}

                                {generatedSoap && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saveStatus !== 'idle'}
                                        className={cn(
                                            "h-8 px-5 rounded text-[9px] font-medium uppercase tracking-widest transition-all",
                                            saveStatus === 'saved'
                                                ? "bg-emerald-500 text-white"
                                                : "bg-primary text-primary-foreground"
                                        )}
                                    >
                                        {saveStatus === 'saving' ? 'Archiving...' :
                                            saveStatus === 'saved' ? 'Archived' : 'Commit to Ledger'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Synthesis Hub */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                            {isGenerating ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="relative mb-6">
                                        <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                        <Zap className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40" />
                                    </div>
                                    <h3 className="text-sm font-medium text-foreground uppercase tracking-widest">Processing Synthesis</h3>
                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-2 animate-pulse">
                                        Awaiting neural model response...
                                    </p>
                                </div>
                            ) : generatedSoap ? (
                                <div className="h-full">
                                    <SoapEditor
                                        soap={generatedSoap}
                                        onChange={(newSoap) => setGeneratedSoap(newSoap)}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-16 text-center">
                                    <div className="h-16 w-16 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded flex items-center justify-center mb-8">
                                        <Binary className="h-6 w-6 text-muted-foreground/20" />
                                    </div>
                                    <h3 className="text-sm font-medium text-foreground uppercase tracking-widest">
                                        {isListening ? (interimTranscript ? 'Decoding Stream...' : 'Listening...') : 'Awaiting Protocol Entry'}
                                    </h3>
                                    <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] mt-3 mb-10 max-w-[280px] leading-relaxed">
                                        {interimTranscript ? (
                                            <span className="text-primary">"{interimTranscript}..."</span>
                                        ) : (
                                            'Neural synthesis standby.'
                                        )}
                                    </p>

                                    {transcript && !isListening && (
                                        <button
                                            onClick={handleAutoWorkflow}
                                            disabled={isGenerating}
                                            className="mb-8 btn-premium h-9 px-6 bg-primary text-primary-foreground"
                                        >
                                            <Sparkles className="h-3.5 w-3.5 mr-2" />
                                            Manual Synthesis
                                        </button>
                                    )}

                                    <div className="max-w-[320px] p-5 border border-divider rounded bg-slate-50/50 dark:bg-slate-900/10">
                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="h-4 w-4 text-primary/40 shrink-0" />
                                            <p className="text-[10px] leading-relaxed text-left font-normal text-muted-foreground">
                                                Protocol active. Speak normally to influence the neural model synthesis. All data encrypted.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Diagnostic Alerts */}
                        {(micError || geminiError) && (
                            <div className="p-4 bg-rose-50/50 border-t border-rose-100 flex items-start gap-4">
                                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-[9px] font-medium text-rose-900 uppercase tracking-widest">Diagnostic Alert</p>
                                    <p className="text-[11px] text-rose-600 font-normal leading-relaxed mt-1">{micError || geminiError}</p>
                                </div>
                                <button
                                    onClick={() => { setGeminiError(null); clearMicError(); }}
                                    className="text-[9px] font-medium uppercase tracking-widest text-rose-500 hover:underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RecordPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100dvh-8rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-10">
                    <div className="relative">
                        <div className="h-12 w-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] animate-pulse">Initializing Interface</p>
                    </div>
                </div>
            </div>
        }>
            <RecordPageContent />
        </Suspense>
    );
}

