'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Clock,
    Plus,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Video,
    MapPin,
    Phone,
    CheckCircle2,
    AlertCircle,
    XCircle,
    MoreVertical,
    Edit,
    Trash2,
    Bell,
    Users,
    Stethoscope,
    Shield,
    Database,
    Zap,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import { Appointment, Patient } from '@/lib/types';

export default function AppointmentsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [view, setView] = useState<'day' | 'week' | 'month'>('day');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);

    const [newApt, setNewApt] = useState<Partial<Appointment>>({
        patientId: '',
        patientName: '',
        ownerName: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: '30 min',
        classification: 'Checkup',
        vector: 'clinic',
        status: 'pending',
        note: ''
    });

    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        const unsubscribe = firebaseService.subscribeToAppointments(user.uid, (data) => {
            setAppointments(data);
            setIsLoading(false);
        });

        firebaseService.getPatients(user.uid).then(res => setPatients(res));

        return () => unsubscribe();
    }, [user]);

    const handleCreateAppointment = async () => {
        if (!user || !newApt.patientId || !newApt.date || !newApt.time) {
            toast.error("Please fill in all clinical parameters.");
            return;
        }

        try {
            const selectedPatient = patients.find(p => p.id === newApt.patientId);
            await firebaseService.addAppointment(user.uid, {
                patientId: newApt.patientId,
                patientName: selectedPatient?.name || 'Unknown',
                ownerName: selectedPatient?.owner || 'Unknown',
                date: newApt.date,
                time: newApt.time,
                duration: newApt.duration || '30 min',
                classification: newApt.classification || 'Checkup',
                note: newApt.note || '',
                vector: newApt.vector || 'clinic',
                status: newApt.status as any || 'pending'
            });
            setShowNewAppointment(false);
            toast.success("Appointment synchronized with clinic ledger.");
        } catch (error) {
            toast.error("Failed to commit appointment to ledger.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (confirm("De-authorize this appointment record?")) {
            await firebaseService.deleteAppointment(user.uid, id);
            toast.success("Record purged from temporal schedule.");
        }
    };

    const analytics = [
        { label: 'Today\'s Census', value: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Confirmed Appts', value: appointments.filter(a => a.status === 'confirmed').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending Review', value: appointments.filter(a => a.status === 'pending').length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'High Priority', value: appointments.filter(a => a.status === 'urgent').length.toString(), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'urgent': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="min-h-dvh bg-mesh space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Operational Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200/50">
                            Appointment Schedule
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">
                        Daily <span className="text-primary italic">Appointments</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Coordinate patient visits and manage clinic schedule efficiency.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="glass rounded-xl p-1 flex items-center gap-1 bg-slate-900/5 border border-slate-200/50">
                        {(['day', 'week', 'month'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                    view === v
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            toast.success('Opening schedule...');
                            setShowNewAppointment(true);
                        }}
                        className="h-12 px-6 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all flex items-center gap-2 active:translate-y-0"
                    >
                        <Plus className="h-4 w-4" />
                        New Appointment
                    </button>
                </div>
            </header>

            {/* Performance Grid */}
            <div className="grid gap-6 md:grid-cols-4">
                {analytics.map((stat, i) => (
                    <div
                        key={i}
                        className="glass rounded-xl p-6 hover:bg-white transition-all hover:-translate-y-1 border-none shadow-xl border border-transparent hover:border-slate-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner",
                                stat.bg, stat.color
                            )}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Navigation Ledger */}
            <div className="glass rounded-xl p-6 border-none shadow-xl bg-white/60">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <button className="h-10 w-10 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary transition-all active:scale-95">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tuesday, Jan 19, 2026</h2>
                            <button className="h-10 w-10 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary transition-all active:scale-95">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <button onClick={() => toast.success('Synchronizing with real-time temporal clock.')} className="px-5 py-2 glass border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                        Sync Today
                    </button>
                </div>
            </div>

            {/* Shift Deployment Schedule */}
            <div className="glass rounded-[1.5rem] overflow-hidden border-none shadow-2xl bg-white/40">
                <div className="px-8 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Today's Appointments</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{appointments.length} Confirmed Appointments</p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center bg-white/40">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing temporal records...</p>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="py-32 text-center bg-white/40">
                            <Calendar className="h-12 w-12 text-slate-100 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Daily Schedule Empty</p>
                            <p className="text-xs text-slate-300 dark:text-slate-600 mt-2">No appointments scheduled for this temporal coordinate.</p>
                        </div>
                    ) : appointments.map((apt) => (
                        <div
                            key={apt.id}
                            className="group px-8 py-8 hover:bg-white transition-all cursor-pointer relative"
                        >
                            <div className="flex items-center gap-10">
                                {/* Temporal Slot */}
                                <div className="w-24 shrink-0">
                                    <p className="text-2xl font-bold text-slate-900 tracking-tighter leading-none mb-1">{apt.time}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{apt.duration}</p>
                                </div>

                                {/* Patient Details */}
                                <div className="flex-1 flex items-center gap-8">
                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
                                        <Stethoscope className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-900 text-lg uppercase tracking-tight">{apt.patientName}</h3>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Owner: {apt.ownerName}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{apt.classification}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Note: {apt.note}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vector & Operational Status */}
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center gap-1">
                                        {apt.vector === 'telehealth' ? (
                                            <Video className="h-4 w-4 text-blue-500" />
                                        ) : (
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                        )}
                                        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">{apt.vector}</span>
                                    </div>

                                    <div className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border w-28 text-center",
                                        getStatusTheme(apt.status)
                                    )}>
                                        {apt.status}
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); toast.success('Modifying operational record...'); }} className="h-10 w-10 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(apt.id); }} className="h-10 w-10 glass border border-slate-200 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-all">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); toast.success('Accessing extended telemetry for ' + apt.id); }} className="h-10 w-10 glass border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tactical Briefing Actions */}
            <div className="grid gap-6 md:grid-cols-3">
                {[
                    {
                        title: 'Appointment Reminders',
                        description: 'Send automated reminders for tomorrow\'s appointments.',
                        icon: Bell,
                        action: 'Send Alerts',
                        color: 'text-blue-600', bg: 'bg-blue-50',
                        href: '/notifications'
                    },
                    {
                        title: 'Waitlist Management',
                        description: 'Manage patients currently on the practice waitlist.',
                        icon: Users,
                        action: 'View Waitlist',
                        color: 'text-purple-600', bg: 'bg-purple-50',
                        href: '/patients'
                    },
                    {
                        title: 'Schedule Optimization',
                        description: 'AI-driven suggestions for improving schedule efficiency.',
                        icon: Zap,
                        action: 'Apply Recommendations',
                        color: 'text-emerald-600', bg: 'bg-emerald-50',
                        href: '/analytics'
                    }
                ].map((action, i) => (
                    <div
                        key={i}
                        onClick={() => router.push(action.href)}
                        className="glass rounded-xl p-8 hover:bg-white transition-all hover:-translate-y-1 border-none shadow-xl border border-transparent hover:border-slate-100 group cursor-pointer"
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-slate-100",
                            action.bg, action.color
                        )}>
                            <action.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-3 text-lg">{action.title}</h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">{action.description}</p>
                        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                            {action.action} <ArrowUpRight className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Engagement Authorization Interface */}
            {showNewAppointment && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="glass rounded-[1.5rem] p-10 max-w-xl w-full border-none shadow-2xl animate-in zoom-in-95 duration-300 bg-white">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
                                <Plus className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">New Appointment</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manual Appointment Entry</p>
                            </div>
                        </div>

                        <div className="space-y-6 mb-10 h-[400px] overflow-y-auto px-1">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Patient Selection</label>
                                    <select
                                        value={newApt.patientId}
                                        onChange={(e) => setNewApt({ ...newApt, patientId: e.target.value })}
                                        className="w-full h-12 glass rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                                    >
                                        <option value="">Select Patient...</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.species}) - {p.owner}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                                        <input
                                            type="date"
                                            value={newApt.date}
                                            onChange={(e) => setNewApt({ ...newApt, date: e.target.value })}
                                            className="w-full h-12 glass rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Time</label>
                                        <input
                                            type="time"
                                            value={newApt.time}
                                            onChange={(e) => setNewApt({ ...newApt, time: e.target.value })}
                                            className="w-full h-12 glass rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Duration</label>
                                        <select
                                            value={newApt.duration}
                                            onChange={(e) => setNewApt({ ...newApt, duration: e.target.value })}
                                            className="w-full h-12 glass rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                                        >
                                            <option>15 min</option>
                                            <option>30 min</option>
                                            <option>45 min</option>
                                            <option>60 min</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Type</label>
                                        <select
                                            value={newApt.classification}
                                            onChange={(e) => setNewApt({ ...newApt, classification: e.target.value })}
                                            className="w-full h-12 glass rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                                        >
                                            <option>Checkup</option>
                                            <option>Vaccination</option>
                                            <option>Surgery</option>
                                            <option>Emergency</option>
                                            <option>Follow-up</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Vector</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setNewApt({ ...newApt, vector: 'clinic' })}
                                                className={cn("flex-1 h-12 rounded-xl text-xs font-bold uppercase transition-all border", newApt.vector === 'clinic' ? "bg-primary text-primary-foreground border-slate-900" : "bg-white text-slate-400 border-slate-200")}
                                            >Clinic</button>
                                            <button
                                                onClick={() => setNewApt({ ...newApt, vector: 'telehealth' })}
                                                className={cn("flex-1 h-12 rounded-xl text-xs font-bold uppercase transition-all border", newApt.vector === 'telehealth' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-200")}
                                            >Telehealth</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                                        <select
                                            value={newApt.status}
                                            onChange={(e) => setNewApt({ ...newApt, status: e.target.value as any })}
                                            className="w-full h-12 glass rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Operational Notes</label>
                                    <textarea
                                        value={newApt.note}
                                        onChange={(e) => setNewApt({ ...newApt, note: e.target.value })}
                                        placeholder="Clinical notes or reason for visit..."
                                        className="w-full h-24 glass rounded-xl border border-slate-200 p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setShowNewAppointment(false)}
                                className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAppointment}
                                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-xl transition-all active:translate-y-0"
                            >
                                Confirm Appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

