import React from 'react';
import {
  Check,
  Smartphone,
  Laptop,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { PLATFORMS } from '../utils/platforms';
import { PlatformType } from '../types';

interface PlatformsDirectoryProps {
  onSelectPlatformSample: (url: string) => void;
}

export const PlatformsDirectory: React.FC<PlatformsDirectoryProps> = ({
  onSelectPlatformSample
}) => {
  const platformList = Object.values(PLATFORMS);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Supported Social Networks & Features
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-400">
          OmniSave automatically inspects links and fetches media directly from server CDN nodes at original master resolution with zero degradation.
        </p>
      </div>

      {/* Platform Cards Grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {platformList.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-all hover:shadow-lg"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.badge}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-none">
                      {p.name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlatformSample(p.exampleUrl)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Test Sample</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                {p.description}
              </p>

              {/* Supported types checklist */}
              <div className="mt-4 space-y-1.5">
                {p.supportedTypes.map((type, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Status: Operational</span>
              <span>Bitrate: Lossless</span>
            </div>
          </div>
        ))}
      </div>

      {/* Guide: How to copy links from phone or desktop */}
      <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white">How to Download Any Social Media Post</h3>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mobile Guide */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">On Mobile (iOS & Android)</h4>
              <ol className="mt-2 space-y-1.5 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Open the Instagram, TikTok, YouTube, or X app.</li>
                <li>Tap the <strong className="text-slate-200">Share</strong> icon on any post or reel.</li>
                <li>Select <strong className="text-slate-200">Copy Link</strong>.</li>
                <li>Return to OmniSave and tap <strong className="text-slate-200">Paste Link</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Desktop Guide */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">On Desktop Browser</h4>
              <ol className="mt-2 space-y-1.5 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Navigate to any post on Instagram, YouTube, X, or Reddit.</li>
                <li>Copy the URL from your browser address bar (<strong className="text-slate-200">Ctrl+C / Cmd+C</strong>).</li>
                <li>Paste into the input bar above and hit <strong className="text-slate-200">Enter</strong>.</li>
                <li>Choose desired resolution (4K, 1080p, or MP3) and save.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
