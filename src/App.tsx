import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroInput } from './components/HeroInput';
import { MediaResultCard } from './components/MediaResultCard';
import { BatchDownloader } from './components/BatchDownloader';
import { PlatformsDirectory } from './components/PlatformsDirectory';
import { HistoryDrawer } from './components/HistoryDrawer';
import { QrCodeModal } from './components/QrCodeModal';
import { TrimClipModal } from './components/TrimClipModal';
import { SettingsModal, loadSettings } from './components/SettingsModal';
import { MediaItem, DownloadHistoryEntry } from './types';
import { resolveMedia } from './utils/resolver';
import { getDownloadHistory } from './utils/downloader';
import { Sparkles, Shield, Zap, RefreshCw, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'platforms' | 'history'>('single');
  const [url, setUrl] = useState('');
  const [resolvedItem, setResolvedItem] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<DownloadHistoryEntry[]>([]);

  // Modals state
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{ url: string; title: string }>({ url: '', title: '' });
  const [isTrimmerOpen, setIsTrimmerOpen] = useState(false);
  const [trimItem, setTrimItem] = useState<MediaItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load history and settings on mount
  useEffect(() => {
    refreshHistory();
    const settings = loadSettings();
    setRemoveWatermark(settings.autoRemoveWatermark);
  }, []);

  const refreshHistory = () => {
    setHistory(getDownloadHistory());
  };

  const handleExtract = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const item = await resolveMedia(targetUrl, removeWatermark);
      setResolvedItem(item);
      setActiveTab('single');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unable to inspect media. Please check URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().startsWith('http')) {
        setUrl(text.trim());
        handleExtract(text.trim());
      } else {
        setActiveTab('single');
      }
    } catch {
      setActiveTab('single');
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    handleExtract(sampleUrl);
  };

  const handleOpenQr = (downloadUrl: string, title: string) => {
    setQrData({ url: downloadUrl, title });
    setIsQrOpen(true);
  };

  const handleOpenTrimmer = (item: MediaItem) => {
    setTrimItem(item);
    setIsTrimmerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-indigo-200">
      {/* Strict 3-zone Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickPaste={handleQuickPaste}
      />

      {/* Main Viewport Content */}
      <main className="flex-1">
        {activeTab === 'single' && (
          <>
            <HeroInput
              url={url}
              setUrl={setUrl}
              onExtract={handleExtract}
              isLoading={isLoading}
              removeWatermark={removeWatermark}
              setRemoveWatermark={setRemoveWatermark}
              errorMessage={errorMessage}
            />

            {/* Dominant Visual Anchor: Media Result Card */}
            {resolvedItem && (
              <MediaResultCard
                item={resolvedItem}
                onOpenTrimmer={handleOpenTrimmer}
                onOpenQr={handleOpenQr}
                onDownloadCompleted={refreshHistory}
              />
            )}

            {/* Feature Highlights Grid */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-slate-800/80">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  High-Speed Extraction Engine
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  Engineered with server-side CDN streaming, lossless audio isolation, and direct format transcoders.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 mb-4">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-semibold text-white">Full Resolution 4K & 1080p</h4>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    Preserves original bitrates, 60fps frame rates, and color depth directly from content delivery networks without aggressive compression.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 mb-4">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-semibold text-white">Zero Watermark Removal</h4>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    Extracts raw video streams directly from TikTok, Instagram Reels, and Shorts without superimposed creator tags or platform logos.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 mb-4">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-semibold text-white">Lossless MP3 Soundtracks</h4>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    Isolate trending sounds, voice tracks, and audio samples at 320 kbps bitrates with one-click instant audio export.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'batch' && (
          <BatchDownloader onDownloadCompleted={refreshHistory} />
        )}

        {activeTab === 'platforms' && (
          <PlatformsDirectory onSelectPlatformSample={handleSelectSample} />
        )}

        {activeTab === 'history' && (
          <HistoryDrawer
            history={history}
            onRefreshHistory={refreshHistory}
            onSelectUrl={(selectedUrl) => {
              setUrl(selectedUrl);
              setActiveTab('single');
              handleExtract(selectedUrl);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        downloadUrl={qrData.url}
        title={qrData.title}
      />

      <TrimClipModal
        isOpen={isTrimmerOpen}
        onClose={() => {
          setIsTrimmerOpen(false);
          setTrimItem(null);
        }}
        item={trimItem}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Clean Footer (Anti-Slop: No fake telemetry tickers) */}
      <footer className="border-t border-slate-800/80 bg-[#070A10] py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">OmniSave</span>
            <span aria-hidden="true">·</span>
            <span>Universal Media Extraction & Archival Tool</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActiveTab('platforms')} className="hover:text-white">
              Platforms
            </button>
            <button onClick={() => setActiveTab('batch')} className="hover:text-white">
              Batch Queue
            </button>
            <button onClick={() => setActiveTab('history')} className="hover:text-white">
              History
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-white">
              Preferences
            </button>
          </div>

          <div>
            <span>Downloaded content is intended for personal archival purposes.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
