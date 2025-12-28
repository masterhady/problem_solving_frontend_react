import { useState, useEffect, useRef, useCallback } from 'react';

interface RealtimeInterviewConfig {
    jobDescription?: string;
    sessionId?: string;
}

interface UseRealtimeInterviewReturn {
    isConnected: boolean;
    isSessionActive: boolean;
    transcript: Array<{ role: 'user' | 'assistant'; text: string }>;
    error: string | null;
    startInterview: (config: RealtimeInterviewConfig) => Promise<void>;
    stopInterview: () => void;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export const useRealtimeInterview = (): UseRealtimeInterviewReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);

    // Initialize audio playback
    const initAudioPlayback = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000,
            });
        }
    }, []);

    // Play audio chunk from AI
    const playAudioChunk = useCallback(async (audioBase64: string) => {
        if (!audioContextRef.current) {
            initAudioPlayback();
        }

        try {
            // Decode base64 to ArrayBuffer
            const binaryString = atob(audioBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Convert to Int16Array (PCM16)
            const pcm16 = new Int16Array(bytes.buffer);
            audioQueueRef.current.push(pcm16);

            // Start playback if not already playing
            if (!isPlayingRef.current) {
                playNextChunk();
            }
        } catch (err) {
            console.error('Error playing audio chunk:', err);
        }
    }, [initAudioPlayback]);

    // Play next audio chunk from queue
    const playNextChunk = useCallback(async () => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            return;
        }

        isPlayingRef.current = true;
        const pcm16 = audioQueueRef.current.shift()!;

        if (!audioContextRef.current) return;

        // Convert PCM16 to Float32
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768.0;
        }

        // Create audio buffer
        const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        // Play
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            playNextChunk();
        };
        source.start();
    }, []);

    // Start capturing microphone audio
    const startAudioCapture = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Create audio context for processing
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000,
            });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);

                // Convert Float32 to PCM16
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Convert to base64 and send
                const bytes = new Uint8Array(pcm16.buffer);
                const binary = String.fromCharCode(...bytes);
                const base64 = btoa(binary);

                wsRef.current.send(JSON.stringify({
                    type: 'audio',
                    audio: base64,
                }));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Failed to access microphone. Please grant permission.');
        }
    }, []);

    // Stop audio capture
    const stopAudioCapture = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);

    // Start interview
    const startInterview = useCallback(async (config: RealtimeInterviewConfig) => {
        try {
            setConnectionStatus('connecting');
            setError(null);

            // Get WebSocket URL (adjust based on your backend URL)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/realtime-interview/`;

            // Connect to WebSocket
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setConnectionStatus('connected');

                // Start session
                ws.send(JSON.stringify({
                    type: 'start_session',
                    job_description: config.jobDescription || '',
                    session_id: config.sessionId || `session_${Date.now()}`,
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'session_started':
                            setIsSessionActive(true);
                            startAudioCapture();
                            break;

                        case 'audio_delta':
                            // Play audio chunk from AI
                            playAudioChunk(data.audio);
                            break;

                        case 'transcript_delta':
                            // Update transcript with AI response
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.role === 'assistant') {
                                    return [...prev.slice(0, -1), { role: 'assistant', text: last.text + data.text }];
                                }
                                return [...prev, { role: 'assistant', text: data.text }];
                            });
                            break;

                        case 'user_transcript':
                            // Add user's speech to transcript
                            setTranscript(prev => [...prev, { role: 'user', text: data.text }]);
                            break;

                        case 'error':
                            console.error('Server error:', data.message);
                            setError(data.message);
                            setConnectionStatus('error');
                            break;

                        case 'session_ended':
                            setIsSessionActive(false);
                            stopAudioCapture();
                            break;

                        default:
                            console.log('Unhandled message type:', data.type);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Connection error occurred');
                setConnectionStatus('error');
            };

            ws.onclose = () => {
                console.log('WebSocket closed');
                setIsConnected(false);
                setIsSessionActive(false);
                setConnectionStatus('disconnected');
                stopAudioCapture();
            };
        } catch (err) {
            console.error('Error starting interview:', err);
            setError('Failed to start interview');
            setConnectionStatus('error');
        }
    }, [startAudioCapture, stopAudioCapture, playAudioChunk]);

    // Stop interview
    const stopInterview = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({ type: 'stop_session' }));
            wsRef.current.close();
            wsRef.current = null;
        }

        stopAudioCapture();
        setIsSessionActive(false);
        setConnectionStatus('disconnected');
    }, [stopAudioCapture]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopInterview();
        };
    }, [stopInterview]);

    return {
        isConnected,
        isSessionActive,
        transcript,
        error,
        startInterview,
        stopInterview,
        connectionStatus,
    };
};
