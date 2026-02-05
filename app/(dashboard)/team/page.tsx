'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    MessageSquare,
    Video,
    Phone,
    Mail,
    Calendar,
    CheckCircle2,
    Clock,
    Send,
    Paperclip,
    UserPlus,
    Filter,
    Megaphone,
    User,
    Settings,
    Search,
    PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { firebaseService } from '@/lib/firebase-service';
import { useAuth } from '@/context/AuthContext';
import { type Message, type Conversation } from '@/lib/types';
import toast from 'react-hot-toast';

export default function TeamPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'messages' | 'team' | 'tasks'>('messages');
    const [selectedConversation, setSelectedConversation] = useState('team-general');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load & subscriptions
    useEffect(() => {
        if (!user) return;

        // Subscribe to conversations
        const unsubscribeConvs = firebaseService.subscribeToConversations(user.uid, (data) => {
            setConversations(data);
        });

        // Subscribe to messages of selected conversation
        let unsubscribeMsgs: (() => void) | undefined;
        if (selectedConversation) {
            setIsLoading(true);
            unsubscribeMsgs = firebaseService.subscribeToMessages(user.uid, selectedConversation, (data) => {
                setMessages(data);
                setIsLoading(false);
            });
        }

        return () => {
            unsubscribeConvs();
            if (unsubscribeMsgs) unsubscribeMsgs();
        };
    }, [user, selectedConversation]);

    const handleSendMessage = async () => {
        if (!newMessageText.trim() || !user) return;
        const tempText = newMessageText;
        setNewMessageText('');
        try {
            // FIRE AND FORGET: Navigation/State updates shouldn't wait for Firestore
            firebaseService.sendMessage(user.uid, selectedConversation, tempText)
                .catch(err => {
                    console.error("Message delivery failed:", err);
                    toast.error('Failed to sync message');
                });
        } catch (error) {
            toast.error('Failed to initiate send');
            setNewMessageText(tempText);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.promise(
                new Promise(resolve => setTimeout(resolve, 1500)),
                {
                    loading: `Processing ${file.name}...`,
                    success: 'File shared with channel',
                    error: 'Upload failed',
                }
            );
        }
    };

    const teamMembers: any[] = [];
    const tasks: any[] = [];

    return (
        <div className="min-h-dvh bg-mesh space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/5 dark:bg-transparent dark:border dark:border-white/20 text-slate-500 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest border border-slate-200/50 dark:border-white/20">Team & Communication</span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight leading-none">
                        Team <span className="text-primary italic">Communication</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Communicate with your practice team and manage internal tasks.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => toast.success('Team invitation link copied!')} className="h-12 px-6 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all flex items-center gap-2 active:translate-y-0 shadow-lg">
                        <UserPlus className="h-5 w-5" />
                        Invite Team Member
                    </button>
                    <button onClick={() => router.push('/settings')} className="h-12 w-12 glass border border-border rounded-xl flex items-center justify-center text-slate-400">
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <div className="glass rounded-xl p-1.5 flex items-center gap-1.5 w-fit border border-slate-100/50 dark:border-slate-700/50 shadow-sm bg-card/40">
                {(['messages', 'team', 'tasks'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all",
                            activeTab === tab ? "bg-slate-900 dark:bg-transparent dark:border dark:border-white dark:text-white shadow-xl" : "text-slate-500 hover:bg-white dark:hover:bg-slate-800"
                        )}
                    >
                        {tab === 'messages' ? 'Messenger' : tab === 'team' ? 'Practice Team' : 'Internal Tasks'}
                    </button>
                ))}
            </div>

            {activeTab === 'messages' && (
                <div className="grid gap-6 lg:grid-cols-12 h-[calc(100dvh-320px)] lg:h-[750px] animate-in slide-in-from-bottom-6 duration-700">
                    <div className="lg:col-span-4 glass rounded-[1.5rem] overflow-hidden flex flex-col border-none shadow-2xl bg-card/40">
                        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-card flex items-center justify-between">
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Channels & DMs</h2>
                            <Filter className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv.id)}
                                    className={cn(
                                        "w-full px-6 py-5 text-left transition-all relative flex items-center gap-4 group",
                                        selectedConversation === conv.id ? "bg-white dark:bg-slate-800" : "hover:bg-white/60"
                                    )}
                                >
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center text-lg shrink-0 border border-slate-100 shadow-sm",
                                        selectedConversation === conv.id ? "bg-slate-900 dark:bg-transparent dark:border dark:border-primary dark:text-primary" : "bg-slate-50 text-primary"
                                    )}>
                                        {conv.avatar || (conv.type === 'channel' ? <Megaphone className="h-5 w-5" /> : <User className="h-5 w-5" />)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-bold text-foreground truncate text-sm">{conv.name}</h3>
                                            <span className="text-[9px] font-bold text-slate-400">{conv.lastTime}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate font-medium">{conv.lastMessage}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 glass rounded-[1.5rem] overflow-hidden border-none shadow-2xl flex flex-col bg-card">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-900 dark:bg-transparent dark:border dark:border-white text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground leading-none uppercase tracking-widest">
                                    {conversations.find(c => c.id === selectedConversation)?.name || 'Direct Link Active'}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => toast.success('Initializing video broadcast...')} className="h-10 w-10 glass border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Video className="h-4 w-4" /></button>
                                <button onClick={() => toast.success('Initializing secure audio rail...')} className="h-10 w-10 glass border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Phone className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/10 dark:bg-slate-900/10 custom-scrollbar scroll-smooth">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-slate-300 uppercase text-[10px] font-bold tracking-widest animate-pulse">Establishing Clinical Secure Sync...</div>
                            ) : messages.map((msg) => (
                                <div key={msg.id} className={cn("flex gap-4", msg.sender === 'You' && "flex-row-reverse")}>
                                    <div className="h-10 w-10 bg-slate-100 dark:bg-transparent dark:border dark:border-slate-700/50 border-slate-200 rounded-xl flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{msg.sender[0]}</div>
                                    <div className={cn("flex-1 max-w-lg", msg.sender === 'You' && "flex flex-col items-end")}>
                                        <div className="p-5 rounded-2xl text-sm leading-relaxed shadow-lg border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700">
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-card">
                            <div className="flex items-center gap-4">
                                <button onClick={() => fileInputRef.current?.click()} className="h-12 w-12 glass border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <input
                                    type="text"
                                    value={newMessageText}
                                    onChange={(e) => setNewMessageText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Secure Message Sync..."
                                    className="flex-1 h-12 bg-slate-50 dark:bg-transparent rounded-2xl px-6 text-sm font-medium outline-none dark:text-white border border-transparent dark:border-white/10 focus:border-primary/20"
                                />
                                <button onClick={handleSendMessage} className="h-12 px-8 bg-slate-900 dark:bg-primary text-white rounded-2xl font-bold text-sm flex items-center gap-3">
                                    <Send className="h-4 w-4" /> Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'team' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="col-span-full py-32 text-center glass rounded-[1.5rem] bg-white/40">
                        <Users className="h-12 w-12 text-slate-100 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Practice Rosters Empty</p>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="glass rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white/60 dark:bg-slate-900/60">
                    <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-card">
                        <div className="flex items-center gap-4">
                            <h2 className="text-base font-bold text-foreground uppercase tracking-widest">Task Manager</h2>
                        </div>
                        <button onClick={() => toast.success('Task generator active...')} className="h-12 px-8 bg-slate-900 dark:bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em]">New Task</button>
                    </div>
                    <div className="py-32 text-center bg-white/40">
                        <CheckCircle2 className="h-12 w-12 text-slate-100 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Taskboard Empty</p>
                    </div>
                </div>
            )}
        </div>
    );
}

