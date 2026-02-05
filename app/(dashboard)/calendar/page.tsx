'use client';

import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Clock,
    MapPin,
    AlignLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import { Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    useEffect(() => {
        if (!user) return;
        const unsubscribe = firebaseService.subscribeToAppointments(user.uid, (data) => {
            setAppointments(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const getDayAppointments = (date: Date) => {
        return appointments.filter(apt =>
            isSameDay(new Date(apt.date), date)
        );
    };

    const selectedAppointments = selectedDate ? getDayAppointments(selectedDate) : [];

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [newItem, setNewItem] = useState({
        patientName: '',
        classification: 'Consultation',
        hour: '09',
        minute: '00',
        note: '',
        vector: 'clinic'
    });

    const handleScheduleEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedDate) return;

        try {
            // Construct date string YYYY-MM-DD
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const timeStr = `${newItem.hour}:${newItem.minute}`;

            await firebaseService.addAppointment(user.uid, {
                patientId: 'manual', // or select from list
                patientName: newItem.patientName,
                ownerName: 'Unknown',
                date: dateStr,
                time: timeStr,
                duration: '30 min',
                classification: newItem.classification,
                note: newItem.note,
                vector: newItem.vector as 'clinic' | 'telehealth',
                status: 'confirmed'
            });

            toast.success('Event scheduled successfully');
            setShowScheduleModal(false);
            setNewItem({
                patientName: '',
                classification: 'Consultation',
                hour: '09',
                minute: '00',
                note: '',
                vector: 'clinic'
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule event');
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] border border-border px-2 py-0.5 rounded">
                            Clinical Schedule
                        </span>
                    </div>
                    <h1 className="text-3xl font-serif font-medium text-foreground tracking-tight">
                        Practice <span className="text-primary">Calendar</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={goToToday} className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-border rounded hover:bg-muted transition-all">
                        Today
                    </button>
                    <div className="flex items-center gap-1 border border-border rounded p-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-muted rounded transition-colors">
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-muted rounded transition-colors">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Calendar Grid */}
                <div className="lg:col-span-8 glass rounded-[1.5rem] border border-border shadow-2xl bg-card overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">
                            {format(currentDate, "MMMM yyyy")}
                        </h2>
                    </div>

                    <div className="grid grid-cols-7 border-b border-border bg-muted/40">
                        {weekDays.map(day => (
                            <div key={day} className="py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[120px]">
                        {days.map((day, dayIdx) => {
                            const dayApts = getDayAppointments(day);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "relative border-b border-r border-border/60 p-2 transition-all cursor-pointer hover:bg-muted/30",
                                        !isSameMonth(day, monthStart) && "bg-muted/10 text-muted-foreground/30",
                                        isSelected && "bg-primary/5 shadow-inner inset-shadow",
                                        "group"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={cn(
                                            "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-all",
                                            isToday
                                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            {format(day, dateFormat)}
                                        </span>
                                        {dayApts.length > 0 && (
                                            <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded text-foreground">
                                                {dayApts.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Event Dots / Previews */}
                                    <div className="space-y-1 mt-1">
                                        {dayApts.slice(0, 3).map((apt, i) => (
                                            <div key={i} className="hidden md:block truncate text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                                                {apt.patientName || apt.classification}
                                            </div>
                                        ))}
                                        {dayApts.length > 3 && (
                                            <div className="hidden md:block text-[9px] text-muted-foreground pl-1">
                                                +{dayApts.length - 3} more
                                            </div>
                                        )}
                                        {/* Mobile Dots */}
                                        <div className="md:hidden flex gap-1 justify-center mt-2">
                                            {dayApts.map((_, i) => (
                                                <div key={i} className="h-1 w-1 rounded-full bg-primary" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day Detail Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass rounded-[1.5rem] p-6 border border-border shadow-2xl bg-card h-full min-h-[500px] flex flex-col">
                        <div className="mb-6 pb-6 border-b border-border">
                            <h3 className="text-xl font-serif font-medium text-foreground">
                                {selectedDate ? format(selectedDate, "EEEE, MMMM do") : "Select a Date"}
                            </h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                                {selectedAppointments.length} Scheduled Events
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                            {selectedAppointments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                    <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
                                    <p className="text-sm font-medium text-foreground">No events scheduled</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">
                                        Select a date to view or add details.
                                    </p>
                                </div>
                            ) : (
                                selectedAppointments.map((apt) => (
                                    <div key={apt.id} className="group p-4 rounded-xl border border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{apt.status}</span>
                                            </div>
                                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {apt.time}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-foreground mb-1">{apt.patientName} - {apt.classification}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{apt.note || 'No additional notes provided.'}</p>

                                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                <MapPin className="h-3 w-3" />
                                                {apt.vector || 'Clinic'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-border">
                            <button
                                onClick={() => setShowScheduleModal(true)}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                            >
                                <Plus className="h-4 w-4" />
                                Schedule Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <h3 className="text-sm font-bold uppercase tracking-widest">Schedule Event</h3>
                            <button onClick={() => setShowScheduleModal(false)} className="text-muted-foreground hover:text-foreground">
                                <Plus className="h-5 w-5 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleScheduleEvent} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patient Name / Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.patientName}
                                    onChange={e => setNewItem({ ...newItem, patientName: e.target.value })}
                                    className="w-full h-10 bg-muted border border-border rounded-lg px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="e.g. Bella - Vaccination"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time (Hour)</label>
                                    <select
                                        value={newItem.hour}
                                        onChange={e => setNewItem({ ...newItem, hour: e.target.value })}
                                        className="w-full h-10 bg-muted border border-border rounded-lg px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                            <option key={h} value={h}>{h}:00</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Minute</label>
                                    <select
                                        value={newItem.minute}
                                        onChange={e => setNewItem({ ...newItem, minute: e.target.value })}
                                        className="w-full h-10 bg-muted border border-border rounded-lg px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        {['00', '15', '30', '45'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Classification</label>
                                <select
                                    value={newItem.classification}
                                    onChange={e => setNewItem({ ...newItem, classification: e.target.value })}
                                    className="w-full h-10 bg-muted border border-border rounded-lg px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="Consultation">Consultation</option>
                                    <option value="Surgery">Surgery</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Vaccination">Vaccination</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes</label>
                                <textarea
                                    value={newItem.note}
                                    onChange={e => setNewItem({ ...newItem, note: e.target.value })}
                                    className="w-full h-20 bg-muted border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                                    placeholder="Add any relevant details..."
                                />
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90">
                                    Confirm Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
