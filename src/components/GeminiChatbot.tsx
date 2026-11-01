import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { Bot, Send, Sparkles, User, Mic, MicOff, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export const GeminiChatbot: React.FC = () => {
  const { searchParams, setActiveTab } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_init',
      role: 'model',
      text: `Hello! I'm your **FPPS Airfare AI Advisor**. I can help you decode Indian domestic flight pricing, predict airfare movements, check DGCA passenger rights, and recommend the best times to book flights on IndiGo, Air India, Vistara, Akasa Air, and SpiceJet.\n\nHow can I help you plan your journey today?`,
      timestamp: new Date().toISOString(),
      modelUsed: 'gemini-3.8-flash'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Microphone recording for audio input transcription
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    `Best time to book ${searchParams.origin} to ${searchParams.destination}?`,
    'Explain DGCA compensation for flight delays > 4 hours',
    'IndiGo vs Vistara: Baggage and on-time reliability comparison',
    'How does Diwali festival season impact airfares in India?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await api.sendChatMessage({
        message: text,
        history: historyPayload,
        model: selectedModel
      });

      const modelMsg: ChatMessage = {
        id: `m_${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toISOString(),
        modelUsed: res.model
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Audio transcription using gemini-3.5-transcribe
  const startRecording = async () => {
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
            if (result.transcription) {
              setInputText(prev => (prev ? `${prev} ${result.transcription}` : result.transcription));
            }
          } catch (tErr) {
            console.error('Transcription error:', tErr);
          } finally {
            setTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone permission required for voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* Header with Model Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">FPPS Gemini Airfare Advisor</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Multi-Turn Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Indian aviation market specialist for tariffs, passenger rights, and booking strategy
            </p>
          </div>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Model:</span>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value as any)}
            className="bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-1.5 text-xs focus:outline-none font-medium"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (General Tasks)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
            <option value="gemini-4-argon">gemini-4-argon (Complex Tasks)</option>
          </select>
        </div>
      </div>

      {/* Chat Thread Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col h-[520px]">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 border border-slate-700 text-sky-400'
                }`}>
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-sky-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none space-y-2'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  
                  {!isUser && msg.modelUsed && (
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-700/60 flex items-center justify-between">
                      <span>Powered by {msg.modelUsed}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center text-xs font-bold">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" />
                <span>Thinking using {selectedModel}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Strip */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-slate-500 shrink-0 font-medium">Quick Prompts:</span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Composer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button (gemini-3.5-transcribe) */}
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`p-2.5 rounded-lg border transition ${
                recording
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : transcribing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title={recording ? 'Click to finish speaking' : 'Speak using microphone'}
            >
              {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                transcribing
                  ? 'Transcribing your voice with gemini-3.5-transcribe...'
                  : recording
                  ? 'Listening to microphone... click mic button when done'
                  : 'Ask about airfares, airlines, seasonal surges, or DGCA rights...'
              }
              disabled={loading || recording}
              className="flex-1 p-2.5 text-xs text-white bg-slate-800/90 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-lg bg-sky-400 text-slate-950 font-semibold hover:bg-sky-300 disabled:opacity-50 transition shadow-sm"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
