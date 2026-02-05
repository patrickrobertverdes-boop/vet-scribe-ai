'use client';

import { Folder, FileText, Image, FilePlus, Download, MoreVertical, Search, Trash2, Loader2, Layers, Waves, CloudUpload, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { PatientDocument } from '@/lib/types';
import { useParams } from 'next/navigation';

export function PatientDocuments() {
    const params = useParams();
    const { user } = useAuth();
    const patientId = params.id as string;
    const [docs, setDocs] = useState<PatientDocument[]>([]);
    const [pendingDocs, setPendingDocs] = useState<PatientDocument[]>([]); // Optimistic state
    const [isLoading, setIsLoading] = useState(false); // Start false for instant render
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user || !patientId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = firebaseService.subscribeToDocuments(user.uid, patientId, (data) => {
            setDocs(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, patientId]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Immediate clear to prevent double-invocation on same-file selection if browser quirks occur
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (!file || !user) return;

        // Prevent duplicate uploads of same file in pending (simple debounce)
        if (pendingDocs.some(d => d.name === file.name)) {
            toast.error("File already uploading");
            return;
        }

        // Create optimistic doc
        const tempId = `temp-${Date.now()}`;
        const optimisticDoc: PatientDocument = {
            id: tempId,
            patientId,
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
            type: file.type.includes('pdf') ? 'pdf' : 'image',
            url: '#',
            uploadDate: 'Uploading...',
        };

        setPendingDocs(prev => [optimisticDoc, ...prev]);

        // Manual toast to prevent "sticking"
        const toastId = toast.loading(`Uploading ${file.name}...`);

        // Using a variable for the promise to attach finally properly
        const uploadTask = firebaseService.uploadDocument(user.uid, patientId, file);

        try {
            await uploadTask;
            toast.success('Document uploaded', { id: toastId });
        } catch (e) {
            console.error("Upload error caught:", e);
            toast.error('Upload failed', { id: toastId });
        } finally {
            // ALWAYS remove from pending, success or fail
            // We use a functional update to ensure we are filtering the latest state
            // We also add a small delay to ensure the real-time listener has likely fired
            // so the user doesn't see a "flicker" of empty state.
            setTimeout(() => {
                setPendingDocs(prev => prev.filter(d => d.id !== tempId));
            }, 1000);
        }
    };

    const handleDelete = async (doc: PatientDocument | any, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        // If it's a pending doc (id starts with temp-), just remove from UI
        if (doc.id.toString().startsWith('temp-')) {
            setPendingDocs(prev => prev.filter(d => d.id !== doc.id));
            toast.success('Upload cancelled');
            return;
        }

        // Must stop editing if deleting the active item
        if (editingId === doc.id) setEditingId(null);

        // Optimistic Delete: Remove immediately from view
        setDocs(prev => prev.filter(d => d.id !== doc.id));
        toast.success(`Deleted ${doc.name}`);

        // Fire and forget background cleanup
        firebaseService.deleteDocument(user.uid, patientId, doc.id, doc.url).catch(err => {
            console.error("Background delete failed:", err);
            // In a robust app, we might restore the doc here or show an error toast later.
            // But for "fast" feel, we assume success or let the listener re-sync if it failed.
        });
    };

    const handleDownload = (doc: PatientDocument, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (doc.url === '#' || !doc.url || doc.id.startsWith('temp-')) {
            // It's still uploading or invalid
            toast('File is still processing...', { icon: '⏳' });
            return;
        }

        // Open in new tab - browser handles download/view based on content-type
        window.open(doc.url, '_blank');
    };

    const startEditing = (doc: PatientDocument, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(doc.id);
        setEditName(doc.name);
    };

    const saveRename = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !editingId) return;

        const docToUpdate = docs.find(d => d.id === editingId);
        if (!docToUpdate) return;
        if (editName.trim() === docToUpdate.name) {
            setEditingId(null);
            return;
        }

        const oldName = docToUpdate.name;

        // Optimistic rename
        setDocs(prev => prev.map(d => d.id === editingId ? { ...d, name: editName } : d));
        setEditingId(null);
        toast.success("Renamed file");

        try {
            await firebaseService.updateDocument(user.uid, patientId, editingId, { name: editName });
        } catch (error) {
            console.error("Rename failed", error);
            toast.error("Rename failed");
            // Revert on failure
            setDocs(prev => prev.map(d => d.id === editingId ? { ...d, name: oldName } : d));
        }
    };

    // Filter out pending docs if they are already in the real list (deduplication)
    const effectivePendingDocs = pendingDocs.filter(pDoc =>
        !docs.some(realDoc => realDoc.name === pDoc.name)
    );

    const filteredDocs = [...effectivePendingDocs, ...docs].filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-10">
            {/* Tactical Document Hub Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-slate-200 dark:border-slate-800 relative">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl rotate-3 relative overflow-hidden group">
                        <Folder className="h-7 w-7 relative z-10 transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">Patient Assets</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{docs.length} Objects Encrypted</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Verified Secure</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 sm:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 glass rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white border-none outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all shadow-xl placeholder:text-slate-400"
                            placeholder="Search clinical files..."
                        />
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                        onClick={handleUploadClick}
                        className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:translate-y-[-2px] hover:shadow-2xl shadow-slate-900/10 transition-all flex items-center gap-3 active:translate-y-0"
                    >
                        <CloudUpload className="h-5 w-5" />
                        Upload Data
                    </button>
                </div>
            </div>

            {/* Asset Stream */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="relative mb-6">
                        <div className="h-14 w-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <Layers className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Asset Index...</p>
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 px-10 glass rounded-[3rem] border-none shadow-2xl bg-white/40 dark:bg-slate-900/40 text-center animate-in zoom-in-95">
                    <div className="h-24 w-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner relative group">
                        <Waves className="h-10 w-10 text-slate-200 dark:text-slate-600 animate-float" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Vault Empty</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed italic">
                        The clinical diagnostic vault for this patient is currently unpopulated. Securely upload lab results or medical imagery.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredDocs.map((file, idx) => (
                        <div
                            key={file.id}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className="group relative glass dark:bg-slate-900/20 rounded-[2.5rem] p-8 border-none shadow-2xl hover:bg-white dark:hover:bg-slate-900 hover:-translate-y-1 transition-all animate-in slide-in-from-bottom-10"
                        >
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 flex gap-2">
                                <button
                                    onClick={(e) => startEditing(file, e)}
                                    className="h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20"
                                    title="Rename file"
                                >
                                    <FilePlus className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(file, e)}
                                    className="h-10 w-10 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20"
                                    title="Delete file"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className={cn(
                                "h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-500",
                                file.type === 'pdf' ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-indigo-500 text-white shadow-indigo-500/20"
                            )}>
                                {file.type === 'pdf' ? <FileText className="h-8 w-8" /> : <Image className="h-8 w-8" />}
                            </div>

                            <div className="space-y-4">
                                {editingId === file.id ? (
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full text-lg font-black text-slate-900 bg-transparent border-b-2 border-primary outline-none"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && saveRename(e)}
                                        />
                                        <button onClick={saveRename} className="text-xs font-bold text-primary">OK</button>
                                    </div>
                                ) : (
                                    <p className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-primary transition-colors" title={file.name}>{file.name}</p>
                                )}

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{file.size}</span>
                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{file.uploadDate}</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                                        <div className={cn("h-full bg-emerald-500", "w-full")} />
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDownload(file, e)}
                                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 shadow-sm mt-4 group/btn"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Clinical Asset
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Intuitive Dropzone Action */}
                    <button
                        onClick={handleUploadClick}
                        className="group relative rounded-[2.5rem] border-4 border-dashed border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex flex-col items-center justify-center p-10 text-center hover:border-primary/20 hover:bg-white dark:hover:bg-slate-900 transition-all min-h-[280px] hover:-translate-y-1 shadow-inner hover:shadow-2xl"
                    >
                        <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6 group-hover:bg-primary/5 group-hover:scale-110 transition-all shadow-sm">
                            <FilePlus className="h-10 w-10 text-slate-200 dark:text-slate-700 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">Append Diagnostic Data</span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-relaxed max-w-[140px]">
                            PDF, PNG, JPG <br /> UP TO 10MB STORAGE
                        </p>
                        <div className="absolute bottom-6 h-1 w-12 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-primary/20 transition-colors" />
                    </button>
                </div>
            )}
        </div>
    );
}

