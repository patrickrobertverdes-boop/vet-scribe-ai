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
    const {
        isListening,
        isPaused,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        togglePause,
        resetTranscript,
        setTranscript,
        error: micError,
        clearError: clearMicError,
        connectionStatus,
        stream
    } = useDeepgram();

    const [sessionActive, setSessionActive] = useState(false);
    const [generatedSoap, setGeneratedSoap] = useState<SoapNote | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [geminiError, setGeminiError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Patient Context Logic
    const searchParams = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const [patient, setPatient] = useState<any>(null);
    const [allPatients, setAllPatients] = useState<Patient[]>([]);

    // Load draft on mount
    useEffect(() => {
        const initFromDraft = async () => {
            const draftTranscript = localStorage.getItem('scribe_draft_transcript');
            const draftActive = localStorage.getItem('scribe_draft_active') === 'true';
            const draftPatientId = localStorage.getItem('scribe_draft_patient_id');

            if (draftActive && draftTranscript) {
                setTranscript(draftTranscript);
                setSessionActive(true);

                // If we have a patient, try to reconnect immediately for seamless resume
                if (user && draftPatientId) {
                    const data = await firebaseService.getPatient(user.uid, draftPatientId);
                    if (data) {
                        setPatient(data);
                        // Auto-start listening if it was active
                        startListening();
                        toast.success('Restoring active session...');
                    }
                }
            }
        };

        initFromDraft();
    }, [user, setTranscript, startListening]);

    // Save draft on change
    useEffect(() => {
        if (sessionActive || transcript) {
            localStorage.setItem('scribe_draft_transcript', transcript);
            localStorage.setItem('scribe_draft_active', sessionActive.toString());
            if (patient?.id) {
                localStorage.setItem('scribe_draft_patient_id', patient.id);
            }
        } else if (!isGenerating && !generatedSoap) {
            localStorage.removeItem('scribe_draft_transcript');
            localStorage.removeItem('scribe_draft_active');
            localStorage.removeItem('scribe_draft_patient_id');
        }
    }, [transcript, sessionActive, patient, isGenerating, generatedSoap]);

    useEffect(() => {
        const initPatients = async () => {
            if (!user) return;
            const patientsList = await firebaseService.getPatients(user.uid);
            setAllPatients(patientsList);

            // If URL patient ID is present, it takes priority over draft
            if (urlPatientId) {
                const data = await firebaseService.getPatient(user.uid, urlPatientId);
                if (data) setPatient(data);
            }
        };
        initPatients();
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
        if (isListening && !isPaused) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isListening, isPaused]);

    const sanitizeTranscript = (text: string) => {
        return text.replace(/\b(nigger|faggot|retard)\b/gi, "[redacted]");
    };

    useEffect(() => {
        if (connectionStatus === 'finished' && !isGenerating && !generatedSoap) {
            if (transcript && transcript.length > 5) {
                handleAutoWorkflow();
            }
        }
    }, [connectionStatus]);

    const beginSession = () => {
        if (!patient) {
            toast.error("Please select a patient before starting the session.");
            return;
        }
        setGeneratedSoap(null);
        setSaveStatus('idle');
        setGeminiError(null);
        resetTranscript();
        startListening();
        setSessionActive(true);
        toast.success('Capture initialized. System is transcribing.');
    };

    const handlePauseResume = () => {
        if (!isListening) {
            startListening(); // Reconnect if refresh/dropped
            toast.success('Attempting to re-establish secure link...');
            return;
        }
        togglePause(!isPaused);
        if (!isPaused) toast.success('Capture paused.');
        else toast.success('Resuming capture.');
    };

    const endSession = () => {
        stopListening();
        setSessionActive(false);
        // localStorage will be cleared after generation/save
    };

    const handleAutoWorkflow = async () => {
        const fullTranscript = (transcript + ' ' + (interimTranscript || '')).trim();
        if (!fullTranscript || fullTranscript.length < 5) return;

        setIsGenerating(true);
        setGeminiError(null);

        try {
            const safeTranscript = sanitizeTranscript(fullTranscript);
            const soap = await callGemini(safeTranscript, clinicalModel);
            setGeneratedSoap(soap);

            if (user && (urlPatientId || patient?.id)) {
                await performAutoSave(urlPatientId || patient?.id, fullTranscript, soap);
            }
        } catch (err: any) {
            setGeminiError(err.message || "Failed to generate notes.");
            toast.error(`AI Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const performAutoSave = async (patientId: string, finalTranscript: string, soap: SoapNote) => {
        setSaveStatus('saving');
        try {
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
            toast.success('Clinical record auto-saved successfully.');
        } catch (err) {
            toast.error("Auto-save failed. Manual entry required.");
            setSaveStatus('idle');
        }
    };

    const handleSave = async () => {
        if (!generatedSoap || !user) return;
        setSaveStatus('saving');
        try {
            const targetPatientId = urlPatientId || patient?.id;
            if (!targetPatientId) return;

            await firebaseService.createConsultation(user.uid, targetPatientId, {
                transcript,
                soap: generatedSoap,
                status: 'completed',
                date: new Date().toISOString(),
                soapPreview: generatedSoap.subjective?.slice(0, 100),
                patientName: patient?.name,
                patientImage: patient?.image
            });

            setSaveStatus('saved');
            toast.success('Changes committed to clinical registry.');
        } catch (err) {
            setSaveStatus('idle');
            toast.error("Failed to commit changes.");
        }
    };

    // Derived Status
    const isEstablishing = connectionStatus === 'connecting';

    let sessionStatusLabel: 'IDLE' | 'CONNECTING' | 'LISTENING' | 'PAUSED' | 'STANDBY' = 'IDLE';
    if (!sessionActive) {
        sessionStatusLabel = 'IDLE';
    } else if (isEstablishing) {
        sessionStatusLabel = 'CONNECTING';
    } else if (isListening) {
        sessionStatusLabel = isPaused ? 'PAUSED' : 'LISTENING';
    } else {
        sessionStatusLabel = 'STANDBY';
    }

    return (
        <div className="flex flex-col flex-1 min-h-[calc(100dvh-140px)] xl:h-[calc(100dvh-8rem)] pb-28 sm:pb-10 xl:pb-4 overflow-y-auto xl:overflow-hidden px-1">
            {/* Protocol Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/" className="h-9 w-9 border border-border rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-all active:scale-95 shrink-0">
                            <LayoutDashboard className="h-4 w-4" />
                        </Link>
                        <div className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded transition-colors duration-500",
                            sessionStatusLabel === 'LISTENING' ? "bg-emerald-500 text-white" :
                                sessionStatusLabel === 'CONNECTING' ? "bg-blue-500 text-white animate-pulse" :
                                    sessionStatusLabel === 'PAUSED' ? "bg-amber-500 text-white" :
                                        sessionStatusLabel === 'STANDBY' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600" :
                                            "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        )}>
                            {sessionStatusLabel}
                        </div>
                    </div>
                    <h1 className="text-3xl font-serif font-medium text-foreground tracking-tight">
                        Clinical <span className="text-primary">Capture</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {!sessionActive ? (
                        <button
                            onClick={beginSession}
                            className="btn-premium px-8 h-11 bg-black dark:bg-white text-white dark:text-black flex items-center gap-3"
                        >
                            <Mic className="h-4 w-4" />
                            <span>Begin Capture</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePauseResume}
                                disabled={isEstablishing}
                                className={cn(
                                    "h-11 px-6 rounded border flex items-center gap-3 font-bold text-xs uppercase tracking-widest transition-all",
                                    (isPaused || !isListening)
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200"
                                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200",
                                    isEstablishing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {isEstablishing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Setting Up...</span>
                                    </>
                                ) : (isPaused || !isListening) ? (
                                    <>
                                        <Play className="h-4 w-4" />
                                        <span>Resume</span>
                                    </>
                                ) : (
                                    <>
                                        <MicOff className="h-4 w-4" />
                                        <span>Pause</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={endSession}
                                className="h-11 px-6 rounded bg-rose-500 text-white flex items-center gap-3 font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10"
                            >
                                <Square className="h-3.5 w-3.5 fill-white" />
                                <span>End & Generate</span>
                            </button>
                        </div>
                    )}
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
                                    sessionStatusLabel === 'LISTENING' ? "bg-emerald-500 animate-pulse" :
                                        sessionStatusLabel === 'CONNECTING' ? "bg-blue-500 animate-pulse" :
                                            sessionStatusLabel === 'PAUSED' ? "bg-amber-500" :
                                                "bg-slate-300 dark:bg-slate-700"
                                )} />
                                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                    {sessionStatusLabel === 'LISTENING' ? 'Acoustic Stream Active' :
                                        sessionStatusLabel === 'CONNECTING' ? 'Initializing Secure Link' :
                                            sessionStatusLabel === 'PAUSED' ? 'Capture Suspended' :
                                                sessionStatusLabel === 'STANDBY' ? 'Session Persistent (Offline)' : 'System Ready'}
                                </span>
                            </div>
                        </div>

                        {/* Visual Domain */}
                        <div className="h-24 bg-slate-950 overflow-hidden relative border-b border-divider">
                            <AudioVisualizer isRecording={isListening && !isPaused} stream={stream} />
                            {(connectionStatus === 'connecting' || (sessionActive && !isListening)) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/50">
                                            {connectionStatus === 'connecting' ? 'Establishing Sink...' : 'Reconnecting...'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subject Identity Context */}
                        <div className="border-b border-divider transition-all">
                            {patient ? (
                                <div className="relative group">
                                    <PatientContext patient={patient} />
                                    {!sessionActive && (
                                        <button
                                            onClick={() => setPatient(null)}
                                            className="absolute top-4 right-4 text-[9px] uppercase font-medium text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Reassign Entity
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="p-10 flex flex-col items-center justify-center gap-6 text-center">
                                    <div className="h-14 w-14 bg-slate-50 dark:bg-transparent dark:border dark:border-white/20 border border-border rounded flex items-center justify-center text-muted-foreground/30">
                                        <Users className="h-6 w-6 dark:text-white" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Clinical Subject Required</h3>
                                        <p className="text-[11px] text-muted-foreground/60 max-w-[240px] leading-relaxed">Identity association is mandatory for automated SOAP synthesis.</p>
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
                                {generatedSoap && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saveStatus !== 'idle'}
                                        className={cn(
                                            "h-8 px-5 rounded text-[9px] font-medium uppercase tracking-widest transition-all",
                                            saveStatus === 'saved'
                                                ? "bg-emerald-500 text-white"
                                                : "bg-black dark:bg-white text-white dark:text-black"
                                        )}
                                    >
                                        {saveStatus === 'saving' ? 'Archiving...' :
                                            saveStatus === 'saved' ? 'Archived' : 'Commit Changes'}
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
                                    <h3 className="text-sm font-bold uppercase tracking-widest">Processing Synthesis</h3>
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
                                    <h3 className="text-sm font-bold uppercase tracking-widest">
                                        {sessionStatusLabel === 'LISTENING' ? (interimTranscript ? 'Decoding Stream...' : 'Listening...') :
                                            sessionStatusLabel === 'PAUSED' ? 'Capture Paused' : 'Awaiting Entry'}
                                    </h3>
                                    <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] mt-3 mb-10 max-w-[280px] leading-relaxed">
                                        {interimTranscript ? (
                                            <span className="text-primary">"{interimTranscript}..."</span>
                                        ) : sessionActive ? (
                                            'Microphone buffered. Awaiting clinical input.'
                                        ) : (
                                            'Neural synthesis standby.'
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Diagnostic Alerts */}
                        {(micError || geminiError) && (
                            <div className="p-4 bg-rose-50 border-t border-rose-100 flex items-start gap-4">
                                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-[9px] font-bold text-rose-900 uppercase tracking-widest">Diagnostic Alert</p>
                                    <p className="text-[11px] text-rose-600 font-normal leading-relaxed mt-1">{micError || geminiError}</p>
                                </div>
                                <button
                                    onClick={() => { setGeminiError(null); clearMicError(); }}
                                    className="text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:underline"
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

