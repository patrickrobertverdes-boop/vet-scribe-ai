import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

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
    stream: MediaStream | null;
}

export function useDeepgram(): UseDeepgramReturn {
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
    }, []);

    const stopListening = useCallback(() => {
        console.log('[Scribe] 🛑 Stopping...');
        cleanup();
        setIsListening(false);
        setIsPaused(false);
        isPausedRef.current = false;
        updateStatus('finished');
    }, [cleanup, updateStatus]);

    const togglePause = useCallback((paused: boolean) => {
        console.log(`[Scribe] ${paused ? '⏸️ Pausing' : '▶️ Resuming'}...`);
        setIsPaused(paused);
        isPausedRef.current = paused;

        // Manual restart on resume for MediaRecorder compatibility on mobile
        if (!paused && mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
            console.log('[Scribe] 🔄 Restarting MediaRecorder on resume...');
            try { mediaRecorderRef.current.start(250); } catch (e) { }
        } else if (paused && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('[Scribe] ⏹️ Stopping MediaRecorder on pause...');
            try { mediaRecorderRef.current.stop(); } catch (e) { }
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
            const isSafari = /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent);
            const isCapacitor = (window as any).Capacitor !== undefined;
            // Force MediaRecorder fallback for Capacitor/APK as AudioWorklet PCM is often unstable in WebViews
            const isPcmCapable = !!(window.AudioWorklet && !isSafari && !isCapacitor);

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
                    // Safari 14.1+ supports MediaRecorder but not 'audio/webm'
                    let mimeType = 'audio/mp4';
                    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                        mimeType = 'audio/webm;codecs=opus';
                    }

                    console.log(`[Scribe] 📱 Mobile/APK Recorder Init: ${mimeType}`);
                    const mediaRecorder = new MediaRecorder(audioStream, {
                        mimeType: mimeType
                    });
                    mediaRecorderRef.current = mediaRecorder;
                    mediaRecorder.ondataavailable = (e) => {
                        if (isPausedRef.current) return;
                        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                            ws.send(e.data);
                        }
                    };
                    mediaRecorder.start(250);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
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
        stream
    };
}
