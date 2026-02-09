'use client';

import { useState, useRef } from 'react';
import { Camera as CameraIcon, X, Loader2, Binary } from 'lucide-react';
import { Camera as NativeCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseService } from '@/lib/firebase-service';
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
    const [progress, setProgress] = useState(0);
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
                    const MAX_WIDTH = 1280;
                    const MAX_HEIGHT = 1280;
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
            console.error(`[ImageUpload] Storage or User context missing. Storage: ${!!storage}, User: ${!!user?.uid}`);
            toast.error('Storage not available. Please try again.');
            return;
        }

        setIsUploading(true);
        onUploading?.(true);
        setProgress(0);
        try {
            console.log(`[ImageUpload] Initiating upload for user: ${user.uid}, file: ${file.name}`);
            // Compress on client for mobile performance
            const compressedBlob = await compressImage(file);

            // Create unique path for this image
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0] + '.jpg';
            const path = `users/${user.uid}/profile-images/${timestamp}_${safeName}`;
            const storageRef = ref(storage, path);

            // Upload the compressed blob using resumable for progress tracking
            const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setProgress(Math.round(p));
                    },
                    (error) => {
                        console.error(`[ImageUpload] Resumable upload failed:`, error);
                        reject(error);
                    },
                    () => resolve(null)
                );
            });

            // Get the download URL
            const url = await getDownloadURL(storageRef);
            console.log(`[ImageUpload] Upload success. URL: ${url}`);

            // Pass the URL (not base64) to the parent
            onChange(url);
            toast.success('Identity verified and uploaded!');
        } catch (error: any) {
            console.error('[ImageUpload] FATAL error:', error);
            toast.error(`Failed to process image: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
            onUploading?.(false);
            setProgress(0);
        }
    };

    const handleNativeUpload = async () => {
        if (!user) return;
        setIsUploading(true);
        onUploading?.(true);
        setProgress(10); // Initial progress

        try {
            const image = await NativeCamera.getPhoto({
                quality: 80,
                width: 1200,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt
            });

            if (image.base64String) {
                setProgress(50);
                const timestamp = Date.now();
                const path = `users/${user.uid}/profile-images/${timestamp}_native.jpg`;

                // Uses the generic upload engine in firebaseService
                const url = await firebaseService.uploadGenericImage(
                    user.uid,
                    path,
                    image.base64String
                );

                onChange(url);
                toast.success('Identity verified and uploaded!');
            }
        } catch (error: any) {
            console.error('Native upload error:', error);
            if (error.message !== 'User cancelled photos app') {
                toast.error('Failed to process native image.');
            }
        } finally {
            setIsUploading(false);
            onUploading?.(false);
            setProgress(0);
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
                onClick={() => {
                    if (isUploading) return;
                    if (Capacitor.isNativePlatform()) {
                        handleNativeUpload();
                    } else {
                        fileInputRef.current?.click();
                    }
                }}
                className={cn(
                    "relative h-32 w-32 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden shadow-2xl bg-card border-4 border-border",
                    isDragging ? "border-primary ring-8 ring-primary/10 scale-105" : "hover:border-primary/20",
                    !isUrl && "bg-muted",
                    isUploading && "cursor-wait"
                )}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-3 text-black">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest">{progress}%</span>
                            <div className="w-16 h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden border border-black/5">
                                <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                ) : isUrl ? (
                    <img src={value} alt="Clinical Identity" className="h-full w-full object-cover animate-in fade-in zoom-in duration-500" />
                ) : (
                    <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform duration-500 text-zinc-300 group-hover:text-black">
                        {value && !isUrl ? (
                            <span className="text-4xl text-black">{value}</span>
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
                        <CameraIcon className="h-6 w-6 text-white" />
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
                    className="absolute -top-3 -right-3 h-8 w-8 bg-white border border-black text-black rounded-xl shadow-2xl flex items-center justify-center hover:bg-black hover:text-white hover:scale-110 active:scale-95 transition-all z-10"
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
