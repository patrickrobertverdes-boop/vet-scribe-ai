'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { firebaseService } from '@/lib/firebase-service';
import { useDesignStore } from "@/lib/design-store";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";
import {
    Settings2,
    Palette,
    Layout,
    Type,
    ShieldCheck,
    Bell,
    Database,
    Wand2,
    ChevronRight,
    Monitor,
    Moon,
    Sun,
    Binary,
    Zap,
    BrainCircuit,
    Cpu,
    Lock,
    Key,
    UserCircle,
    Smartphone,
    Plus,
    Mail,
    Globe,
    FileJson,
    RefreshCw,
    Scale,
    FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

type SettingTab = 'User Profile' | 'Appearance' | 'AI Assistant' | 'Security & Access' | 'Notifications' | 'Data & Integration' | 'Legal & Compliance';

export default function SettingsPage() {
    const {
        theme, setTheme,
        accentColor, setAccentColor,
        density, setDensity,
        fontSize, setFontSize,
        clinicalModel, setClinicalModel
    } = useDesignStore();

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<SettingTab>('User Profile');
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState<any>({ name: '', specialty: '', image: '' });
    const [isUploading, setIsUploading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = firebaseService.subscribeToUserProfile(user.uid, (data) => {
            if (data) {
                // Merge data to ensure we have name/displayName/specialty/image
                setProfile({
                    name: data.displayName || data.name || '',
                    specialty: data.specialty || '',
                    image: data.image || ''
                });
            }
        });
        return () => unsubscribe();
    }, [user]);

    const handleUpdateProfile = async (newData: any) => {
        if (!user || isUpdating) return;
        setIsUpdating(true);
        try {
            // Map 'name' back to 'displayName' for consistency with provisioning/Auth
            const dataToSave: any = { ...newData };
            if (newData.name) dataToSave.displayName = newData.name;

            // 1. Update Firebase Auth Profile (Real-time sync)
            await updateUser(dataToSave);

            // 2. Update Firestore Profile
            await firebaseService.updateUserProfile(user.uid, dataToSave);

            toast.success("Profile synchronized with clinical vault.");
        } catch (e: any) {
            console.error("[Settings] Profile update error:", e);
            toast.error(`Synchronization failed: ${e.message || 'Check connection'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Size check (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
            toast.error("Image too large. Max 3MB.");
            return;
        }

        setIsUploading(true);
        try {
            const url = await firebaseService.uploadProfileImage(user.uid, file);

            // CRITICAL: Only update the image field to avoid overwriting with stale state
            await firebaseService.updateUserProfile(user.uid, { image: url });

            setProfile((prev: any) => ({ ...prev, image: url }));
            setIsUploading(false);
            toast.success("Profile picture updated.");
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Failed to upload image.");
            setIsUploading(false);
        }
    };

    const handleNativeImagePick = async () => {
        if (!user) return;

        try {
            // Ensure permissions are granted before proceeding
            const status = await Camera.checkPermissions();
            if (status.photos !== 'granted' || status.camera !== 'granted') {
                await Camera.requestPermissions();
            }

            const image = await Camera.getPhoto({
                quality: 70, // Optimized compression
                width: 1000, // Balanced resolution
                allowEditing: false, // PROFESSIONAL: No external editors
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt // Asks user: Gallery or Camera
            });

            if (image.base64String) {
                console.log("[Settings] Native image captured. Format:", image.format);
                setIsUploading(true);

                // AUDIT: Retrieve fresh token for backend verification
                const idToken = await user.getIdToken();
                console.log("[Settings] Audit: Auth token retrieved.");

                // Use the backend upload endpoint to ensure expectations (Base64) are met
                console.log("[Settings] Syncing with backend upload endpoint...");
                const response = await fetch('/api/user/upload-avatar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        image: image.base64String,
                        mimeType: 'image/jpeg'
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    console.error("[Settings] Backend Upload Error [Status: " + response.status + "]:", result);
                    throw new Error(result.error || `Upload failed with status ${response.status}`);
                }

                console.log("[Settings] Backend Upload Success:", result.url);

                // Update local auth state and sync with Firestore record
                await updateUser({ image: result.url });

                setProfile((prev: any) => ({ ...prev, image: result.url }));
                toast.success("Profile photo synchronized.");
            }
        } catch (err: any) {
            if (err.message !== 'User cancelled photos app') {
                console.error("[Settings] Camera/Upload Error:", err);
                // Log the full error for debugging in Android Logcat/In-App DevTools
                console.error("[Settings] Error Details:", JSON.stringify(err));
                toast.error(`Sync Failed: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const colors = [
        { name: 'Clinical Teal', value: '#075985', class: 'bg-[#075985]' },
        { name: 'Scribe Sky', value: '#0ea5e9', class: 'bg-[#0ea5e9]' },
        { name: 'Neural Violet', value: '#7c3aed', class: 'bg-[#7c3aed]' },
        { name: 'Urgent Rose', value: '#e11d48', class: 'bg-[#e11d48]' },
    ];

    const handleThemeChange = (newTheme: any) => {
        setTheme(newTheme);
        toast.success(`Theme updated to ${newTheme} mode.`);
    };

    const handleAccentChange = (color: string, name: string) => {
        setAccentColor(color);
        toast.success(`Accent color synchronized: ${name}`);
    };

    const tabs: { label: SettingTab; icon: any }[] = [
        { label: 'User Profile', icon: UserCircle },
        { label: 'Appearance', icon: Palette },
        { label: 'AI Assistant', icon: Wand2 },
        { label: 'Security & Access', icon: ShieldCheck },
        { label: 'Notifications', icon: Bell },
        { label: 'Data & Integration', icon: Database },
        { label: 'Legal & Compliance', icon: Scale },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 md:pb-20">
            {/* Command Header */}
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 bg-slate-900 dark:bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                        <Settings2 className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">App Configuration</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-none mb-4 md:mb-6">Workspace <span className="text-primary italic">Settings</span></h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">Configure your workspace appearance, AI assistant behavior, and clinical display settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                {/* Navigation Hub */}
                <div className="lg:col-span-4 space-y-3">
                    {tabs.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(item.label)}
                            className={cn(
                                "w-full flex items-center justify-between p-5 rounded-xl transition-all group border",
                                activeTab === item.label
                                    ? "bg-primary text-primary-foreground shadow-xl border-primary"
                                    : "bg-card/40 border text-muted-foreground hover:bg-card hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    activeTab === item.label ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
                                )}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                            </div>
                            {activeTab === item.label && <ChevronRight className="h-4 w-4 text-primary-foreground" />}
                        </button>
                    ))}
                </div>

                {/* Parameters Field */}
                <div className="lg:col-span-8 space-y-8 md:space-y-10">
                    <div className="glass rounded-[1.5rem] p-6 md:p-12 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl space-y-8 md:space-y-12 bg-card/40 min-h-[600px]">
                        {activeTab === 'User Profile' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <UserCircle className="h-4 w-4" /> Account Identification
                                    </h2>

                                    <div className="flex flex-col md:flex-row gap-10 items-center">
                                        <div className="relative group">
                                            <div className="h-32 w-32 rounded-2xl bg-muted border border-border overflow-hidden relative flex items-center justify-center shadow-inner group-hover:scale-105 transition-all duration-500">
                                                {profile.image ? (
                                                    <img
                                                        src={profile.image}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            const parent = (e.target as HTMLImageElement).parentElement;
                                                            if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/30"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <UserCircle className="h-12 w-12 text-muted-foreground/30" />
                                                )}
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                                                        <RefreshCw className="h-6 w-6 text-white animate-spin" />
                                                    </div>
                                                )}
                                                <label
                                                    onClick={(e) => {
                                                        if (Capacitor.isNativePlatform()) {
                                                            e.preventDefault();
                                                            handleNativeImagePick();
                                                        }
                                                    }}
                                                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer backdrop-blur-sm transition-opacity"
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <RefreshCw className="h-6 w-6 text-white" />
                                                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">Change</span>
                                                    </div>
                                                    {!Capacitor.isNativePlatform() && (
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                    )}
                                                </label>
                                                {!profile.image && !isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden text-muted-foreground/30">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Plus className="h-5 w-5" />
                                                            <span className="text-[8px] font-bold uppercase tracking-widest">Add Photo</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-card">
                                                <Zap className="h-3 w-3" />
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-6 w-full">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Professional Name</label>
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    placeholder="e.g. Dr. Sarah Gahra, DVM"
                                                    className="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Medical Specialty</label>
                                                    <div className="max-w-md">
                                                        <CustomSelect
                                                            value={profile.specialty}
                                                            onChange={(val) => {
                                                                setProfile({ ...profile, specialty: val });
                                                            }}
                                                            options={[
                                                                { label: "General Practice", value: "GP" },
                                                                { label: "Surgical Specialist", value: "Surgery" },
                                                                { label: "Emergency Medicine", value: "ER" },
                                                                { label: "Internal Medicine", value: "Internal" },
                                                                { label: "Radiology", value: "Radiology" }
                                                            ]}
                                                            placeholder="Select clinical focus..."
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleUpdateProfile(profile)}
                                                    disabled={isUpdating}
                                                    className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                                >
                                                    {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                                    {isUpdating ? "Synchronizing..." : "Synchronize Profile"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-4 w-4 text-primary" />
                                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">Clinical Identification</p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Your professional identity is automatically appended to clinical records and SOAP notes you authorize.
                                        This ensures proper chain of custody for all medical documentation.
                                    </p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Appearance' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                {/* Environmental Theme Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                            <Monitor className="h-4 w-4" /> Theme & Appearance
                                        </h2>
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">Global Sync Active</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        {[
                                            { id: 'light', name: 'Light Mode', icon: Sun },
                                            { id: 'dark', name: 'Dark Mode', icon: Moon },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleThemeChange(t.id)}
                                                className={cn(
                                                    "relative p-8 rounded-2xl flex flex-col items-center gap-5 transition-all hover:translate-y-[-2px] border",
                                                    theme === t.id
                                                        ? "bg-card shadow-2xl ring-2 ring-primary border-transparent"
                                                        : "bg-card/20 border hover:bg-card/60"
                                                )}
                                            >
                                                <div className="h-16 w-full rounded-xl flex items-center justify-center bg-muted shadow-inner overflow-hidden">
                                                    <t.icon className="h-6 w-6 text-foreground/40" />
                                                </div>
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme === t.id ? "text-primary" : "text-muted-foreground")}>{t.name}</span>
                                                {theme === t.id && (
                                                    <div className="absolute top-4 right-4 h-6 w-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-card">
                                                        <Zap className="h-2.5 w-2.5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Layout Density */}
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Layout className="h-4 w-4" /> Information Density
                                    </h2>
                                    <div className="max-w-md">
                                        <CustomSelect
                                            value={density}
                                            onChange={(val) => { setDensity(val as any); toast.success(`Layout density set to ${val}`); }}
                                            options={[
                                                { label: "Standard", value: "comfortable" },
                                                { label: "Compact", value: "compact" },
                                                { label: "Spacious", value: "spacious" }
                                            ]}
                                        />
                                    </div>
                                </div>

                                {/* Neural Accentuation */}
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Palette className="h-4 w-4" /> Accent Colors
                                    </h2>
                                    <div className="flex items-center gap-6">
                                        {colors.map((color) => (
                                            <button
                                                key={color.value}
                                                onClick={() => handleAccentChange(color.value, color.name)}
                                                className={cn(
                                                    "h-12 w-12 rounded-xl ring-offset-4 ring-2 transition-all hover:scale-110 shadow-xl border border-white/20 dark:border-white/10",
                                                    accentColor === color.value ? "ring-primary scale-110 shadow-primary/20" : "ring-transparent",
                                                    color.class
                                                )}
                                                title={color.name}
                                            />
                                        ))}
                                        <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-4" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none mb-2">Active Frequency</span>
                                            <span className="text-xs font-bold text-foreground uppercase tracking-tight">{colors.find(c => c.value === accentColor)?.name || 'Custom Vector'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Type Synthesis */}
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Type className="h-4 w-4" /> Text Size
                                    </h2>
                                    <div className="flex bg-muted/50 p-2 rounded-xl border border-border max-w-lg">
                                        {['small', 'medium', 'large'].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => { setFontSize(size as any); toast.success(`Type scale set to ${size}`); }}
                                                className={cn(
                                                    "flex-1 py-4 text-[9px] font-bold uppercase tracking-[0.3em] rounded-lg transition-all",
                                                    fontSize === size
                                                        ? "bg-card text-primary dark:text-white shadow-lg ring-1 ring-border"
                                                        : "text-muted-foreground hover:text-slate-600 dark:hover:text-slate-300"
                                                )}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'AI Assistant' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <BrainCircuit className="h-4 w-4" /> Model Configuration
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={cn(
                                            "p-6 rounded-2xl border transition-all",
                                            clinicalModel === 'gemini-flash-latest'
                                                ? "bg-primary/5 border-primary shadow-lg ring-1 ring-primary"
                                                : "bg-card border shadow-sm"
                                        )}>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Cpu className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Clinical Model</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium tracking-tight">Gemini Flash Latest</p>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-6">
                                                Optimized for high-speed transcription and clinical reasoning. Integrated veterinary knowledge base.
                                            </p>
                                            <button
                                                onClick={() => { setClinicalModel('gemini-flash-latest'); toast.success("Switched to Clinical Flash model."); }}
                                                className={cn(
                                                    "w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                                    clinicalModel === 'gemini-flash-latest'
                                                        ? "bg-primary text-primary-foreground cursor-default"
                                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                )}
                                            >
                                                {clinicalModel === 'gemini-flash-latest' ? 'Active Model' : 'Activate Flash'}
                                            </button>
                                        </div>
                                        <div className={cn(
                                            "p-6 rounded-2xl border transition-all relative overflow-hidden",
                                            clinicalModel === 'gemini-pro-latest'
                                                ? "bg-primary/5 border-primary shadow-lg ring-1 ring-primary"
                                                : "bg-card border shadow-sm"
                                        )}>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <BrainCircuit className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Research Model</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium tracking-tight">Gemini Pro Latest</p>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-6">
                                                Enhanced reasoning for complex case analysis and medical literature synthesis.
                                            </p>
                                            <button
                                                onClick={() => { setClinicalModel('gemini-pro-latest'); toast.success("Switched to Research Pro model."); }}
                                                className={cn(
                                                    "w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                                    clinicalModel === 'gemini-pro-latest'
                                                        ? "bg-primary text-primary-foreground cursor-default"
                                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                )}
                                            >
                                                {clinicalModel === 'gemini-pro-latest' ? 'Active Model' : 'Switch to Pro'}
                                            </button>
                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded uppercase tracking-widest">
                                                Research
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <BrainCircuit className="h-4 w-4" /> Assistant Behavior
                                    </h2>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Auto-Scribe', desc: 'Automatically generate SOAP notes after recording' },
                                            { label: 'Clinical Validation', desc: 'Highlight potential medical discrepancies' },
                                            { label: 'Voice Commands', desc: 'Enable hands-free navigation during exams' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card/40 border">
                                                <div>
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">{item.label}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">{item.desc}</p>
                                                </div>
                                                <div className="h-6 w-11 bg-primary rounded-full relative shadow-inner">
                                                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-md" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Security & Access' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Lock className="h-4 w-4" /> Privacy Control
                                    </h2>
                                    <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl relative overflow-hidden">
                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                            <div>
                                                <h3 className="text-white text-xl font-bold tracking-tight mb-2">Patient Privacy Mode</h3>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-md">
                                                    Automatically redact PII (Name, Address, Phone) from all generated clinical summaries.
                                                </p>
                                            </div>
                                            <button className="px-8 py-4 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                                Enable Protection
                                            </button>
                                        </div>
                                        <div className="absolute -top-10 -right-10 h-40 w-40 bg-primary/20 rounded-full blur-3xl" />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Key className="h-4 w-4" /> Authentication
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="p-6 rounded-2xl bg-card border flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-slate-400">
                                                    <UserCircle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Personal PIN</p>
                                                    <p className="text-[10px] text-muted-foreground">Require PIN for clinical data access</p>
                                                </div>
                                            </div>
                                            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Change PIN</button>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-card border flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-slate-400">
                                                    <Smartphone className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Two-Factor Auth</p>
                                                    <p className="text-[10px] text-muted-foreground">Active via Authenticator App</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold rounded uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Notifications' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Bell className="h-4 w-4" /> Alert Channels
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 rounded-2xl bg-card border">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-slate-400">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Email Summary</p>
                                            </div>
                                            <div className="space-y-3">
                                                {['Daily Rounds', 'Urgent Alerts', 'Weekly Metrics'].map((label, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="h-4 w-4 rounded bg-primary flex items-center justify-center">
                                                            <Zap className="h-2 w-2 text-white" />
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-card border">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-slate-400">
                                                    <Smartphone className="h-5 w-5" />
                                                </div>
                                                <p className="text-xs font-bold text-foreground uppercase tracking-wider">System Push</p>
                                            </div>
                                            <div className="space-y-3">
                                                {['Lab Results', 'Record Complete', 'Team Messages'].map((label, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="h-4 w-4 rounded bg-primary flex items-center justify-center">
                                                            <Zap className="h-2 w-2 text-white" />
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Data & Integration' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Globe className="h-4 w-4" /> External Systems
                                    </h2>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Cornerstone', status: 'Connected', logo: 'CS' },
                                            { name: 'VetSpire', status: 'Ready', logo: 'VS' },
                                            { name: 'ezyVet', status: 'Disconnected', logo: 'EV' },
                                        ].map((pms, i) => (
                                            <div key={i} className="p-6 rounded-2xl bg-card border flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tighter">
                                                        {pms.logo}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">{pms.name} PMS</p>
                                                        <p className="text-[10px] text-muted-foreground">Clinical Data Connector</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={cn(
                                                        "px-3 py-1 text-[8px] font-bold rounded uppercase tracking-widest",
                                                        pms.status === 'Connected' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                                                            pms.status === 'Ready' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                                                                "bg-muted text-muted-foreground"
                                                    )}>
                                                        {pms.status}
                                                    </span>
                                                    <button className="h-8 w-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                                        <RefreshCw className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <FileJson className="h-4 w-4" /> Export Operations
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="p-4 rounded-xl border text-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center gap-3">
                                            <FileJson className="h-4 w-4 text-muted-foreground" /> JSON Records
                                        </button>
                                        <button className="p-4 rounded-xl border text-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center gap-3">
                                            <FileJson className="h-4 w-4 text-muted-foreground" /> PDF Summaries
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Legal & Compliance' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                <div className="space-y-8">
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-4">
                                        <Scale className="h-4 w-4" /> Legal & Documentation
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { title: 'Privacy Policy', desc: 'Veterinary clinical privacy standards.', path: '/privacy' },
                                            { title: 'Terms of Service', desc: 'Clinical usage and service agreement.', path: '/terms' },
                                            { title: 'Data Protection', desc: 'Security safeguards and ownership.', path: '/security' }
                                        ].map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => router.push(item.path)}
                                                className="p-6 rounded-2xl bg-card border hover:border-primary transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-5 text-left">
                                                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">{item.title}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 rounded-2xl bg-muted/50 border border-border space-y-4">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">Regulatory Compliance</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        VetScribe is designed to comply with professional veterinary standards for clinical record-keeping and data sovereignty. We maintain rigorous standards for encryption and audit logging throughout our infrastructure.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Operational Integrity Warning */}
                    <div className="p-10 bg-slate-900 dark:bg-slate-950 rounded-[1.5rem] flex items-center gap-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="h-16 w-16 bg-white/10 glass rounded-2xl flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-white">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white text-lg font-bold tracking-tight mb-2 uppercase">System Synchronization</p>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.1em] leading-[1.8] max-w-xl">
                                Changes are synchronized across all your devices in real-time. Your clinical environment settings are securely stored.
                            </p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}

