import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Download,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { DownloadHistoryEntry, PlatformType } from '../types';
import { clearDownloadHistory, triggerFileDownload } from '../utils/downloader';
import { PLATFORMS } from '../utils/platforms';

interface HistoryDrawerProps {
  history: DownloadHistoryEntry[];
  onRefreshHistory: () => void;
  onSelectUrl: (url: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onRefreshHistory,
  onSelectUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleClear = () => {
    if (confirm('Clear entire download history?')) {
      clearDownloadHistory();
      onRefreshHistory();
    }
  };

  const handleCopyLink = async (entry: DownloadHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.url);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReDownload = async (entry: DownloadHistoryEntry) => {
    const filename = `OmniSave_${entry.platform}_${entry.quality.replace(/\s+/g, '_')}_${entry.title.substring(0, 20)}.${entry.format.toLowerCase()}`;
    await triggerFileDownload(entry.downloadUrl, filename);
  };

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const headers = ['Title', 'Platform', 'Quality', 'Format', 'Size', 'Date', 'Source URL'];
    const rows = history.map(h => [
      `"${h.title.replace(/"/g, '""')}"`,
      h.platform,
      h.quality,
      h.format,
      h.sizeFormatted,
      h.downloadDate,
      `"${h.url}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OmniSave_History_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <HistoryIcon className="h-6 w-6 text-indigo-400" />
            <span>Download History & Library</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Locally saved media logs and re-download links stored in your browser session.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-900/50 hover:bg-red-950/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or link..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Platform interactive filter control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {['all', 'instagram', 'tiktok', 'youtube', 'twitter'].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedPlatform === plat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {plat === 'all' ? 'All Networks' : PLATFORMS[plat as PlatformType]?.name || plat}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      <div className="mt-6">
        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <HistoryIcon className="mx-auto h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No downloads found</p>
            <p className="mt-1 text-xs text-slate-500">
              Downloads you perform will appear here with instant re-download and file size metrics.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredHistory.map((entry) => {
              const platformConfig = PLATFORMS[entry.platform] || PLATFORMS.other;
              return (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt=""
                        className="h-11 w-11 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                    ) : (
                      <div
                        className="h-11 w-11 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                        style={{ backgroundColor: platformConfig.color }}
                      >
                        {platformConfig.badge}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-200 truncate">
                        {entry.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span style={{ color: platformConfig.color }} className="font-medium">
                          {platformConfig.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{entry.quality}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-300">{entry.sizeFormatted}</span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.downloadDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <button
                      onClick={() => handleCopyLink(entry)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white"
                      title="Copy URL"
                    >
                      {copiedId === entry.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden md:inline">Copy Link</span>
                    </button>

                    <button
                      onClick={() => onSelectUrl(entry.url)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white"
                      title="Re-inspect link in Downloader"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Inspect</span>
                    </button>

                    <button
                      onClick={() => handleReDownload(entry)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Re-Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
