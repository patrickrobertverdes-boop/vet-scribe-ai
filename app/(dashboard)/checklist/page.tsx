'use client';

import { Suspense, useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    ListChecks,
    Search,
    AlertCircle,
    Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import { ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AddTaskForm } from '@/components/checklist/add-task-form';

export default function ChecklistPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <ChecklistContent />
        </Suspense>
    );
}

function ChecklistContent() {
    const { user } = useAuth();
    // input, newItemText removed as they are moved to AddTaskForm
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const unsubscribe = firebaseService.subscribeToChecklist(user.uid, (data) => {
            setItems(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleToggleItem = async (itemId: string, completed: boolean) => {
        if (!user) return;
        try {
            await firebaseService.toggleChecklistItem(user.uid, itemId, !completed);
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!user) return;
        try {
            await firebaseService.deleteChecklistItem(user.uid, itemId);
            toast.success('Task removed');
        } catch (error) {
            toast.error('Failed to remove task');
        }
    };

    const filteredItems = items.filter(item =>
        item.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = items.filter(i => !i.completed).length;

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 md:pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-lg bg-cyan-50 dark:bg-transparent dark:border dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-200 dark:border-cyan-500/20">Checklist</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
                        Daily <span className="text-cyan-600 dark:text-cyan-400">Tasks</span>
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground font-medium mt-2">
                        Manage your clinical workflow and personal tasks.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Checklist Area */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass rounded-[1.5rem] border border-border shadow-2xl bg-card overflow-hidden">
                        <div className="p-6 md:p-8 space-y-6">
                            {/* Add Item Form */}
                            <AddTaskForm />

                            {/* Filters & Actions */}
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all">
                                        {pendingCount} Tasks Remaining
                                    </p>
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-cyan-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-[10px] font-bold uppercase tracking-wider focus:bg-background outline-none transition-all w-48"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-3 pt-2">
                                {isLoading ? (
                                    <div className="py-20 text-center animate-pulse">
                                        <ListChecks className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Loading Checklist...</p>
                                    </div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ListChecks className="h-8 w-8 text-muted-foreground opacity-30" />
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No tasks found</p>
                                        <p className="text-xs text-slate-400 mt-2">Add a task above to get started.</p>
                                    </div>
                                ) : (
                                    filteredItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                                                item.completed
                                                    ? "bg-muted/30 border-transparent opacity-60"
                                                    : "bg-muted border-border hover:border-cyan-600/30 hover:shadow-lg"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleToggleItem(item.id, item.completed)}
                                                className={cn(
                                                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    item.completed
                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                        : "border-slate-300 dark:border-slate-600 hover:border-cyan-600"
                                                )}
                                            >
                                                {item.completed && <Check className="h-4 w-4" />}
                                            </button>

                                            <span className={cn(
                                                "flex-1 text-sm font-bold transition-all",
                                                item.completed ? "line-through text-muted-foreground" : "text-foreground"
                                            )}>
                                                {item.text}
                                            </span>

                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="h-8 w-8 flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass rounded-[1.5rem] p-8 border border-border shadow-2xl bg-card">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-6">Productivity Pro</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-transparent dark:border dark:border-emerald-500/20 border border-emerald-100">
                                <div className="h-10 w-10 bg-white dark:bg-transparent dark:border dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Weekly Goal</p>
                                    <p className="text-xs font-bold text-foreground">Clear 50 clinical tasks to unlock senior badge.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-transparent dark:border dark:border-amber-500/20 border border-amber-100">
                                <div className="h-10 w-10 bg-white dark:bg-transparent dark:border dark:border-amber-500/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-amber-600 mb-1">Focus Mode</p>
                                    <p className="text-xs font-bold text-foreground">Don't forget to sync your checklist with your team leader.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
