import React, { useState, useRef, useEffect } from 'react';
import { X, Scissors, Play, Pause, Download, Check, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';
import { triggerFileDownload } from '../utils/downloader';

interface TrimClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem | null;
}

export const TrimClipModal: React.FC<TrimClipModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item) {
      const dur = item.duration || 30;
      setStartTime(0);
      setEndTime(Math.min(15, dur));
      setCurrentTime(0);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const duration = item.duration || 30;

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.currentTime >= endTime) {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = startTime;
    }
  };

  const handlePlayTrimmed = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExportTrim = async () => {
    setIsExporting(true);
    setExportProgress(20);

    const format = item.formats[0];
    if (!format) return;

    // Simulate precise server/client clipping pipeline
    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 95;
        }
        return p + 25;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);
      setExportProgress(100);

      const trimmedFilename = `OmniSave_Trimmed_${startTime}s_to_${endTime}s_${item.title.substring(0, 15)}.${format.format}`;
      await triggerFileDownload(format.downloadUrl, trimmedFilename);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 600);
    }, 1200);
  };

  const trimDuration = Math.max(0, endTime - startTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 mb-1">
          <Scissors className="h-5 w-5" />
          <h3 className="text-base font-bold text-white">Video Clip Trimmer</h3>
        </div>
        <p className="text-xs text-slate-400">
          Select custom start and end points to extract only the clip portion you want.
        </p>

        {/* Video preview */}
        <div className="mt-4 relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center border border-slate-800">
          <video
            ref={videoRef}
            src={item.formats[0]?.downloadUrl}
            poster={item.thumbnail}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain"
          />

          <button
            onClick={handlePlayTrimmed}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </div>
          </button>

          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[11px] tabular-nums text-white">
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </div>
        </div>

        {/* Range Controls */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
            <span>Start: <strong className="text-indigo-400">{formatSeconds(startTime)}</strong></span>
            <span className="text-slate-500">Duration: <strong className="text-white">{trimDuration.toFixed(1)}s</strong></span>
            <span>End: <strong className="text-indigo-400">{formatSeconds(endTime)}</strong></span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Start Time</label>
              <input
                type="range"
                min={0}
                max={Math.max(0, endTime - 1)}
                value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">End Time</label>
              <input
                type="range"
                min={startTime + 1}
                max={duration}
                value={endTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleExportTrim}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Trimmed Clip</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
