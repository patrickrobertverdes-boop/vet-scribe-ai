'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
    type: 'user' | 'assistant';
    message: string;
    time: string;
}

type ChatState = {
    isOpen: boolean;
    messages: ChatMessage[];
    isProcessing: boolean;
    toggleOpen: () => void;
    setOpen: (open: boolean) => void;
    addMessage: (msg: ChatMessage) => void;
    clearMessages: () => void;
    setProcessing: (processing: boolean) => void;
};

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            isOpen: false,
            messages: [{
                type: 'assistant',
                message: "Hello! I'm your VetScribe AI Assistant. I can help with scheduling, patient records, SOAP notes, and more. How can I help you today?",
                time: '08:00 AM'
            }],
            isProcessing: false,
            toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
            setOpen: (open) => set({ isOpen: open }),
            addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
            clearMessages: () => set({
                messages: [{
                    type: 'assistant',
                    message: "Chat history cleared. How can I help you now?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]
            }),
            setProcessing: (processing) => set({ isProcessing: processing }),
        }),
        {
            name: 'vetscribe-chat-storage',
        }
    )
);
