'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AddTaskForm() {
    const { user } = useAuth();
    const [newItemText, setNewItemText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();

    // Auto-focus logic based on URL param
    useEffect(() => {
        if (searchParams.get('focus') === 'true' && inputRef.current) {
            // Small delay to ensure render is complete
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [searchParams]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("You must be logged in to add tasks.");
            return;
        }

        if (!newItemText.trim()) {
            toast.error("Please enter a task description first.");
            inputRef.current?.focus();
            return;
        }

        setIsSubmitting(true);

        try {
            console.log("Submitting new task for user:", user.uid, "Text:", newItemText);
            await firebaseService.addChecklistItem(user.uid, newItemText.trim());
            setNewItemText('');
            toast.success('Task added successfully');

            // Keep focus for rapid entry
            inputRef.current?.focus();
        } catch (error) {
            console.error("Add Task Error Details:", error);
            toast.error('Failed to save task. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleAddItem} className="relative group w-full">
            <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="New Task..."
                disabled={isSubmitting}
                className="w-full h-14 pl-6 pr-20 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-cyan-600/10 focus:bg-background outline-none transition-all placeholder:text-muted-foreground text-foreground disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                    "absolute right-2 top-2 h-10 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
                    isSubmitting ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" : "bg-cyan-600 dark:bg-cyan-500 text-white hover:scale-105 active:scale-95",
                    !newItemText.trim() && !isSubmitting && "opacity-80 hover:opacity-100" // Slightly fade if empty but still clickable
                )}
            >
                {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Plus className="h-4 w-4" />
                )}
                <span>Add</span>
            </button>
        </form>
    );
}
