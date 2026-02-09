'use client';

import { Suspense, useState, useEffect } from 'react';
import {
    Play,
    Square,
    AlertCircle,
    Mic,
    ChevronRight,
    LayoutDashboard,
    Loader2,
    Sparkles,
    MicOff,
    Binary,
    Zap,
    Users,
    Search,
    Download
} from 'lucide-react';
import { AudioVisualizer } from '@/components/scribe/audio-visualizer';
import { TranscriptView } from '@/components/scribe/transcript-view';
import { SoapEditor } from '@/components/soap/soap-editor';
import { PatientContext } from '@/components/scribe/patient-context';
import { PrintableRecord } from '@/components/patient/printable-record';
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
        recordingState,
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
    const [patientSearch, setPatientSearch] = useState('');

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
        // Clinical Safety: Only trigger synthesis if recordingState is explicitly FINISHED
        if (recordingState === 'FINISHED' && !isGenerating && !generatedSoap && !sessionActive) {
            if (transcript && transcript.length > 5) {
                console.log('[Scribe] 🤖 Triggering SOAP Synthesis (Session Finished)');
                handleAutoWorkflow();
            }
        }
    }, [recordingState, sessionActive, isGenerating, generatedSoap, transcript]);

    const beginSession = () => {
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

        const willPause = !isPaused;
        togglePause(willPause);

        if (willPause) {
            toast.success('Capture paused.');
        } else {
            toast.success('Resuming capture.');
        }
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
        } catch (err: any) {
            console.error("[Archive] Permanent failure:", err);
            toast.error("Auto-save failed: " + (err.message || "Network Error"));
            setSaveStatus('idle');
        }
    };

    const handleSave = async () => {
        if (!generatedSoap || !user) return;
        setSaveStatus('saving');
        try {
            const targetPatientId = urlPatientId || patient?.id;
            if (!targetPatientId) {
                setSaveStatus('idle');
                toast.error("Assign a patient before archiving.");
                return;
            }

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

    const handleDownload = async () => {
        if (!generatedSoap) return;
        const toastId = toast.loading("Synthesizing professional clinical report...");

        try {
            const { fixHtml2CanvasCSS } = await import('@/lib/utils');
            fixHtml2CanvasCSS(); // Sanitize CSS for html2canvas compatibility

            const { default: html2canvas } = await import('html2canvas');
            const { jsPDF } = await import('jspdf');

            const element = document.querySelector('.printable-record') as HTMLElement;
            if (!element) throw new Error("Print buffer not found");

            element.style.display = 'block';
            element.style.position = 'fixed';
            element.style.left = '-9999px';
            element.style.top = '0';
            element.style.width = '800px';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            element.style.display = 'none';

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
            const fileName = `Clinical_Record_${patient?.name || 'Unassigned'}_${new Date().toISOString().split('T')[0]}.pdf`;

            const { Capacitor } = await import('@capacitor/core');
            if (Capacitor.isNativePlatform()) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');

                const pdfBase64 = pdf.output('datauristring').split(',')[1];
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: pdfBase64,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: 'Clinical Report',
                    text: `Medical documentation for ${patient?.name || 'Subject'}`,
                    url: result.uri,
                });
                toast.success("Medical report exported", { id: toastId });
            } else {
                pdf.save(fileName);
                toast.success("Medical report exported", { id: toastId });
            }
        } catch (error: any) {
            console.error("PDF generation failed:", error);
            const element = document.querySelector('.printable-record') as HTMLElement;
            if (element) element.style.display = 'none'; // Ensure cleanup on error
            toast.error("Export failed: " + error.message, { id: toastId });
        }
    };

    // Derived Status from single source of truth
    const isEstablishing = connectionStatus === 'connecting';
    const sessionStatusLabel: 'IDLE' | 'CONNECTING' | 'LISTENING' | 'PAUSED' | 'STANDBY' =
        recordingState === 'IDLE' ? (isEstablishing ? 'CONNECTING' : 'IDLE') :
            recordingState === 'RECORDING' ? 'LISTENING' :
                recordingState === 'PAUSED' ? 'PAUSED' :
                    recordingState === 'FINISHED' ? 'STANDBY' :
                        recordingState === 'ERROR' ? 'PAUSED' : 'IDLE';

    return (
        <div className="flex flex-col flex-1 min-h-[calc(100dvh-140px)] xl:h-[calc(100dvh-8rem)] pb-28 sm:pb-10 xl:pb-4 overflow-y-auto xl:overflow-hidden px-0 sm:px-1">
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
                    <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
                        Clinical <span className="text-primary">Capture</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {!sessionActive ? (
                        <button
                            onClick={beginSession}
                            className="btn-premium w-full sm:w-auto px-6 sm:px-10 h-12"
                        >
                            <Mic className="h-4 w-4" />
                            <span>Begin Capture Protocol</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <button
                                onClick={handlePauseResume}
                                disabled={isEstablishing}
                                className={cn(
                                    "btn-premium flex-1 sm:flex-none h-12 px-6",
                                    isEstablishing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {isEstablishing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Set Up</span>
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
                                className="btn-premium flex-1 sm:flex-none h-12 px-6"
                            >
                                <Square className="h-3.5 w-3.5 fill-black" />
                                <span className="hidden xs:inline">Terminate & Sync</span>
                                <span className="xs:hidden">Finish</span>
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

                        {/* Mobile Optimized Transcription Domain (Shown above identity during active session) */}
                        <div className={cn(
                            "flex-1 min-h-[400px] xl:h-auto overflow-hidden relative group border-b border-divider",
                            sessionActive ? "order-3" : "order-5"
                        )}>
                            <div className="xl:absolute xl:inset-0 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                                <TranscriptView
                                    transcript={transcript}
                                    interimTranscript={interimTranscript}
                                    connectionStatus={connectionStatus}
                                />
                            </div>
                            <div className="hidden xl:block absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
                        </div>

                        {/* Subject Identity Context */}
                        <div className={cn(
                            "flex flex-col min-h-0 overflow-hidden border-b border-divider",
                            sessionActive ? "order-4 flex-none h-auto transition-all" : "flex-1 order-3"
                        )}>
                            {patient ? (
                                <div className="relative group p-4 border-b border-divider bg-slate-50/30">
                                    <PatientContext patient={patient} />
                                    {!sessionActive && (
                                        <button
                                            onClick={() => setPatient(null)}
                                            className="absolute top-4 right-4 text-[9px] uppercase font-bold text-primary hover:underline"
                                        >
                                            Switch Patient
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className={cn(
                                    "flex-1 flex flex-col min-h-0 bg-white dark:bg-card h-[400px] sm:h-auto transition-all",
                                    sessionActive && "h-[60px] opacity-50 grayscale"
                                )}>
                                    {!sessionActive ? (
                                        <>
                                            <div className="p-6 border-b border-divider space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Patient Repository</h3>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Select target subject</p>
                                                    </div>
                                                    <Users className="h-4 w-4 text-muted-foreground/30" />
                                                </div>

                                                <div className="search-container">
                                                    <Search className="search-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search clinical directory..."
                                                        value={patientSearch}
                                                        onChange={(e) => setPatientSearch(e.target.value)}
                                                        className="search-input h-11"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                                                {allPatients
                                                    .filter(p => !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()))
                                                    .map((p) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => handlePatientSelect(p.id)}
                                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-black hover:bg-slate-50 dark:hover:bg-slate-900 group/item transition-all"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 border border-black dark:border-border rounded-lg bg-white dark:bg-black p-0.5 flex-shrink-0">
                                                                    {p.image ? (
                                                                        <img src={p.image} className="h-full w-full object-cover rounded shadow-sm" alt="" />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center text-xs font-serif font-black">{p.name[0]}</div>
                                                                    )}
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{p.name}</p>
                                                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">{p.species || 'Unknown Entity'}</p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-all group-hover/item:translate-x-1 group-hover/item:text-primary" />
                                                        </button>
                                                    ))}

                                                {allPatients.length > 0 && allPatients.filter(p => !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                                                    <div className="p-10 text-center space-y-4">
                                                        <Search className="h-8 w-8 text-black/5 mx-auto" />
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No matching subjects found</p>
                                                    </div>
                                                )}

                                                {allPatients.length === 0 && (
                                                    <div className="p-10 text-center animate-pulse">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-black/20" />
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Accessing Database...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center p-2">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Capture in Progress</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Synthesis Domain */}
                <div className="flex w-full xl:w-[55%] flex-col gap-8 xl:overflow-hidden min-h-[600px] xl:min-h-0">
                    <div className="surface flex flex-col flex-1 overflow-hidden relative">
                        {/* Note Identity */}
                        <div className="px-8 py-4 border-b border-divider bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="h-9 w-9 bg-black text-white rounded flex items-center justify-center shadow-sm">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xs font-medium text-foreground uppercase tracking-widest leading-none mb-1">SOAP Synthesis</h2>
                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.1em]">Automated Clinical Record</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {generatedSoap && (
                                    <>
                                        <button
                                            onClick={handleDownload}
                                            className="h-8 w-8 flex items-center justify-center border border-divider rounded-lg text-muted-foreground hover:bg-muted transition-all active:scale-90"
                                            title="Download PDF"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
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
                                    </>
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

            {/* Hidden printable record for PDF generation */}
            {generatedSoap && (
                <PrintableRecord
                    date={new Date().toISOString()}
                    patient={patient || {
                        id: 'unassigned',
                        name: 'Unassigned Patient',
                        species: 'Exotic',
                        breed: 'Unknown',
                        age: 0,
                        age_months: 0,
                        weight: 0,
                        owner: 'Unknown Client',
                        lastVisit: new Date().toISOString().split('T')[0],
                        status: 'Active',
                        image: ''
                    }}
                    soap={generatedSoap}
                    clinicianName={user?.displayName || user?.email?.split('@')[0] || 'Authorized Clinician'}
                />
            )}
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

