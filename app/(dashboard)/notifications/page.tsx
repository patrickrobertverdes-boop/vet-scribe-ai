'use client';

import { useState } from 'react';
import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Info,
    MoreHorizontal,
    Trash2,
    Calendar,
    Stethoscope,
    FlaskConical,
    MessageSquare,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        toast.success('Marked as read');
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.success('Notification removed');
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 md:pb-20">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 text-[10px] md:text-[10px] font-bold uppercase tracking-wider border border-cyan-200 dark:border-cyan-800">
                            Updates
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
                        Your <span className="text-cyan-600 dark:text-cyan-400">Alerts</span>
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground font-medium mt-2">
                        Stay updated on important events and messages.
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <button
                        onClick={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            toast.success('All alerts marked as read');
                        }}
                        className="h-12 md:h-12 px-6 md:px-8 bg-cyan-600 dark:bg-cyan-500 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-cyan-600/20"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Mark All Read</span>
                        <span className="sm:hidden">All Read</span>
                    </button>
                    <button className="h-12 md:h-12 w-12 glass border border-border rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all active:scale-95">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-w-4xl">
                <div className="glass rounded-2xl md:rounded-[2rem] border border-border shadow-2xl overflow-hidden bg-card">
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {notifications.length === 0 ? (
                            <div className="py-20 md:py-40 text-center px-4">
                                <div className="h-16 w-16 md:h-20 md:w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-border shadow-inner">
                                    <Bell className="h-8 w-8 md:h-10 md:w-10 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-foreground">All Clear</h3>
                                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto mt-2">No new alerts or notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "px-4 md:px-8 py-6 md:py-8 flex items-start gap-4 md:gap-8 transition-all relative group",
                                        notification.read ? "opacity-70" : "bg-white dark:bg-slate-800/50"
                                    )}
                                >
                                    {!notification.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-600" />
                                    )}

                                    <div className={cn(
                                        "h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500",
                                        notification.type === 'alert' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" :
                                            notification.type === 'info' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" :
                                                notification.type === 'calendar' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" :
                                                    "bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-border"
                                    )}>
                                        <notification.icon className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 md:gap-3 mb-1.5 flex-wrap">
                                            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                                                {notification.category}
                                            </span>
                                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                {notification.time}
                                            </span>
                                        </div>
                                        <h3 className="text-base md:text-lg font-bold text-foreground tracking-tight mb-2 break-words">
                                            {notification.title}
                                        </h3>
                                        <p className="text-sm md:text-sm text-muted-foreground leading-relaxed font-medium break-words">
                                            {notification.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="h-10 w-10 md:h-10 md:w-10 glass rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95 border border-border"
                                            >
                                                <CheckCircle2 className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="h-10 w-10 md:h-10 md:w-10 glass rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95 border border-border"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

