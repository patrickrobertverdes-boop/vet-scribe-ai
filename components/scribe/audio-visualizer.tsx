'use client';

import { useEffect, useRef } from 'react';
import { Activity, Shield, Binary, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
    isRecording: boolean;
    stream?: MediaStream | null;
}

export function AudioVisualizer({ isRecording, stream: externalStream }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (isRecording) {
            const initAudio = async () => {
                try {
                    // Use external stream if provided, otherwise request new (fallback)
                    const stream = externalStream || await navigator.mediaDevices.getUserMedia({ audio: true });

                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const analyser = audioContext.createAnalyser();
                    const source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyser.fftSize = 256;
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    audioContextRef.current = audioContext;
                    analyzerRef.current = analyser;
                    dataArrayRef.current = dataArray;
                } catch (err) {
                    console.error("Visualizer audio access failed:", err);
                }
            };
            initAudio();
        } else {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        }
    }, [isRecording, externalStream]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let step = 0;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const midY = height / 2;

            // Get real-time volume if available
            let volume = 0;
            if (isRecording && analyzerRef.current && dataArrayRef.current) {
                const analyzer = analyzerRef.current;
                const dataArray = dataArrayRef.current;
                analyzer.getByteFrequencyData(dataArray as any);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                volume = sum / dataArray.length / 5; // Normalized
            }

            const drawWave = (color: string, amplitudeMult: number, freqMult: number, opacity: number, lineWidth: number) => {
                ctx.beginPath();
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = color;
                ctx.globalAlpha = opacity;

                for (let x = 0; x < width; x += 4) {
                    const amp = isRecording ? (volume * amplitudeMult + Math.sin((x + step) * freqMult) * 10) : Math.sin((x + step) * 0.01) * 2;
                    const y = midY + amp;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            };

            drawWave('#0ea5e9', 2, 0.02, 1, 3);
            drawWave('#0ea5e9', 1, 0.05, 0.3, 1);

            step += isRecording ? 5 : 1;
            animationId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [isRecording]);

    return (
        <div className="h-40 w-full relative bg-[#020617] overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
            {/* Visual Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Audio Input Label */}
            <div className="absolute top-6 left-8 flex items-center gap-6 z-10">
                <div className="h-10 w-10 glass border border-white/5 rounded-xl flex items-center justify-center text-primary/80">
                    <Binary className="h-5 w-5" />
                </div>
                <div>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="absolute top-6 right-8 flex items-center gap-8 z-10">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={cn(
                                "h-1 w-3.5 rounded-full transition-all duration-1000",
                                i <= (isRecording ? 5 : 2) ? "bg-primary shadow-[0_0_8px_rgba(14,165,233,0.4)]" : "bg-white/5"
                            )} />
                        ))}
                    </div>
                </div>

                <div className="h-12 w-px bg-white/5" />

                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-3 w-3 rounded-full transition-all duration-700 border-2",
                        isRecording
                            ? "bg-rose-500 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse"
                            : "bg-slate-800 border-slate-700"
                    )} />
                    <div className="flex flex-col">
                    </div>
                </div>
            </div>

            {/* Core Visualization */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <canvas ref={canvasRef} width={1200} height={160} className="w-full h-full opacity-80" />
            </div>
        </div>
    );
}
