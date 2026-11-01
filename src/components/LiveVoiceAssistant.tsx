import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, Radio } from 'lucide-react';

export const LiveVoiceAssistant: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Click "Start Voice Session" to speak in real-time with gemini-3.8-live.');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  // PCM Float32 to 16-bit Linear PCM Base64 converter
  const pcmFloat32ToBase64 = (float32Array: Float32Array): string => {
    const l16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      l16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(l16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Playback 24kHz PCM from base64 chunks
  const playAudioChunk = (audioCtx: AudioContext, base64Pcm: string) => {
    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;

      setSpeaking(true);
      source.onended = () => {
        if (audioCtx.currentTime >= nextPlayTimeRef.current - 0.05) {
          setSpeaking(false);
        }
      };
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  };

  const startLiveSession = async () => {
    setError(null);
    setConnecting(true);
    setStatusMessage('Connecting to Live WebSocket session (gemini-3.8-live)...');

    try {
      // 1. Initialize audio contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      // 2. Capture microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect to server-side WebSocket proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live-voice`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setConnecting(false);
        setStatusMessage('Live Voice session connected. Speak naturally into your microphone!');

        // Setup microphone processor
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputChannel = e.inputBuffer.getChannelData(0);
            const base64Audio = pcmFloat32ToBase64(inputChannel);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio && outputAudioCtxRef.current) {
            playAudioChunk(outputAudioCtxRef.current, msg.audio);
          }
          if (msg.interrupted) {
            // User interrupted model; clear queue
            if (outputAudioCtxRef.current) {
              nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setSpeaking(false);
          }
          if (msg.error) {
            setError(msg.error);
          }
        } catch (mErr) {
          console.error(mErr);
        }
      };

      ws.onerror = (wErr) => {
        console.error('WebSocket error:', wErr);
        setError('Live WebSocket error. Ensure backend server is running.');
        disconnectLiveSession();
      };

      ws.onclose = () => {
        setConnected(false);
        setConnecting(false);
        setStatusMessage('Live Voice session ended.');
      };

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start microphone or Live session.');
      disconnectLiveSession();
    }
  };

  const disconnectLiveSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
    setSpeaking(false);
  };

  useEffect(() => {
    return () => {
      disconnectLiveSession();
    };
  }, []);

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto text-center">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
          <Radio className="h-4 w-4" />
          <span>Real-time Voice Conversation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Gemini Live Voice Concierge
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          Powered by <code className="text-sky-300">gemini-3.8-live</code> via the Live API. Experience natural, bidirectional spoken voice conversation with ultra-low latency audio streaming.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Voice Orb Card */}
      <div className="p-10 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl space-y-8 flex flex-col items-center">
        
        {/* Pulsing Visual Orb */}
        <div className="relative flex items-center justify-center">
          {connected && (
            <div className={`absolute h-48 w-48 rounded-full transition-all duration-300 ${
              speaking
                ? 'bg-sky-400/20 scale-125 animate-pulse'
                : 'bg-emerald-400/15 scale-110 animate-ping opacity-60'
            }`} />
          )}

          <div className={`h-36 w-36 rounded-full border flex items-center justify-center transition-all duration-300 shadow-xl ${
            connected
              ? speaking
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-4 ring-sky-500/30'
                : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/30'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {speaking ? (
              <Volume2 className="h-14 w-14 animate-bounce" />
            ) : connected ? (
              <Mic className="h-14 w-14 animate-pulse" />
            ) : (
              <MicOff className="h-14 w-14 opacity-50" />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white">
            {connected
              ? speaking
                ? 'Gemini Live Speaking (24kHz audio)...'
                : 'Listening to your voice (16kHz PCM)...'
              : 'Voice Session Inactive'}
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusMessage}
          </p>
        </div>

        {/* Action Button */}
        <div>
          {connected ? (
            <button
              onClick={disconnectLiveSession}
              className="px-6 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition"
            >
              End Voice Session
            </button>
          ) : (
            <button
              onClick={startLiveSession}
              disabled={connecting}
              className="px-8 py-3 rounded-xl bg-sky-400 text-slate-950 hover:bg-sky-300 text-xs font-bold transition flex items-center gap-2 shadow-lg"
            >
              <Mic className="h-4 w-4" />
              <span>{connecting ? 'Connecting Live...' : 'Start Voice Session'}</span>
            </button>
          )}
        </div>

        {/* Specifications strip */}
        <div className="pt-4 border-t border-slate-800/80 w-full grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-500">
          <div>Model: <span className="text-slate-300">gemini-3.8-live</span></div>
          <div>Mic: <span className="text-slate-300">16kHz PCM</span></div>
          <div>Voice: <span className="text-slate-300">Zephyr (24kHz)</span></div>
        </div>

      </div>

    </div>
  );
};
