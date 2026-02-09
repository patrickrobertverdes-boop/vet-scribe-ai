import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

export type RecordingState = 'IDLE' | 'RECORDING' | 'PAUSED' | 'FINISHED' | 'ERROR';

interface UseDeepgramReturn {
    isListening: boolean;
    isPaused: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    togglePause: (paused: boolean) => void;
    resetTranscript: () => void;
    setTranscript: (text: string) => void;
    clearError: () => void;
    error: string | null;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'finished';
    recordingState: RecordingState;
    stream: MediaStream | null;
}

export function useDeepgram(): UseDeepgramReturn {
    const [recordingState, setRecordingState] = useState<RecordingState>('IDLE');
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setInternalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'finished'>('disconnected');
    const [stream, setStream] = useState<MediaStream | null>(null);

    const connectionRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const finalTextRef = useRef('');
    const statusRef = useRef<'disconnected' | 'connecting' | 'connected' | 'error' | 'finished'>('disconnected');
    const isPausedRef = useRef(false);

    const updateStatus = useCallback((newStatus: typeof connectionStatus) => {
        statusRef.current = newStatus;
        setConnectionStatus(newStatus);
    }, []);

    const cleanup = useCallback(() => {
        console.log('[Scribe] 🧹 Cleaning up session...');

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        if (connectionRef.current) {
            try {
                if (connectionRef.current.readyState === WebSocket.OPEN) {
                    connectionRef.current.send(JSON.stringify({ type: 'CloseStream' }));
                }
                connectionRef.current.close();
            } catch (e) { /* ignore */ }
        }
        connectionRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }

        // Release system lock
        if (Capacitor.isNativePlatform()) {
            KeepAwake.allowSleep().catch(() => { /* silent */ });
        }
    }, []);

    const stopListening = useCallback(() => {
        console.log('[Scribe] 🛑 Stopping and Finalizing...');
        cleanup();
        setIsListening(false);
        setIsPaused(false);
        isPausedRef.current = false;
        updateStatus('finished');
        setRecordingState('FINISHED');
    }, [cleanup, updateStatus]);

    const togglePause = useCallback((paused: boolean) => {
        console.log(`[Scribe] ${paused ? '⏸️ Pausing' : '▶️ Resuming'}...`);
        setIsPaused(paused);
        isPausedRef.current = paused;
        setRecordingState(paused ? 'PAUSED' : 'RECORDING');

        if (mediaRecorderRef.current) {
            try {
                if (paused && mediaRecorderRef.current.state === 'recording') {
                    console.log('[Scribe] ⏸️ Pausing MediaRecorder...');
                    mediaRecorderRef.current.pause();
                } else if (!paused && mediaRecorderRef.current.state === 'paused') {
                    console.log('[Scribe] ▶️ Resuming MediaRecorder...');
                    mediaRecorderRef.current.resume();
                } else if (!paused && mediaRecorderRef.current.state === 'inactive') {
                    // Fallback for unexpected inactive state
                    console.log('[Scribe] 🔄 Restarting MediaRecorder...');
                    mediaRecorderRef.current.start(250);
                }
            } catch (e) {
                console.error('[Scribe] ❌ Toggle pause error:', e);
            }
        }

        // Also handle AudioWorklet if it was active
        if (workletNodeRef.current) {
            // PCM Mode - we just rely on isPausedRef.current check in startListening's onmessage
        }
    }, []);

    const startListening = useCallback(async () => {
        if (statusRef.current === 'connecting' || statusRef.current === 'connected') return;

        console.log('[Scribe] 🎙️ Starting Live Connection (PCM Mode)...');
        cleanup();
        setError(null);
        updateStatus('connecting');
        // Removed setInternalTranscript('') and finalTextRef.current = '' 
        // to prevent clearing data on reconnection/resume.
        // Consumer should call resetTranscript() when starting a fresh session.
        setInterimTranscript('');
        setIsPaused(false);
        isPausedRef.current = false;

        // Connection Timeout Safety
        const connectionTimeout = setTimeout(() => {
            if (statusRef.current === 'connecting') {
                console.error('❌ [Scribe] WebSocket Connection Timeout (10s)');
                setError('Connection timed out. Check network/firewall.');
                toast.error('Connection Timeout: Server did not respond in 10s');
                cleanup();
                setIsListening(false);
            }
        }, 10000);

        try {
            // 1. Get Key
            const keyResponse = await fetch('/api/deepgram/token');
            if (!keyResponse.ok) throw new Error('API Key service unavailable');
            const { apiKey } = await keyResponse.json();
            if (!apiKey) throw new Error('Invalid transcription key');

            // 2. Audio Stream
            console.log('[Scribe] 🎤 Requesting microphone access...');

            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            console.log('[Scribe] ✅ Microphone access granted');

            setStream(audioStream);
            streamRef.current = audioStream;

            // iOS/Safari & Capacitor WebView specific: AudioContext must be resumed after state 'suspended'
            // and often requires a user gesture for each start.
            // Enable PCM for Capacitor as modern WebViews handle it well.
            const isPcmCapable = !!(window.AudioWorklet);

            // 3. Setup Audio Handler (Hybrid)
            if (isPcmCapable) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 16000,
                });
                audioContextRef.current = audioContext;

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                await audioContext.audioWorklet.addModule('/pcm-processor.js');

                const source = audioContext.createMediaStreamSource(audioStream);
                const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
                workletNodeRef.current = workletNode;

                source.connect(workletNode);
                workletNode.connect(audioContext.destination);
            }

            // 4. Connect Direct (WebSocket)
            const queryParams: any = {
                model: 'nova-2-medical',
                language: 'en-US',
                smart_format: 'true',
                interim_results: 'true',
                punctuate: 'true',
                profanity_filter: 'false'
            };

            if (isPcmCapable) {
                queryParams.encoding = 'linear16';
                queryParams.sample_rate = '16000';
            }

            const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${new URLSearchParams(queryParams).toString()}`, [
                'token',
                apiKey.trim(),
            ]);

            connectionRef.current = ws;

            const keepAlive = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'KeepAlive' }));
                }
            }, 5000);

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('🟢 [Scribe] Link established');
                updateStatus('connected');
                setRecordingState('RECORDING');
                setIsListening(true);

                if (isPcmCapable && workletNodeRef.current) {
                    workletNodeRef.current.port.onmessage = (event) => {
                        if (isPausedRef.current) return;
                        const pcmData = event.data;
                        if (ws.readyState === WebSocket.OPEN && pcmData instanceof ArrayBuffer) {
                            ws.send(pcmData);
                        }
                    };
                } else {
                    // iOS/Safari & WebView Fallback
                    const supportedTypes = [
                        'audio/webm;codecs=opus',
                        'audio/webm',
                        'audio/ogg;codecs=opus',
                        'audio/mp4',
                        'audio/aac'
                    ];

                    let mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
                    console.log(`[Scribe] 📱 Mobile/APK Recorder Init: ${mimeType}`);

                    const mediaRecorder = new MediaRecorder(audioStream, {
                        mimeType: mimeType,
                        audioBitsPerSecond: 128000
                    });
                    mediaRecorderRef.current = mediaRecorder;
                    mediaRecorder.ondataavailable = (e) => {
                        if (isPausedRef.current) return;
                        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                            ws.send(e.data);
                        }
                    };
                    mediaRecorder.start(250); // Balanced for mobile buffer stability
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Debug point: help confirm data is arriving on APK
                    if (data.channel) {
                        console.log('[Scribe] 📡 Data received from Deepgram');
                    }

                    const alt = data.channel?.alternatives?.[0];
                    const text = alt?.transcript || '';

                    if (text && text.length > 0) {
                        const isFinal = data.is_final === true;
                        if (isFinal) {
                            finalTextRef.current = (finalTextRef.current + ' ' + text).trim();
                            setInternalTranscript(finalTextRef.current);
                            setInterimTranscript('');
                        } else {
                            setInterimTranscript(text);
                        }
                    } else if (data.is_final) {
                        setInterimTranscript('');
                    }
                } catch (e) { /* ignore */ }
            };

            ws.onerror = (err) => {
                updateStatus('error');
            };

            ws.onclose = (ev) => {
                clearInterval(keepAlive);
                if (statusRef.current === 'connected') updateStatus('finished');
                setIsListening(false);
            };

        } catch (err: any) {
            clearTimeout(connectionTimeout);
            updateStatus('error');
            setRecordingState('ERROR');
            cleanup();
            setIsListening(false);
        }
    }, [cleanup, updateStatus]);

    const resetTranscript = useCallback(() => {
        setInternalTranscript('');
        setInterimTranscript('');
        finalTextRef.current = '';
    }, []);

    const setTranscript = useCallback((text: string) => {
        finalTextRef.current = text;
        setInternalTranscript(text);
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return {
        isListening,
        isPaused,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        togglePause,
        resetTranscript,
        setTranscript,
        error,
        clearError: useCallback(() => setError(null), []),
        connectionStatus,
        recordingState,
        stream
    };
}
