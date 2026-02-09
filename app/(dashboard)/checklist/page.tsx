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
    Check,
    Loader2
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
        <div className="space-y-6 sm:space-y-10 pb-20 w-full mx-auto px-1 sm:px-0">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className="space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-foreground tracking-tighter leading-tight">
                        Daily Workflow Checklist
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-2xl">
                        Monitor and manage surgical protocols and clinical tasks with real-time synchronization.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Checklist Area */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="surface p-8">
                        <div className="space-y-8">
                            {/* Add Item Form */}
                            <AddTaskForm />

                            {/* Filters & Actions */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black/10 pb-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-foreground">
                                        Protocol Registry
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        {pendingCount} Tasks Awaiting Completion
                                    </p>
                                </div>
                                <div className="search-container w-full md:max-w-xs">
                                    <Search className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search protocol index..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="py-20 text-center animate-pulse">
                                        <Loader2 className="h-8 w-8 text-black dark:text-white mx-auto animate-spin" />
                                        <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mt-6">Secure Sync Active...</p>
                                    </div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="py-20 text-center surface bg-muted/30 border-dashed border-black/20">
                                        <div className="h-16 w-16 bg-white border border-black rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ListChecks className="h-6 w-6 text-black" />
                                        </div>
                                        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Protocol Clear</p>
                                        <p className="text-xs text-muted-foreground mt-2">Initialize new tasks to track clinical progression.</p>
                                    </div>
                                ) : (
                                    filteredItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "group flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300",
                                                item.completed
                                                    ? "bg-muted/50 border-transparent opacity-50"
                                                    : "bg-white border-primary/20 hover:border-primary hover:shadow-xl hover:-translate-y-0.5"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleToggleItem(item.id, item.completed)}
                                                className={cn(
                                                    "h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all",
                                                    item.completed
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-primary/40 hover:border-primary hover:scale-110"
                                                )}
                                            >
                                                {item.completed && <Check className="h-4 w-4 stroke-[3px]" />}
                                            </button>

                                            <span className={cn(
                                                "flex-1 text-base font-bold transition-all",
                                                item.completed ? "line-through text-muted-foreground" : "text-foreground"
                                            )}>
                                                {item.text}
                                            </span>

                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="icon-square h-9 w-9 opacity-40 lg:opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shrink-0"
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
                <div className="lg:col-span-4 space-y-8">
                    <div className="surface p-8 space-y-8">
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-black pb-4">Task Analytics</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-5 p-5 rounded-2xl bg-muted border border-black/5">
                                <div className="icon-square bg-white">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-foreground mb-1">Weekly Standard</p>
                                    <p className="text-sm font-bold text-muted-foreground">Maintained 92% efficiency across surgical protocols.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5 p-5 rounded-2xl bg-muted border border-black/5">
                                <div className="icon-square bg-white">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-foreground mb-1">Protocol Reminder</p>
                                    <p className="text-sm font-bold text-muted-foreground">Sync all offline documentation before system standby.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
