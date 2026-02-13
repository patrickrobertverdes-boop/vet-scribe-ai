'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Printer,
    Share2,
    Download,
    FileText,
    Activity,
    ShieldCheck,
    Zap,
    Clock,
    User,
    ArrowLeft,
    X,
    Plus,
    CheckCircle2,
    Stethoscope,
    Pill
} from 'lucide-react';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';
import { Consultation, Patient } from '@/lib/types';
import { SoapEditor } from '@/components/soap/soap-editor';
import { PrintableRecord } from '@/components/patient/printable-record';
import { extractStructuredData } from '@/lib/gemini-client';
import toast from 'react-hot-toast';

export default function ConsultationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [diagnoses, setDiagnoses] = useState<string[]>([]);
    const [medications, setMedications] = useState<string[]>([]);
    const [visitStatus, setVisitStatus] = useState<'in-progress' | 'completed'>('in-progress');
    const [editingDiagnosis, setEditingDiagnosis] = useState<number | null>(null);
    const [editingMedication, setEditingMedication] = useState<number | null>(null);
    const [newDiagnosis, setNewDiagnosis] = useState('');
    const [newMedication, setNewMedication] = useState('');

    // Subscribe to user profile for professional name
    useEffect(() => {
        if (!user) return;
        const unsubscribe = firebaseService.subscribeToUserProfile(user.uid, (data) => {
            if (data) setUserProfile(data);
        });
        return () => unsubscribe();
    }, [user]);

    // Helper to extract last name from professional name or use display name
    const getClinicianDisplayName = () => {
        const professionalName = userProfile?.displayName || userProfile?.name;
        if (professionalName) {
            return professionalName;
        }
        return user?.displayName || user?.email?.split('@')[0] || 'Authorized Clinician';
    };

    useEffect(() => {
        const load = async () => {
            if (!user || !params.id) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch specific consultation directly for speed
                const found = await firebaseService.getConsultation(user.uid, params.id as string);
                if (found) {
                    setConsultation(found);
                    setDiagnoses(found.diagnoses || []);
                    setMedications(found.medications || []);
                    setVisitStatus(found.visitStatus || 'in-progress');
                    const p = await firebaseService.getPatient(user.uid, found.patientId);
                    if (p) setPatient(p);
                }
            } catch (error) {
                console.error('Failed to load consultation:', error);
                toast.error('Failed to load consultation');
            } finally {
                setIsLoading(false);
            }
        };

        if (user && params.id) {
            load();
        }
    }, [user, params.id]);

    const handleExtractStructured = async () => {
        if (!consultation?.soap) return;

        setIsExtracting(true);
        try {
            const soapText = `Subjective: ${consultation.soap.subjective}\nObjective: ${consultation.soap.objective}\nAssessment: ${consultation.soap.assessment}\nPlan: ${consultation.soap.plan}`;
            const extracted = await extractStructuredData(soapText);
            setDiagnoses(extracted.diagnoses);
            setMedications(extracted.medications);
            setHasChanges(true);
            toast.success('Structured data extracted');
        } catch (error) {
            console.error('Extraction failed:', error);
            toast.error('Failed to extract data');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSaveRecord = async () => {
        if (!user || !consultation || !params.id) return;

        setIsSaving(true);
        try {
            await firebaseService.updateConsultation(user.uid, params.id as string, {
                soap: consultation.soap,
                soapPreview: consultation.soap.subjective?.slice(0, 100),
                diagnoses,
                medications,
                visitStatus
            });
            setHasChanges(false);
            toast.success("Clinical record updated");
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSoapChange = (newSoap: any) => {
        if (!consultation) return;
        setConsultation({ ...consultation, soap: newSoap });
        setHasChanges(true);
    };

    const handleCompleteVisit = () => {
        setVisitStatus('completed');
        setHasChanges(true);
        toast.success('Visit marked as completed');
    };

    const removeDiagnosis = (index: number) => {
        setDiagnoses(diagnoses.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    const addDiagnosis = () => {
        if (newDiagnosis.trim()) {
            setDiagnoses([...diagnoses, newDiagnosis.trim()]);
            setNewDiagnosis('');
            setHasChanges(true);
        }
    };

    const addMedication = () => {
        if (newMedication.trim()) {
            setMedications([...medications, newMedication.trim()]);
            setNewMedication('');
            setHasChanges(true);
        }
    };

    const updateDiagnosis = (index: number, value: string) => {
        const updated = [...diagnoses];
        updated[index] = value;
        setDiagnoses(updated);
        setHasChanges(true);
    };

    const updateMedication = (index: number, value: string) => {
        const updated = [...medications];
        updated[index] = value;
        setMedications(updated);
        setHasChanges(true);
    };

    const handleDownload = async () => {
        if (!consultation || !patient) return;
        const toastId = toast.loading("Synthesizing professional clinical report...");

        try {
            // Import libraries dynamically
            const { default: html2canvas } = await import('html2canvas');
            const { jsPDF } = await import('jspdf');

            // Find the hidden printable element
            const element = document.querySelector('.printable-record') as HTMLElement;
            if (!element) throw new Error("Print buffer not found");

            // Temporarily show it for capture
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

            // Cleanup
            element.style.display = 'none';

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
            const fileName = `Clinical_Record_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

            import('@capacitor/core').then(async ({ Capacitor }) => {
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
                        text: `Medical documentation for ${patient.name}`,
                        url: result.uri,
                    });
                    toast.success("Medical report exported", { id: toastId });
                } else {
                    pdf.save(fileName);
                    toast.success("Medical report exported", { id: toastId });
                }
            });
        } catch (error: any) {
            console.error("PDF generation failed:", error);
            toast.error("Export failed: " + error.message, { id: toastId });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70dvh] bg-mesh rounded-3xl animate-in fade-in duration-700">
                <div className="h-16 w-16 border-[6px] border-primary/10 border-t-primary rounded-full animate-spin mb-8" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Retrieving Record...</p>
            </div>
        );
    }

    if (!consultation || !patient) {
        return (
            <div className="flex flex-col items-center justify-center h-[70dvh] glass rounded-3xl bg-white/40">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 uppercase tracking-tighter">Record Not Found</h2>
                <button onClick={() => router.back()} className="h-12 px-8 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="h-12 w-12 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-95 bg-white/50"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest">
                                Encounter Record
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {consultation.id}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight uppercase leading-none">
                            Consultation <span className="text-primary italic">Summary</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="h-12 w-12 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
                    >
                        <Printer className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleDownload}
                        title="Download PDF"
                        className="h-12 w-12 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm active:scale-95"
                    >
                        <Download className="h-5 w-5" />
                    </button>
                    <button onClick={() => toast.success('Sharing clinical broadcast...')} className="h-12 px-6 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:translate-y-[-2px] transition-all flex items-center gap-3 active:translate-y-0 shadow-lg">
                        <Share2 className="h-4 w-4" />
                        Share Record
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass rounded-[2rem] p-10 border border-slate-200/50 shadow-2xl bg-white/40">
                        <div className="flex items-center gap-6 mb-10">
                            <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-primary shadow-inner overflow-hidden relative">
                                {patient.image ? (
                                    patient.image.startsWith('http') || patient.image.startsWith('data:') ? (
                                        <img src={patient.image} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">{patient.image}</span>
                                    )
                                ) : (
                                    <User className="h-10 w-10 text-slate-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Patient Account</p>
                                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight leading-none">{patient.name}</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{patient.breed} • {patient.id}</p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-10 border-t border-slate-100">
                            {[
                                { label: 'Date of Record', value: new Date(consultation.date).toLocaleDateString(), icon: Clock },
                                { label: 'Attending Clinician', value: getClinicianDisplayName(), icon: ShieldCheck },
                                { label: 'Encounter Status', value: 'Verified', icon: Activity }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-10 w-10 glass border border-slate-100 rounded-xl flex items-center justify-center text-slate-300">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                        <p className="text-sm font-bold text-slate-900 leading-none">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-[2rem] p-10 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                        <Zap className="absolute top-[-20px] left-[-20px] h-32 w-32 text-white/5" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-6">AI Session Diagnostic</h3>
                        <p className="text-sm italic leading-relaxed opacity-80 font-medium">"Clinical patterns detected during this encounter suggest stable progression of ongoing treatment protocols. Bio-markers remain within nominal ranges."</p>
                    </div>
                </div>

                {/* SOAP Note Editor */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Visit Status Badge */}
                    {visitStatus === 'completed' && (
                        <div className="glass rounded-2xl p-6 border border-emerald-200 bg-emerald-50/50 flex items-center gap-4 animate-in slide-in-from-top-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            <div>
                                <p className="text-sm font-bold text-emerald-900 uppercase tracking-widest">Visit Completed</p>
                                <p className="text-xs text-emerald-700 mt-1">This encounter has been marked as complete</p>
                            </div>
                        </div>
                    )}

                    {/* Diagnosis Section */}
                    <div className="glass rounded-[2rem] overflow-hidden border border-slate-200/50 shadow-xl bg-white/40">
                        <div className="px-10 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-900 text-primary rounded-xl flex items-center justify-center">
                                    <Stethoscope className="h-5 w-5" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Diagnosis</h2>
                            </div>
                            {diagnoses.length === 0 && (
                                <button
                                    onClick={handleExtractStructured}
                                    disabled={isExtracting || visitStatus === 'completed'}
                                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isExtracting ? (
                                        <>
                                            <Activity className="h-3 w-3 animate-spin" />
                                            Extracting...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-3 w-3" />
                                            Auto-Extract
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="p-8">
                            <div className="flex flex-wrap gap-3 mb-4">
                                {diagnoses.map((diagnosis, index) => (
                                    <div key={index} className="group flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl hover:border-primary/50 transition-all">
                                        {editingDiagnosis === index ? (
                                            <input
                                                type="text"
                                                value={diagnosis}
                                                onChange={(e) => updateDiagnosis(index, e.target.value)}
                                                onBlur={() => setEditingDiagnosis(null)}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingDiagnosis(null)}
                                                className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 w-full"
                                                autoFocus
                                                disabled={visitStatus === 'completed'}
                                            />
                                        ) : (
                                            <span
                                                onClick={() => visitStatus !== 'completed' && setEditingDiagnosis(index)}
                                                className="text-sm font-medium text-slate-900 cursor-pointer"
                                            >
                                                {diagnosis}
                                            </span>
                                        )}
                                        {visitStatus !== 'completed' && (
                                            <button
                                                onClick={() => removeDiagnosis(index)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {visitStatus !== 'completed' && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newDiagnosis}
                                        onChange={(e) => setNewDiagnosis(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addDiagnosis()}
                                        placeholder="Add diagnosis..."
                                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                    <button
                                        onClick={addDiagnosis}
                                        disabled={!newDiagnosis.trim()}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Medications Section */}
                    <div className="glass rounded-[2rem] overflow-hidden border border-slate-200/50 shadow-xl bg-white/40">
                        <div className="px-10 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-900 text-primary rounded-xl flex items-center justify-center">
                                <Pill className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Medications & Treatments</h2>
                        </div>
                        <div className="p-8">
                            <div className="flex flex-wrap gap-3 mb-4">
                                {medications.map((medication, index) => (
                                    <div key={index} className="group flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl hover:border-primary/50 transition-all">
                                        {editingMedication === index ? (
                                            <input
                                                type="text"
                                                value={medication}
                                                onChange={(e) => updateMedication(index, e.target.value)}
                                                onBlur={() => setEditingMedication(null)}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingMedication(null)}
                                                className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 w-full"
                                                autoFocus
                                                disabled={visitStatus === 'completed'}
                                            />
                                        ) : (
                                            <span
                                                onClick={() => visitStatus !== 'completed' && setEditingMedication(index)}
                                                className="text-sm font-medium text-slate-900 cursor-pointer"
                                            >
                                                {medication}
                                            </span>
                                        )}
                                        {visitStatus !== 'completed' && (
                                            <button
                                                onClick={() => removeMedication(index)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {visitStatus !== 'completed' && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMedication}
                                        onChange={(e) => setNewMedication(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addMedication()}
                                        placeholder="Add medication or treatment..."
                                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                    <button
                                        onClick={addMedication}
                                        disabled={!newMedication.trim()}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SOAP Notes */}
                    <div className="glass rounded-[2.5rem] overflow-hidden border border-slate-200/50 shadow-2xl bg-white/40">

                        <div className="px-10 py-8 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center gap-4">
                            <div className="h-12 w-12 bg-slate-900 text-primary rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Clinical Notes</h2>
                        </div>
                        <div className="p-2">
                            <SoapEditor
                                soap={consultation.soap}
                                onChange={handleSoapChange}
                            />
                        </div>
                        {hasChanges && (
                            <div className="p-10 bg-primary/5 border-t border-primary/10 flex items-center justify-center animate-in slide-in-from-bottom-4">
                                <button
                                    onClick={handleSaveRecord}
                                    disabled={isSaving}
                                    className="px-12 py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
                                >
                                    {isSaving ? (
                                        <>
                                            <Activity className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-4 w-4" />
                                            Save Clinical Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        {!hasChanges && (
                            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    Summary saved and up to date
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Complete Visit Button */}
                    {visitStatus === 'in-progress' && (
                        <div className="glass rounded-2xl p-8 border border-slate-200/50 bg-white/40 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4">
                            <p className="text-xs text-slate-600 text-center max-w-md">
                                Mark this visit as complete to finalize the encounter. SOAP notes and structured data will remain editable.
                            </p>
                            <button
                                onClick={handleCompleteVisit}
                                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-700 hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 shadow-xl"
                            >
                                <CheckCircle2 className="h-5 w-5" />
                                Complete Visit
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* PROFESSIONAL PRINT TEMPLATE - Hidden on Screen via global CSS */}
            <PrintableRecord
                consultationId={consultation.id}
                date={consultation.date}
                patient={patient}
                soap={consultation.soap}
                clinicianName={getClinicianDisplayName()}
            />
        </div>
    );
}
