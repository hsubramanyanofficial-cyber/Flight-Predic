import React, { useState } from 'react';
import * as api from '../services/api';
import { Video, Film, Sparkles, RefreshCw, AlertCircle, Download, Play, ShieldAlert } from 'lucide-react';

export const VideoGeneration: React.FC = () => {
  const [prompt, setPrompt] = useState('Cinematic aerial twilight view of a modern twin-engine commercial airliner descending through golden sunset clouds over Mumbai coastline and Bandra-Worli Sea Link');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoResult, setVideoResult] = useState<{ videoBase64: string; mimeType: string; aspectRatio: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    'Cinematic wide aerial drone shot of flight approach over Mumbai Sea Link at sunset',
    'Scenic high-altitude view of Airbus A320 cruising past the snow-capped Himalayan peaks into Srinagar',
    'Tropical aerial descent over Goa beaches with turquoise Arabian Sea and sunlit palm coast',
    'Modern night aerial approach into Delhi Indira Gandhi International Airport runway lights'
  ];

  const handleGenerate = async (promptToUse?: string) => {
    const text = promptToUse || prompt;
    if (!text || loading) return;

    setError(null);
    setLoading(true);

    try {
      const data = await api.generateRouteVideo({
        prompt: text,
        aspectRatio
      });
      setVideoResult(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
        'Video generation with gemini-omni-1.1-flash requires a billing-enabled API key in AI Studio Settings > Secrets. Please attach a paid key to render text-to-video.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
          <Film className="h-4 w-4" />
          <span>Interactions API Video Generation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Cinematic Flight Route Video Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Generate realistic travel videos from text prompts using <code className="text-sky-300">gemini-omni-1.1-flash</code> via the Gemini Interactions API. Choose landscape (16:9) or vertical mobile (9:16) aspect ratios.
        </p>
      </div>

      {/* Control Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Video Prompt
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the flight or destination scene you want to generate..."
            className="w-full p-3 text-xs text-white bg-slate-800/90 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 placeholder:text-slate-500 leading-relaxed"
          />
        </div>

        {/* Aspect Ratio and Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">Aspect Ratio:</span>
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  aspectRatio === '16:9'
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                16:9 Landscape
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  aspectRatio === '9:16'
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                9:16 Portrait
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading || !prompt.trim()}
            className="px-6 py-2.5 rounded-lg bg-sky-400 text-slate-950 text-xs font-semibold hover:bg-sky-300 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            <span>{loading ? 'Synthesizing Video (Omni Flash)...' : 'Generate Video'}</span>
          </button>

        </div>

        {/* Sample Inspiration Prompts */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 block mb-2 font-medium">Inspiration Prompts:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPrompt(p);
                  handleGenerate(p);
                }}
                disabled={loading}
                className="p-2.5 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-rose-200">Video Generation Notice</div>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Video Result Viewport */}
      {videoResult ? (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Play className="h-4 w-4 text-sky-400" />
              <span>Generated Route Video ({videoResult.aspectRatio})</span>
            </div>

            <a
              href={`data:${videoResult.mimeType};base64,${videoResult.videoBase64}`}
              download={`FPPS_flight_route_${Date.now()}.mp4`}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download MP4</span>
            </a>
          </div>

          <div className="flex justify-center bg-slate-950 rounded-xl p-2 overflow-hidden">
            <video
              src={`data:${videoResult.mimeType};base64,${videoResult.videoBase64}`}
              controls
              autoPlay
              loop
              className={`rounded-lg ${videoResult.aspectRatio === '9:16' ? 'max-h-[500px]' : 'w-full max-h-[450px]'}`}
            />
          </div>
        </div>
      ) : null}

    </div>
  );
};
