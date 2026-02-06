'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2, Binary } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    placeholderEmoji?: string;
    onUploading?: (uploading: boolean) => void;
}

export function ImageUpload({ value, onChange, className, placeholderEmoji = '', onUploading }: ImageUploadProps) {
    const { user } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(blob || file);
                    }, 'image/jpeg', 0.8);
                };
            };
        });
    };

    const uploadToStorage = async (file: File) => {
        if (!storage || !user) {
            toast.error('Storage not available. Please try again.');
            return;
        }

        setIsUploading(true);
        onUploading?.(true);
        try {
            // Compress on client for mobile performance
            const compressedBlob = await compressImage(file);

            // Create unique path for this image
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0] + '.jpg';
            const path = `users/${user.uid}/profile-images/${timestamp}_${safeName}`;
            const storageRef = ref(storage, path);

            // Upload the compressed blob
            await uploadBytes(storageRef, compressedBlob);

            // Get the download URL
            const url = await getDownloadURL(storageRef);

            // Pass the URL (not base64) to the parent
            onChange(url);
            toast.success('Identity verified and uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to process image.');
        } finally {
            setIsUploading(false);
            onUploading?.(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadToStorage(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            uploadToStorage(file);
        }
    };

    const isUrl = value?.startsWith('http') || value?.startsWith('data:');

    return (
        <div className={cn("relative group", className)}>
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                    "relative h-32 w-32 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden shadow-2xl bg-card border-4 border-border",
                    isDragging ? "border-primary ring-8 ring-primary/10 scale-105" : "hover:border-primary/20",
                    !isUrl && "bg-muted",
                    isUploading && "cursor-wait"
                )}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Uploading...</span>
                    </div>
                ) : isUrl ? (
                    <img src={value} alt="Clinical Identity" className="h-full w-full object-cover animate-in fade-in zoom-in duration-500" />
                ) : (
                    <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform duration-500 text-slate-300 group-hover:text-primary/60">
                        {value && !isUrl ? (
                            <span className="text-4xl">{value}</span>
                        ) : (
                            <>
                                <Binary className="h-10 w-10 mb-1" />
                            </>
                        )}
                    </div>
                )}

                {/* Tactical Overlay */}
                {!isUploading && (
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                        <Camera className="h-6 w-6 text-white" />
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">Update</span>
                    </div>
                )}
            </div>

            {isUrl && !isUploading && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange('');
                    }}
                    className="absolute -top-3 -right-3 h-8 w-8 bg-slate-900 border border-white/20 text-white rounded-xl shadow-2xl flex items-center justify-center hover:bg-rose-500 hover:scale-110 active:scale-95 transition-all z-10"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
            />

            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-foreground text-background rounded-lg text-[8px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-3 group-hover:translate-y-0 shadow-2xl whitespace-nowrap z-20 border border-background/10">
                {isUploading ? 'Uploading...' : isUrl ? 'Change Identity' : 'Upload Biometrics'}
            </div>
        </div>
    );
}
