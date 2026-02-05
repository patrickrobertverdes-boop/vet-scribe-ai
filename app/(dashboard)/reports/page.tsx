'use client';

import {
    FileText,
    Download,
    Calendar,
    Filter,
    PieChart,
    BarChart3,
    TrendingUp,
    Shield,
    Database,
    Binary,
    Zap,
    History,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const reports = [
        { id: 'RPT-001', name: 'Clinical Volume Analysis', type: 'PDF', date: 'Jan 15, 2026', size: '2.4 MB', category: 'Analytics' },
        { id: 'RPT-002', name: 'Pharmacy Audit Log: Q1', type: 'XLSX', date: 'Jan 12, 2026', size: '1.1 MB', category: 'Pharmacy' },
        { id: 'RPT-003', name: 'Patient Record Export (Master)', type: 'PDF', date: 'Jan 08, 2026', size: '14.8 MB', category: 'Records' },
        { id: 'RPT-004', name: 'Lab Result Summary: 2025', type: 'DOCX', date: 'Dec 28, 2025', size: '3.2 MB', category: 'Diagnostics' },
        { id: 'RPT-005', name: 'System Performance Metrics', type: 'JSON', date: 'Jan 18, 2026', size: '0.5 MB', category: 'System' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200/50">
                            Practice Documentation Hub
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight leading-none">
                        Clinical <span className="text-primary italic">Reports</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                        Access generated clinical insights, audit logs, and medical record exports.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toast.success('Initializing multiphasic report generation...')}
                        className="h-12 px-8 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all flex items-center gap-2 active:translate-y-0 shadow-lg"
                    >
                        <PieChart className="h-4 w-4" />
                        Generate New Report
                    </button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { label: 'Archived Documents', value: '452', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Reports Generated', value: '28', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Data Integrity', value: '100%', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                ].map((stat, i) => (
                    <div key={i} className="glass rounded-2xl p-6 border-none shadow-xl bg-card/40">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Reports List */}
            <div className="glass rounded-[2rem] border-none shadow-2xl overflow-hidden bg-card/40">
                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <History className="h-6 w-6 text-primary" />
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Recent Documents</h2>
                    </div>
                    <div className="flex items-center gap-4 border border-border rounded-xl px-4 py-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Filter reports..." className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reports.map((report) => (
                        <div key={report.id} className="px-10 py-8 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-8">
                                <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-foreground tracking-tight uppercase leading-none">{report.name}</h3>
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-bold uppercase tracking-widest rounded border border-slate-200 dark:border-slate-600">{report.type}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>ID: {report.id}</span>
                                        <span>•</span>
                                        <span>Generated: {report.date}</span>
                                        <span>•</span>
                                        <span>Size: {report.size}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.success(`Downloading ${report.name}...`);
                                }}
                                className="h-12 w-12 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-95 group-hover:bg-primary/5"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

