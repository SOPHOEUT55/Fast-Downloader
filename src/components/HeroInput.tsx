import React, { useRef } from 'react';
import {
  Link2,
  Clipboard,
  X,
  ArrowRight,
  ShieldCheck,
  Video,
  Music,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { detectPlatformFromUrl, PLATFORMS, SAMPLE_QUICK_LINKS, SampleQuickLink } from '../utils/platforms';

interface HeroInputProps {
  url: string;
  setUrl: (url: string) => void;
  onExtract: (overrideUrl?: string) => void;
  isLoading: boolean;
  removeWatermark: boolean;
  setRemoveWatermark: (val: boolean) => void;
  errorMessage?: string | null;
}

export const HeroInput: React.FC<HeroInputProps> = ({
  url,
  setUrl,
  onExtract,
  isLoading,
  removeWatermark,
  setRemoveWatermark,
  errorMessage
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pasteSuccess, setPasteSuccess] = React.useState(false);

  const detectedPlatform = detectPlatformFromUrl(url);
  const platformInfo = PLATFORMS[detectedPlatform];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 1500);
        if (inputRef.current) inputRef.current.focus();
      }
    } catch {
      // In case clipboard permission is rejected, focus input
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      onExtract();
    }
  };

  const handleSampleClick = (sample: SampleQuickLink) => {
    setUrl(sample.url);
    onExtract(sample.url);
  };

  return (
    <section className="relative pt-8 pb-10 sm:pt-12 sm:pb-14">
      {/* Background ambient subtle glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-20 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div className="aspect-[1108/432] w-[69.25rem] flex-none bg-gradient-to-r from-indigo-600/15 via-violet-500/15 to-purple-500/10 opacity-70" />
      </div>

      <div className="mx-auto max-w-4xl text-center px-4 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
          Universal Social Media <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">Downloader</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal text-balance">
          Save high-definition videos, audio, carousels, and stories from Instagram, TikTok, YouTube, X, Facebook, and Pinterest in 4K, 1080p, and MP3.
        </p>

        {/* Input Bar Form */}
        <div className="mt-8 relative">
          <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Platform Detection Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 border-b sm:border-b-0 sm:border-r border-slate-800 shrink-0">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: platformInfo.color }}
                />
                <span className="font-semibold text-slate-200">
                  {url.trim() ? platformInfo.name : 'Auto Detect'}
                </span>
              </div>

              {/* Main Text Input */}
              <div className="relative flex-1 flex items-center min-w-0">
                <Link2 className="absolute left-3 h-5 w-5 text-slate-500 pointer-events-none shrink-0" />
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste Instagram, TikTok, YouTube, X, or Pinterest link..."
                  className="w-full bg-transparent pl-11 pr-10 py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
                  autoComplete="off"
                  spellCheck="false"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors"
                    title="Clear link"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons in Bar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-750 hover:text-white transition-colors"
                >
                  {pasteSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-300">Pasted</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" />
                      <span>Paste</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onExtract()}
                  disabled={isLoading || !url.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <span>Extract Media</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Options under input: Watermark removal toggle & Feature capabilities */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={removeWatermark}
                onChange={(e) => setRemoveWatermark(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>Remove Platform Watermark (Clean HD)</span>
              </span>
            </label>

            <div className="hidden sm:flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3 text-indigo-400" />
                <span>Up to 4K 60fps</span>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3 text-indigo-400" />
                <span>MP3 320kbps</span>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3 text-indigo-400" />
                <span>Original Photos</span>
              </span>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 text-left">
              {errorMessage}
            </div>
          )}
        </div>

        {/* 1-Click Test Drive Samples */}
        <div className="mt-7 text-left">
          <div className="text-xs font-medium text-slate-400 mb-2">
            Or try instant 1-click test link:
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUICK_LINKS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all text-left"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: PLATFORMS[sample.platform].color }}
                />
                <span className="font-medium text-slate-200">{sample.title}</span>
                <span className="text-slate-500 font-mono text-[11px]">({sample.tag})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
