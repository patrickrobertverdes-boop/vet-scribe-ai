import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UseDeepgramReturn {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    clearError: () => void;
    error: string | null;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'finished';
    stream: MediaStream | null;
}

export function useDeepgram(): UseDeepgramReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
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

    const updateStatus = (newStatus: typeof connectionStatus) => {
        statusRef.current = newStatus;
        setConnectionStatus(newStatus);
    };

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
        updateStatus('finished');
    }, [cleanup]);

    const startListening = useCallback(async () => {
        if (statusRef.current === 'connecting' || statusRef.current === 'connected') return;

        console.log('[Scribe] 🎙️ Starting Live Connection (PCM Mode)...');
        cleanup();
        setError(null);
        updateStatus('connecting');
        setTranscript('');
        setInterimTranscript('');
        finalTextRef.current = '';

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
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            console.log('[Scribe] ✅ Microphone access granted (Raw PCM Capture)');

            setStream(audioStream);
            streamRef.current = audioStream;

            const isPcmCapable = !!(window.AudioWorklet && !/iPhone|iPad|iPod|Safari/i.test(navigator.userAgent));
            console.log(`[Scribe] Mode: ${isPcmCapable ? 'PCM (Optimized)' : 'MediaRecorder (Universal)'}`);

            // 3. Setup Audio Handler (Hybrid)
            if (isPcmCapable) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 16000,
                });
                audioContextRef.current = audioContext;

                await audioContext.resume();
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

            // --- KeepAlive mechanism ---
            const keepAlive = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'KeepAlive' }));
                }
            }, 5000);

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('🟢 [Scribe] Link established');
                toast.success(isPcmCapable ? 'Connected (PCM)' : 'Connected (Opus)');
                updateStatus('connected');
                setIsListening(true);

                if (isPcmCapable && workletNodeRef.current) {
                    workletNodeRef.current.port.onmessage = (event) => {
                        const pcmData = event.data;
                        if (ws.readyState === WebSocket.OPEN && pcmData instanceof ArrayBuffer) {
                            ws.send(pcmData);
                        }
                    };
                } else {
                    const mediaRecorder = new MediaRecorder(audioStream, {
                        mimeType: 'audio/webm;codecs=opus'
                    });
                    mediaRecorderRef.current = mediaRecorder;
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                            ws.send(e.data);
                        }
                    };
                    mediaRecorder.start(250);
                }

                console.log(`[Scribe] 📡 Streaming audio (${isPcmCapable ? 'PCM' : 'Opus'})...`);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const alt = data.channel?.alternatives?.[0];
                    const text = alt?.transcript || '';

                    if (text && text.length > 0) {
                        const isFinal = data.is_final === true;
                        console.log(`[Scribe] DG Message: "${text}" (final: ${isFinal})`);

                        if (isFinal) {
                            finalTextRef.current = (finalTextRef.current + ' ' + text).trim();
                            setTranscript(finalTextRef.current);
                            setInterimTranscript('');
                        } else {
                            setInterimTranscript(text);
                        }
                    } else if (data.is_final) {
                        setInterimTranscript('');
                    }
                } catch (e) {
                    console.error('[Scribe] Error parsing message:', e);
                }
            };

            ws.onerror = (err) => {
                console.error('🔴 [Scribe] Stream Error:', err);
                setError('Connection validation failed.');
                updateStatus('error');
            };

            ws.onclose = (ev) => {
                clearInterval(keepAlive);
                console.log('🟡 [Scribe] Link closed:', ev.code, ev.reason);
                if (statusRef.current === 'connected') updateStatus('finished');
                setIsListening(false);
            };

        } catch (err: any) {
            clearTimeout(connectionTimeout); // Clear timeout if init fails immediately
            console.error('❌ [Scribe] Fatal Error:', err);
            const msg = err.message || 'Initialization failed';
            setError(msg);
            toast.error(`Error: ${msg}`);
            updateStatus('error');
            cleanup();
            setIsListening(false); // Ensure UI resets
        }
    }, [cleanup]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript: () => {
            setTranscript('');
            setInterimTranscript('');
            finalTextRef.current = '';
        },
        error,
        clearError: () => setError(null),
        connectionStatus,
        stream
    };
}
