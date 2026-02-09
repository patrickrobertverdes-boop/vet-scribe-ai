'use client';

import {
    FileText,
    Search,
    Clock,
    Activity,
    ArrowUpRight,
    PlusCircle,
    Shield,
    Database,
    Binary,
    Zap,
    Layers,
    Download
} from 'lucide-react';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';
import { Consultation, Patient, SoapNote } from '@/lib/types';
import { PrintableRecord } from '@/components/patient/printable-record';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function HistoryPage() {
    const { user } = useAuth();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingRecord, setDownloadingRecord] = useState<{ consultation: Consultation, patient?: Patient } | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        // FAIL-FAST: 8s timeout
        const timer = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
                toast.error("Database sync slow...");
            }
        }, 8000);

        // CACHING
        try {
            const cached = localStorage.getItem(`history_${user.uid}`);
            if (cached && consultations.length === 0) {
                setConsultations(JSON.parse(cached));
                setIsLoading(false);
            }
        } catch (e) { }

        setIsLoading(true);
        // Subscribe to SUMMARY collection
        const unsubscribe = firebaseService.subscribeToConsultations(user.uid, (data) => {
            setConsultations(data);
            setIsLoading(false);
            // Cache summary for instant revisit
            try {
                localStorage.setItem(`history_${user.uid}`, JSON.stringify(data.slice(0, 5)));
            } catch (e) { }
            clearTimeout(timer);
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [user]);

    const loadMore = async () => {
        if (!user || isPaginating || !hasMore) return;
        setIsPaginating(true);
        const result = await firebaseService.getConsultations(user.uid, undefined, lastDoc);
        if (result.consultations.length < 25) setHasMore(false);
        setConsultations(prev => [...prev, ...result.consultations]);
        setLastDoc(result.lastDoc);
        setIsPaginating(false);
    };

    const filtered = consultations.filter(c =>
        (c.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.patientId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.soapPreview?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const handleDownloadIndividual = async (c: Consultation) => {
        const toastId = toast.loading(`Synthesizing report for ${c.patientName || 'Subject'}...`);

        try {
            // Find patient data for headers (Consultation might have summary, but patient has full details)
            let patientData = await firebaseService.getPatient(user!.uid, c.patientId);
            if (!patientData) {
                // Fallback patient object if original doc missing
                patientData = {
                    id: c.patientId,
                    name: c.patientName || 'Unknown Patient',
                    species: 'Other',
                    breed: 'Unknown',
                    owner: 'Unknown',
                    age: 0, age_months: 0, weight: 0, image: '',
                    allergies: [], medications: [], historySummary: '', status: 'Active', lastVisit: ''
                };
            }

            setDownloadingRecord({ consultation: c, patient: patientData });

            // Wait for DOM to render the printable-record
            await new Promise(r => setTimeout(r, 100));

            const { fixHtml2CanvasCSS } = await import('@/lib/utils');
            fixHtml2CanvasCSS();

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
            const fileName = `Clinical_Record_${(c.patientName || 'Subject').replace(/\s+/g, '_')}_${new Date(c.date).toISOString().split('T')[0]}.pdf`;

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
                    text: `Medical documentation for ${c.patientName || 'Subject'}`,
                    url: result.uri,
                });
                toast.success("Medical report exported", { id: toastId });
            } else {
                pdf.save(fileName);
                toast.success("Medical report exported", { id: toastId });
            }
        } catch (error: any) {
            console.error("PDF generation failed:", error);
            toast.error("Export failed: " + error.message, { id: toastId });
        } finally {
            setDownloadingRecord(null);
        }
    };

    const handleExport = () => {
        if (filtered.length === 0) {
            toast.error("No records to export.");
            return;
        }

        try {
            // CSV Headers
            const headers = [
                "Date",
                "Patient Name",
                "Patient ID",
                "Status",
                "Subjective",
                "Objective",
                "Assessment",
                "Plan",
                "Full Transcript"
            ];

            // Helper to escape CSV values (wrap in quotes, double up existing quotes)
            const escapeCSV = (val: any) => {
                if (val === null || val === undefined) return '""';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            };

            // Generate rows
            const rows = filtered.map(c => [
                new Date(c.date).toLocaleString(),
                c.patientName || 'Unknown',
                c.patientId,
                c.status,
                c.soap?.subjective || '',
                c.soap?.objective || '',
                c.soap?.assessment || '',
                c.soap?.plan || '',
                c.transcript || ''
            ]);

            // Combine into CSV string
            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(escapeCSV).join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const fileName = `vetscribe_records_${new Date().toISOString().split('T')[0]}.csv`;

            import('@capacitor/core').then(async ({ Capacitor }) => {
                if (Capacitor.isNativePlatform()) {
                    try {
                        const { Filesystem, Directory } = await import('@capacitor/filesystem');
                        const { Share } = await import('@capacitor/share');

                        const text = await blob.text();
                        const result = await Filesystem.writeFile({
                            path: fileName,
                            data: text,
                            directory: Directory.Cache,
                            encoding: 'utf8' as any
                        });

                        await Share.share({
                            title: 'Exported Records',
                            text: 'Clinical Encounter Export',
                            url: result.uri,
                            dialogTitle: 'Save Clinical Export'
                        });
                        toast.success("Records ready for sharing.");
                    } catch (e: any) {
                        console.error("Mobile export failed", e);
                        toast.error("Mobile export failed: " + e.message);
                    }
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("Records exported as CSV");
                }
            });
        } catch (error: any) {
            console.error("Export failed:", error);
            toast.error("Export failed: " + error.message);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* Encounter History Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-serif font-bold text-foreground tracking-tighter">
                        Encounter History
                    </h1>
                    <p className="text-lg text-muted-foreground mt-3 font-normal">
                        System inventory of <span className="text-foreground font-bold">{consultations.length} clinical sessions</span> and diagnostic evaluations.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExport}
                        className="h-12 px-8 border border-black rounded-xl text-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => router.push('/record')}
                        className="h-12 px-8 bg-primary text-primary-foreground rounded-xl font-bold text-[10px] uppercase tracking-widest hover:translate-y-[-2px] transition-all active:scale-95 flex items-center gap-3 shadow-lg"
                    >
                        <PlusCircle className="h-5 w-5" /> Initialize Session
                    </button>
                </div>
            </div>

            {/* Search Records */}
            <div className="search-container">
                <Search className="search-icon" />
                <input
                    type="text"
                    placeholder="Search logs by patient name, identifier, or diagnostic phrase..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input h-16 text-lg"
                />
            </div>

            {/* Encounter History */}
            <div className="space-y-8">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
                        <p className="text-sm font-medium text-muted-foreground">Loading records...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 glass rounded-3xl text-center border border-border shadow-xl bg-card">
                        <div className="h-20 w-20 bg-muted border border-border rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                            <Activity className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No History Yet</h3>
                        <p className="text-muted-foreground font-medium mt-2 max-w-md mx-auto">
                            Start a new consultation to create your first patient record.
                        </p>
                        <button
                            onClick={() => router.push('/record')}
                            className="mt-6 h-11 px-6 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95"
                        >
                            Start Recording
                        </button>
                    </div>
                ) : (
                    filtered.map((item, idx) => (
                        <div
                            key={item.id}
                            className="glass rounded-xl p-6 sm:p-10 border border-border shadow-xl hover:shadow-2xl transition-all group cursor-pointer animate-in slide-in-from-bottom-8 bg-card"
                            onClick={() => router.push(`/consultations/${item.id}`)}
                        >
                            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
                                {/* Patient Details */}
                                <div className="lg:w-1/4 flex flex-col items-center lg:items-start text-center lg:text-left border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-12">
                                    <div className="h-16 w-16 sm:h-24 sm:w-24 bg-muted border border-border rounded-2xl shadow-inner flex items-center justify-center text-4xl mb-4 sm:mb-8 group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                                        {item.patientImage ? (
                                            (item.patientImage.startsWith('http') || item.patientImage.startsWith('data:')) ? (
                                                <img src={item.patientImage} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-4xl">{item.patientImage}</span>
                                            )
                                        ) : (
                                            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-none mb-3 group-hover:text-primary transition-colors uppercase">
                                        {item.patientName || `PATIENT: ${item.patientId.slice(0, 8)}`}
                                    </h3>
                                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20" />
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Encounter Verified</span>
                                    </div>
                                    <div className="space-y-4 w-full hidden lg:block">
                                        <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest pb-3 border-b border-border">
                                            <span>Date & Time</span>
                                            <span className="text-foreground">{new Date(item.date).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest pb-3 border-b border-border">
                                            <span>Clinician</span>
                                            <span className="text-foreground font-bold">{user?.displayName || 'Authorized User'}</span>
                                        </div>

                                    </div>
                                </div>

                                {/* Record Summary */}
                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-[9px] font-bold tracking-[0.2em] uppercase shadow-lg">
                                            SOAP Note Summary
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadIndividual(item);
                                                }}
                                                className="h-8 w-8 flex items-center justify-center border border-divider rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-all active:scale-90"
                                                title="Download PDF"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground"><FileText className="h-4 w-4" /> SOAP ID: {item.id.slice(-4)}</div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground"><Clock className="h-4 w-4" /> Cloud Synced</div>

                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4 p-8 glass border border-border rounded-xl bg-muted/50 group-hover:bg-card transition-all shadow-md">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap className="h-3.5 w-3.5 text-primary" />
                                                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Clinical Narrative</p>
                                            </div>
                                            <p className="text-sm font-bold text-foreground leading-relaxed italic line-clamp-3 tracking-tight">
                                                "{item.soapPreview || 'No preview available.'}"
                                            </p>
                                        </div>
                                        <div className="space-y-4 p-8 glass border border-border rounded-xl bg-muted/50 group-hover:bg-card transition-all shadow-md">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Binary className="h-3.5 w-3.5 text-emerald-500" />
                                                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Status</p>
                                            </div>
                                            <p className="text-sm font-bold text-foreground leading-relaxed italic line-clamp-3 tracking-tight text-center uppercase">
                                                Current Engagement: {item.status}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-muted border border-border rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                                <Database className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Record ID</p>
                                                <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">LOG-REF-{item.id.slice(0, 12)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/consultations/${item.id}`);
                                            }}
                                            className="h-11 px-8 glass border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-xl flex items-center gap-3 active:scale-95 group/btn"
                                        >
                                            View Full Record <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Load More Records */}
                {consultations.length >= 25 && hasMore && (
                    <div className="py-10 flex justify-center">
                        <button
                            onClick={loadMore}
                            disabled={isPaginating}
                            className="h-14 px-12 glass border border-border rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95 shadow-xl"
                        >
                            {isPaginating ? (
                                <>
                                    <Activity className="h-4 w-4 animate-spin text-primary" />
                                    Accessing Archives...
                                </>
                            ) : (
                                <>
                                    <Layers className="h-4 w-4" />
                                    Fetch Earlier Records
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
            {/* Hidden printable record for PDF generation */}
            {downloadingRecord && (
                <PrintableRecord
                    date={downloadingRecord.consultation.date}
                    patient={downloadingRecord.patient!}
                    soap={downloadingRecord.consultation.soap}
                    clinicianName={user?.displayName || user?.email?.split('@')[0] || 'Authorized Clinician'}
                    consultationId={downloadingRecord.consultation.id}
                />
            )}
        </div>
    );
}

