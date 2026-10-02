import React from 'react';
import { History, Sliders, Layers, Sparkles, DownloadCloud } from 'lucide-react';

interface HeaderProps {
  activeTab: 'single' | 'batch' | 'platforms' | 'history';
  setActiveTab: (tab: 'single' | 'batch' | 'platforms' | 'history') => void;
  historyCount: number;
  onOpenSettings: () => void;
  onQuickPaste: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  onOpenSettings,
  onQuickPaste
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('single')}
            className="group flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-inner">
              <DownloadCloud className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
            </div>
            <span className="text-xl font-bold tracking-tight">OmniSave</span>
          </button>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3.5 py-1.5 text-sm font-medium transition-colors rounded-md ${
              activeTab === 'single'
                ? 'bg-slate-800/80 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            Downloader
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-colors rounded-md ${
              activeTab === 'batch'
                ? 'bg-slate-800/80 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Batch Queue</span>
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-3.5 py-1.5 text-sm font-medium transition-colors rounded-md ${
              activeTab === 'platforms'
                ? 'bg-slate-800/80 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            Supported Platforms
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-colors rounded-md ${
              activeTab === 'history'
                ? 'bg-slate-800/80 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="font-mono text-xs tabular-nums text-slate-400">
                ({historyCount})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onQuickPaste}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-850/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
            title="Paste URL from clipboard"
          >
            <span>Paste Link</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
            aria-label="Settings"
          >
            <Sliders className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast Extract</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-[#0B0F17] px-4 py-2 justify-around">
        <button
          onClick={() => setActiveTab('single')}
          className={`text-xs font-medium px-2 py-1 ${activeTab === 'single' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Single
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`text-xs font-medium px-2 py-1 ${activeTab === 'batch' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Batch
        </button>
        <button
          onClick={() => setActiveTab('platforms')}
          className={`text-xs font-medium px-2 py-1 ${activeTab === 'platforms' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Platforms
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`text-xs font-medium px-2 py-1 ${activeTab === 'history' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          History ({historyCount})
        </button>
      </div>
    </header>
  );
};
