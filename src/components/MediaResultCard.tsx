import React, { useState, useRef } from 'react';
import {
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Scissors,
  QrCode,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Share2,
  Music,
  Video,
  Image as ImageIcon,
  FileArchive,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { MediaFormat, MediaItem, CarouselItem } from '../types';
import { PLATFORMS } from '../utils/platforms';
import { downloadAllAsZip, saveToHistory, triggerFileDownload } from '../utils/downloader';

interface MediaResultCardProps {
  item: MediaItem;
  onOpenTrimmer: (item: MediaItem) => void;
  onOpenQr: (downloadUrl: string, title: string) => void;
  onDownloadCompleted?: () => void;
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({
  item,
  onOpenTrimmer,
  onOpenQr,
  onDownloadCompleted
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'images'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [downloadingFormatId, setDownloadingFormatId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [zipProgress, setZipProgress] = useState<string | null>(null);
  const [showEmbedPlayer, setShowEmbedPlayer] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const platformInfo = PLATFORMS[item.platform];

  // Video playback controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(item.caption || item.title);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyTags = async () => {
    try {
      const tagText = item.tags.map(t => `#${t}`).join(' ');
      await navigator.clipboard.writeText(tagText);
      setCopiedTags(true);
      setTimeout(() => setCopiedTags(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Perform single download
  const handleDownload = async (format: MediaFormat) => {
    try {
      setDownloadingFormatId(format.id);
      setDownloadProgress(20);

      const filename = `OmniSave_${item.platform}_${format.id}_${item.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)}.${format.format}`;

      await triggerFileDownload(format.downloadUrl, filename, (pct) => {
        setDownloadProgress(pct);
      });

      saveToHistory(item, format);
      if (onDownloadCompleted) onDownloadCompleted();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => {
        setDownloadingFormatId(null);
        setDownloadProgress(0);
      }, 800);
    }
  };

  // Download all carousel items as zip
  const handleDownloadCarouselZip = async () => {
    if (!item.carouselItems || item.carouselItems.length === 0) return;
    try {
      setZipProgress('Starting ZIP creation...');
      const files = item.carouselItems.map((c, i) => ({
        url: c.downloadUrl,
        filename: `slide_${i + 1}_${c.id}.${c.type === 'video' ? 'mp4' : 'jpg'}`
      }));

      await downloadAllAsZip(files, `OmniSave_${item.platform}_Carousel_${Date.now()}.zip`, (pct, msg) => {
        setZipProgress(`${msg} (${pct}%)`);
      });
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setTimeout(() => setZipProgress(null), 1500);
    }
  };

  const videoFormats = item.formats.filter(f => f.type === 'video');
  const audioFormats = item.formats.filter(f => f.type === 'audio');
  const imageFormats = item.formats.filter(f => f.type === 'image');

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-16">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Top Header bar inside card */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: platformInfo.color }}
            >
              {platformInfo.name}
            </span>
            <span className="text-xs text-slate-400">
              Resolved in <span className="font-mono text-slate-300">0.4s</span>
            </span>
            {item.watermarkRemoved && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Clean HD (No Watermark)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTrimmer(item)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
              title="Trim clip before downloading"
            >
              <Scissors className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Trim Video</span>
            </button>

            <button
              onClick={() => onOpenQr(item.formats[0]?.downloadUrl || item.url, item.title)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
              title="Download directly on your phone via QR Code"
            >
              <QrCode className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">QR to Phone</span>
            </button>
          </div>
        </div>

        {/* Content Body: Media Left, Download Options Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Interactive Media Preview */}
          <div className="lg:col-span-5 bg-black/60 p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="relative overflow-hidden rounded-xl bg-slate-950 aspect-video lg:aspect-[4/3] flex items-center justify-center">
              {item.mediaType === 'carousel' && item.carouselItems && item.carouselItems.length > 0 ? (
                // Carousel Image Viewer
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={item.carouselItems[activeCarouselIndex]?.previewUrl || item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                  {/* Next / Prev buttons */}
                  {item.carouselItems.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveCarouselIndex((prev) =>
                            prev === 0 ? item.carouselItems!.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveCarouselIndex((prev) =>
                            prev === item.carouselItems!.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-mono tabular-nums text-white">
                        {activeCarouselIndex + 1} / {item.carouselItems.length}
                      </div>
                    </>
                  )}
                </div>
              ) : showEmbedPlayer && item.embedUrl ? (
                // Real Live Interactive Platform Embed Player
                <div className="relative w-full h-full">
                  <iframe
                    src={item.embedUrl}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0 rounded-xl bg-black"
                  />
                  <button
                    onClick={() => setShowEmbedPlayer(false)}
                    className="absolute top-2 right-2 rounded-md bg-black/80 px-2 py-1 text-[11px] font-medium text-white hover:bg-black/95 transition-colors shadow-md z-20"
                  >
                    Close Player
                  </button>
                </div>
              ) : (
                // Interactive Video Player
                <div className="relative w-full h-full group flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={item.previewVideoUrl || '/media/nature_1080p.mp4'}
                    poster={item.thumbnail}
                    playsInline
                    loop
                    controls={false}
                    className="max-h-full max-w-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Toggle button to open real embed player if available */}
                  {item.embedUrl && (
                    <button
                      onClick={() => setShowEmbedPlayer(true)}
                      className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/80 backdrop-blur-xs border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Play Source Video</span>
                    </button>
                  )}

                  {/* Center Overlay Play Button */}
                  {!isPlaying && (
                    <button
                      onClick={() => {
                        if (item.embedUrl) {
                          setShowEmbedPlayer(true);
                        } else {
                          togglePlay();
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors"
                      aria-label="Play video"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform group-hover:scale-110">
                        <Play className="h-6 w-6 ml-1" />
                      </div>
                    </button>
                  )}

                  {/* Player Control Bar */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between text-white text-xs opacity-90 transition-opacity">
                    <div className="flex items-center gap-2">
                      <button onClick={togglePlay} className="hover:text-indigo-400 p-1">
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button onClick={toggleMute} className="hover:text-indigo-400 p-1">
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <span className="font-mono text-[11px] tabular-nums text-slate-300">
                        {item.durationFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Playback speed selector */}
                      <div className="flex items-center rounded bg-white/10 px-1 py-0.5 text-[10px]">
                        {[1, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => handleSpeedChange(spd)}
                            className={`px-1 rounded ${playbackSpeed === spd ? 'bg-indigo-600 font-bold text-white' : 'text-slate-300 hover:text-white'}`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <button onClick={handleFullscreen} className="hover:text-indigo-400 p-1">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail selector if carousel */}
            {item.carouselItems && item.carouselItems.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {item.carouselItems.map((ci, index) => (
                  <button
                    key={ci.id}
                    onClick={() => setActiveCarouselIndex(index)}
                    className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                      activeCarouselIndex === index
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={ci.previewUrl}
                      alt={`Slide ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Creator info and metrics */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  {item.author.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate">
                    {item.author.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {item.author.handle}
                  </div>
                </div>
              </div>

              {item.stats && (
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px] tabular-nums shrink-0">
                  {item.stats.views && (
                    <span>{(item.stats.views / 1000).toFixed(0)}k views</span>
                  )}
                  {item.stats.likes && (
                    <span>{(item.stats.likes / 1000).toFixed(0)}k likes</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Download Formats & Quality Matrix */}
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Media Title & External Link */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {item.title}
                </h2>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-400 hover:text-indigo-400 shrink-0"
                  title="Open original post"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Caption with Expand/Collapse & Copy button */}
              {item.caption && (
                <div className="mt-2.5 rounded-lg bg-slate-950/60 p-3 text-xs text-slate-300 border border-slate-800/80">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-slate-300 font-normal leading-relaxed ${expandedCaption ? '' : 'line-clamp-2'}`}>
                      {item.caption}
                    </p>
                    <button
                      onClick={handleCopyCaption}
                      className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
                      title="Copy Caption"
                    >
                      {copiedCaption ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {item.caption.length > 120 && (
                    <button
                      onClick={() => setExpandedCaption(!expandedCaption)}
                      className="mt-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      {expandedCaption ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* Format selection tabs */}
              <div className="mt-5 flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1 p-0.5 bg-slate-800/60 rounded-lg">
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'video'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Video (MP4)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('audio')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'audio'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Music className="h-3.5 w-3.5" />
                    <span>Audio Only (MP3)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'images'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Images & Covers</span>
                  </button>
                </div>

                {item.mediaType === 'carousel' && (
                  <button
                    onClick={handleDownloadCarouselZip}
                    disabled={Boolean(zipProgress)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/40 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                  >
                    <FileArchive className="h-3.5 w-3.5" />
                    <span>{zipProgress || 'Save All as ZIP'}</span>
                  </button>
                )}
              </div>

              {/* Formats Table */}
              <div className="mt-4 space-y-2">
                {activeTab === 'video' && (
                  <>
                    {videoFormats.map((format) => {
                      const isDownloading = downloadingFormatId === format.id;
                      return (
                        <div
                          key={format.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                              {format.id.toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {format.quality}
                                </span>
                                {format.id === '2160p' && (
                                  <span className="text-[10px] uppercase font-bold text-amber-400 border border-amber-400/30 rounded px-1">
                                    Ultra HD
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono tabular-nums">
                                <span>{format.resolution}</span>
                                <span className="mx-1.5">·</span>
                                <span>{format.format.toUpperCase()}</span>
                                <span className="mx-1.5">·</span>
                                <span className="text-slate-300">{format.sizeFormatted}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(format)}
                              disabled={isDownloading}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                isDownloading
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                              }`}
                            >
                              {isDownloading ? (
                                <>
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  <span>{downloadProgress}%</span>
                                </>
                              ) : (
                                <>
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {activeTab === 'audio' && (
                  <>
                    {audioFormats.map((format) => {
                      const isDownloading = downloadingFormatId === format.id;
                      return (
                        <div
                          key={format.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400">
                              <Music className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {format.quality}
                              </div>
                              <div className="text-xs text-slate-400 font-mono tabular-nums">
                                <span>{format.bitrate || '320 kbps'}</span>
                                <span className="mx-1.5">·</span>
                                <span>Stereo HQ</span>
                                <span className="mx-1.5">·</span>
                                <span className="text-slate-300">{format.sizeFormatted}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDownload(format)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
                          >
                            {isDownloading ? (
                              <>
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>{downloadProgress}%</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5" />
                                <span>Download MP3</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}

                {activeTab === 'images' && (
                  <div className="space-y-2">
                    {/* Thumbnail Download */}
                    {imageFormats.map((format) => (
                      <div
                        key={format.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.thumbnail}
                            alt="Preview"
                            className="h-9 w-9 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {format.quality}
                            </div>
                            <div className="text-xs text-slate-400 font-mono tabular-nums">
                              {format.resolution} · {format.sizeFormatted}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownload(format)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Save JPG</span>
                        </button>
                      </div>
                    ))}

                    {/* Carousel items list if available */}
                    {item.carouselItems && item.carouselItems.length > 0 && (
                      <div className="pt-2">
                        <div className="text-xs font-medium text-slate-400 mb-2">
                          Individual Carousel Slides ({item.carouselItems.length})
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {item.carouselItems.map((c, i) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400">#{i + 1}</span>
                                <span className="text-slate-300 capitalize">{c.type}</span>
                              </div>
                              <a
                                href={c.downloadUrl}
                                download={`slide_${i + 1}.jpg`}
                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom tags & helper notes */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-1.5">
                {item.tags.slice(0, 4).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                    onClick={handleCopyTags}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={handleCopyTags}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
              >
                {copiedTags ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>Copy Hashtags</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
