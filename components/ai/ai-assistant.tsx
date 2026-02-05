'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Mic,
    X,
    Sparkles,
    Send,
    Volume2,
    VolumeX,
    Brain,
    MessageSquare,
    Calendar,
    Users,
    FileText,
    Search,
    Trash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithGemini } from '@/lib/gemini-client';
import toast from 'react-hot-toast';
import { useDesignStore } from '@/lib/design-store';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';
import { useChatStore, ChatMessage } from '@/lib/chat-store';

export function AIAssistant() {
    const { theme, clinicalModel } = useDesignStore();
    const { isOpen, setOpen, messages, addMessage, isProcessing, setProcessing, clearMessages } = useChatStore();

    // Hydration check
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const [patientContext, setPatientContext] = useState<string>('');

    // Fetch brief context on mount/open
    useEffect(() => {
        if (isOpen && user) {
            const fetchContext = async () => {
                try {
                    const patients = await firebaseService.getPatients(user.uid);
                    const summary = patients.map(p => `- ${p.name} (${p.species}, ${p.breed}, ${p.age}y): Owner ${p.owner}`).join('\n');
                    setPatientContext(`Authorized Patient List:\n${summary}`);
                } catch (e) {
                    console.error("Failed to load AI context", e);
                }
            };
            fetchContext();
        }
    }, [isOpen, user]);

    // Ensure smooth scroll after new messages
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            const container = scrollRef.current;
            // Immediate scroll for responsiveness
            container.scrollTop = container.scrollHeight;

            // Delayed scroll for layout shifts
            setTimeout(() => {
                if (container) container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [messages, isProcessing, isOpen]);

    // Updated send button styling for cool look
    const sendButtonClass = cn(
        "h-12 w-12",
        "bg-primary dark:bg-slate-800",
        "text-white",
        "rounded-2xl flex items-center justify-center",
        "hover:scale-105 transition-transform",
        "shadow-lg"
    );

    const quickCommands = [
        { icon: Calendar, label: 'Schedule appointment', command: 'How do I schedule an appointment?' },
        { icon: Users, label: 'Find patient', command: 'How do I find a patient?' },
        { icon: FileText, label: 'Create SOAP note', command: 'How do I create a SOAP note?' },
        { icon: Search, label: 'Search App FAQ', command: 'What can you help me with?' },
    ];

    const handleVoiceToggle = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript;
            setTranscript(text);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isProcessing) return;

        const userMsg: ChatMessage = {
            type: 'user',
            message: message.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        addMessage(userMsg);
        setTranscript('');
        setProcessing(true);

        try {
            // Find the first user message to ensure history starts with 'user' as required by Gemini
            const contextMessages = messages.slice(-10);
            const firstUserIndex = contextMessages.findIndex(m => m.type === 'user');
            const validHistoryMessages = firstUserIndex !== -1 ? contextMessages.slice(firstUserIndex) : [];

            const history = validHistoryMessages.map(m => ({
                role: m.type === 'user' ? 'user' : 'model',
                parts: [m.message]
            }));

            const responseText = await chatWithGemini(userMsg.message, history, clinicalModel, patientContext);

            const aiMsg: ChatMessage = {
                type: 'assistant',
                message: responseText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            addMessage(aiMsg);
        } catch (error: any) {
            console.error("AI Assistant Error:", error);
            const detail = error.message || "Unknown error";
            toast.error("AI Communication failed: " + detail);
            const errorMsg: ChatMessage = {
                type: 'assistant',
                message: `Sorry, I couldn't process that request. ${detail}\n\nPlease check your connection and try again.`,
                time: 'Error'
            };
            addMessage(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const handleQuickCommand = (command: string) => {
        handleSendMessage(command);
    };

    if (!isHydrated) return null;

    // Safety check for document body
    if (typeof document === 'undefined') return null;

    // We render the portal ALWAYs (if hydrated), but the content inside AnimatePresence is conditional.
    // This allows AnimatePresence to handle the exit animations correctly within the portal.
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-[200]"
                        onClick={() => setOpen(false)}
                    />

                    {/* Assistant Panel */}
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 md:inset-auto md:right-8 md:top-8 md:bottom-8 md:w-[500px] z-[200]"
                    >
                        <div className="glass rounded-none md:rounded-[2.5rem] h-full flex flex-col border-none shadow-2xl overflow-hidden bg-background mobile-solid">
                            {/* Header */}
                            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-border bg-background mobile-solid relative overflow-hidden safe-top shrink-0">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-brand rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
                                            <Brain className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg md:text-xl font-black text-foreground">AI Assistant</h2>
                                            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Voice & Text Commands</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={clearMessages}
                                            className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all"
                                            title="Clear Chat History"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="h-12 w-12 md:h-10 md:w-10 flex items-center justify-center text-foreground hover:bg-muted/20 rounded-full transition-all active:scale-95"
                                        >
                                            <X className="h-6 w-6 md:h-5 md:w-5 relative top-[1px] left-[0.5px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Commands */}
                            <div className="px-5 md:px-8 py-4 md:py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Quick Commands</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {quickCommands.map((cmd, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuickCommand(cmd.command)}
                                            className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl hover:bg-primary dark:hover:bg-primary hover:text-white transition-all group text-left border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:translate-y-[-2px] active:translate-y-0"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-primary/5 dark:bg-slate-700 group-hover:bg-white/20 flex items-center justify-center mb-2 transition-colors">
                                                <cmd.icon className="h-4 w-4 text-primary group-hover:text-white" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-white">{cmd.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Conversation */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 md:space-y-6 custom-scrollbar scroll-smooth"
                            >
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className={cn(
                                            "flex gap-3",
                                            msg.type === 'user' && "flex-row-reverse"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                                            msg.type === 'user' ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        )}>
                                            {msg.type === 'user' ? <MessageSquare className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                        </div>
                                        <div className={cn("flex-1 max-w-[80%]", msg.type === 'user' && "flex flex-col items-end")}>
                                            <div className={cn(
                                                "p-4 rounded-2xl shadow-sm",
                                                msg.type === 'user'
                                                    ? "bg-primary text-white"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-700"
                                            )}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{msg.time}</p>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Loading Indicator */}
                                {isProcessing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3"
                                    >
                                        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                                            <Sparkles className="h-4 w-4 animate-pulse" />
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Voice Input */}
                            <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 safe-bottom shrink-0">
                                {/* Voice Visualizer */}
                                {isListening && (
                                    <div className="mb-4 flex items-center justify-center gap-1 h-12">
                                        {[...Array(20)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 bg-primary rounded-full"
                                                animate={{
                                                    height: [8, 32, 8],
                                                }}
                                                transition={{
                                                    duration: 0.8,
                                                    repeat: Infinity,
                                                    delay: i * 0.05,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className="flex items-center gap-2 md:gap-3">
                                    <button
                                        onClick={handleVoiceToggle}
                                        className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center",
                                            isListening ? "bg-rose-500 text-white animate-pulse" : "bg-primary text-white",
                                            "hover:scale-105 transition-all shadow-lg"
                                        )}
                                    >
                                        <Mic className="h-5 w-5" />
                                    </button>

                                    <input
                                        type="text"
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(transcript)}
                                        placeholder="Type or speak your command..."
                                        className={cn(
                                            "flex-1 h-12 glass rounded-2xl px-4 text-sm font-medium",
                                            "border-none outline-none",
                                            "focus:bg-white dark:focus:bg-slate-800",
                                            "focus:ring-2 focus:ring-primary/20",
                                            "transition-all dark:text-white"
                                        )}
                                    />

                                    <button
                                        onClick={() => handleSendMessage(transcript)}
                                        className={sendButtonClass}
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>

                                    <button
                                        onClick={() => setIsSpeaking(!isSpeaking)}
                                        className="h-12 w-12 glass rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-all shrink-0 hidden md:flex"
                                    >
                                        {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Status */}
                                <div className="mt-3 md:mt-4 flex items-center justify-center gap-2">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {isListening ? 'Listening...' : 'AI Assistant Ready'}
                                    </p>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
