import React, { useState } from 'react';
import {
  Layers,
  FileArchive,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';
import { BatchTask, MediaItem } from '../types';
import { resolveMedia } from '../utils/resolver';
import { downloadAllAsZip, triggerFileDownload, saveToHistory } from '../utils/downloader';
import { detectPlatformFromUrl, PLATFORMS } from '../utils/platforms';

export const BatchDownloader: React.FC<{ onDownloadCompleted?: () => void }> = ({
  onDownloadCompleted
}) => {
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [batchZipProgress, setBatchZipProgress] = useState<string | null>(null);

  // Pre-load sample URLs
  const handleLoadSampleBatch = () => {
    const samples = [
      'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      'https://www.instagram.com/reel/C8qP8q0vdEa/',
      'https://www.tiktok.com/@kenjiofficial/video/7382910482910',
      'https://x.com/tech_visuals/status/1798329482901',
      'https://www.pinterest.com/pin/914090049382109/'
    ];
    setInputText(samples.join('\n'));
  };

  const handleAddToQueue = async () => {
    const lines = inputText
      .split('\n')
      .map(l => l.trim())
      .filter(l => Boolean(l) && l.startsWith('http'));

    if (lines.length === 0) return;

    const newTasks: BatchTask[] = lines.map((url, i) => ({
      id: `task_${Date.now()}_${i}`,
      url,
      status: 'pending',
      progress: 0
    }));

    setTasks(prev => [...prev, ...newTasks]);
    setInputText('');

    // Automatically trigger resolution
    processQueue(newTasks);
  };

  const processQueue = async (itemsToProcess: BatchTask[]) => {
    setIsProcessingQueue(true);

    for (const task of itemsToProcess) {
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: 'resolving', progress: 30 } : t))
      );

      try {
        const item = await resolveMedia(task.url, true);
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  status: 'ready',
                  progress: 100,
                  item,
                  selectedFormatId: item.formats[0]?.id || '1080p'
                }
              : t
          )
        );
      } catch (err: any) {
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  status: 'error',
                  error: err.message || 'Failed to inspect link'
                }
              : t
          )
        );
      }
    }

    setIsProcessingQueue(false);
  };

  // Download single item in batch
  const handleDownloadTask = async (task: BatchTask) => {
    if (!task.item) return;
    const format = task.item.formats.find(f => f.id === task.selectedFormatId) || task.item.formats[0];
    if (!format) return;

    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: 'downloading', progress: 40 } : t))
    );

    try {
      const filename = `OmniSave_${task.item.platform}_${task.item.title.substring(0, 25)}.${format.format}`;
      await triggerFileDownload(format.downloadUrl, filename);
      saveToHistory(task.item, format);
      if (onDownloadCompleted) onDownloadCompleted();

      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t))
      );
    } catch {
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: 'ready', progress: 100 } : t))
      );
    }
  };

  // Download all ready items as a single ZIP archive
  const handleDownloadAllZip = async () => {
    const readyTasks = tasks.filter(t => t.item && t.status !== 'error');
    if (readyTasks.length === 0) return;

    try {
      setBatchZipProgress('Preparing files...');
      const filesToZip = readyTasks.map((t, idx) => {
        const fmt = t.item!.formats.find(f => f.id === t.selectedFormatId) || t.item!.formats[0];
        return {
          url: fmt.downloadUrl,
          filename: `${idx + 1}_${t.item!.platform}_${t.item!.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}.${fmt.format}`
        };
      });

      await downloadAllAsZip(
        filesToZip,
        `OmniSave_Batch_${readyTasks.length}_Items_${Date.now()}.zip`,
        (pct, msg) => {
          setBatchZipProgress(`${msg} (${pct}%)`);
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setBatchZipProgress(null), 1500);
    }
  };

  const handleClearQueue = () => {
    setTasks([]);
  };

  const readyCount = tasks.filter(t => t.status === 'ready' || t.status === 'completed').length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-400" />
            <span>Multi-URL Batch Downloader</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Queue up to 20 links from Instagram, TikTok, YouTube, X, and Pinterest to download simultaneously or save all as a ZIP archive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <button
              onClick={handleClearQueue}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Queue</span>
            </button>
          )}

          {readyCount > 0 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={Boolean(batchZipProgress)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              <FileArchive className="h-4 w-4" />
              <span>{batchZipProgress || `Download All as ZIP (${readyCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-URL Input Box */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Paste Links (One URL per line):
        </label>
        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`https://www.instagram.com/reel/...\nhttps://www.tiktok.com/@creator/video/...\nhttps://www.youtube.com/watch?v=...\nhttps://x.com/...`}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLoadSampleBatch}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Load 5 Multi-Platform Sample URLs</span>
          </button>

          <button
            type="button"
            onClick={handleAddToQueue}
            disabled={!inputText.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Add to Queue & Resolve</span>
          </button>
        </div>
      </div>

      {/* Queue items listing */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Queue Tasks ({tasks.length})
          </span>
          {isProcessingQueue && (
            <div className="flex items-center gap-2 text-xs text-indigo-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Resolving links...</span>
            </div>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <Layers className="mx-auto h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">Queue is currently empty</p>
            <p className="mt-1 text-xs text-slate-500">
              Paste multiple links above or click "Load 5 Multi-Platform Sample URLs" to test batch downloading.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, idx) => {
              const platform = detectPlatformFromUrl(task.url);
              const platformInfo = PLATFORMS[platform];

              return (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 gap-4 hover:border-slate-700 transition-colors"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
                      #{idx + 1}
                    </span>

                    {task.item?.thumbnail ? (
                      <img
                        src={task.item.thumbnail}
                        alt="Preview"
                        className="h-12 w-12 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                        style={{ backgroundColor: platformInfo.color }}
                      >
                        {platformInfo.badge}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: platformInfo.color }}
                        />
                        <span className="text-xs font-semibold text-slate-300 truncate">
                          {task.item?.title || task.url}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{platformInfo.name}</span>
                        {task.item && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{task.item.durationFormatted}</span>
                            <span aria-hidden="true">·</span>
                            <span>{task.item.author.handle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Format selector & Status / Download action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    {task.status === 'resolving' && (
                      <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Resolving...</span>
                      </div>
                    )}

                    {task.status === 'error' && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>{task.error || 'Error'}</span>
                      </div>
                    )}

                    {task.item && task.status !== 'error' && (
                      <div className="flex items-center gap-2">
                        <select
                          value={task.selectedFormatId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTasks(prev =>
                              prev.map(t =>
                                t.id === task.id ? { ...t, selectedFormatId: val } : t
                              )
                            );
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:outline-none"
                        >
                          {task.item.formats.map((fmt) => (
                            <option key={fmt.id} value={fmt.id}>
                              {fmt.quality} ({fmt.sizeFormatted})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleDownloadTask(task)}
                          disabled={task.status === 'downloading'}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            task.status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500'
                          }`}
                        >
                          {task.status === 'downloading' ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : task.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
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
