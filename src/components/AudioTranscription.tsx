import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { Mic, MicOff, RefreshCw, Copy, Check, ArrowRight, Volume2, Sparkles, AlertCircle } from 'lucide-react';

export const AudioTranscription: React.FC = () => {
  const { setSearchParams, setActiveTab } = useApp();

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        clearInterval(timerIntervalRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          setTranscribing(true);
          try {
            const result = await api.transcribeAudio({
              audioBase64: base64Data,
              mimeType: 'audio/webm'
            });
            setTranscription(result.transcription);
          } catch (tErr: any) {
            setError(tErr.message || 'Audio transcription failed.');
          } finally {
            setTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError('Microphone access was denied or is not supported by your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Try extracting route if mentioned
  const extractAndSearch = () => {
    const text = transcription.toUpperCase();
    if (text.includes('MUMBAI') || text.includes('BOM')) {
      setSearchParams(prev => ({ ...prev, destination: 'BOM' }));
    }
    if (text.includes('DELHI') || text.includes('DEL')) {
      setSearchParams(prev => ({ ...prev, origin: 'DEL' }));
    }
    if (text.includes('BANGALORE') || text.includes('BENGALURU') || text.includes('BLR')) {
      setSearchParams(prev => ({ ...prev, destination: 'BLR' }));
    }
    if (text.includes('GOA') || text.includes('GOI')) {
      setSearchParams(prev => ({ ...prev, destination: 'GOI' }));
    }
    setActiveTab('search');
  };

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
          <Volume2 className="h-4 w-4" />
          <span>Speech-to-Text Transcription</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Microphone Voice Transcriber
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          Powered by dedicated audio transcription model <code className="text-sky-300">gemini-3.5-transcribe</code>. Speak your flight preferences, travel plans, or questions into the microphone.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recording Controller Card */}
      <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col items-center space-y-6">
        
        {/* Big Mic Button */}
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing}
          className={`h-24 w-24 rounded-full border flex items-center justify-center transition shadow-2xl ${
            recording
              ? 'bg-rose-500 border-rose-400 text-white animate-pulse ring-8 ring-rose-500/20'
              : transcribing
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-sky-400 hover:border-slate-600 hover:scale-105'
          }`}
        >
          {transcribing ? (
            <RefreshCw className="h-10 w-10 animate-spin" />
          ) : recording ? (
            <MicOff className="h-10 w-10" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </button>

        {/* Timer & Status */}
        <div className="text-center space-y-1">
          <div className="text-base font-bold text-white">
            {recording
              ? `Recording Audio (${recordingDuration}s)`
              : transcribing
              ? 'Transcribing with gemini-3.5-transcribe...'
              : 'Click to Record Microphone'}
          </div>
          <p className="text-xs text-slate-400">
            {recording
              ? 'Speak clearly into your microphone, then click again when finished.'
              : 'Supports Hindi, English, and Hinglish flight queries.'}
          </p>
        </div>

      </div>

      {/* Transcription Output */}
      {transcription && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span>Transcribed Speech</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700 bg-slate-800 flex items-center gap-1 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs leading-relaxed font-medium">
            "{transcription}"
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={extractAndSearch}
              className="px-5 py-2.5 rounded-lg bg-sky-400 text-slate-950 font-semibold text-xs hover:bg-sky-300 transition flex items-center gap-2 shadow-sm"
            >
              <span>Search Flights with this Query</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
