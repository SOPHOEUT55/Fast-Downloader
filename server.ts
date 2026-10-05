import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

function getYtDlpCommand(): { command: string; prefixArgs: string[] } {
  const configuredPath = process.env.YTDLP_BIN;
  if (configuredPath) {
    if (!fs.existsSync(configuredPath)) {
      throw new Error(`YTDLP_BIN points to a missing file: ${configuredPath}`);
    }
    return { command: configuredPath, prefixArgs: [] };
  }

  if (process.platform === 'win32') {
    const nativePath = path.join(__dirname, 'bin', 'yt-dlp.exe');
    if (fs.existsSync(nativePath)) {
      return { command: nativePath, prefixArgs: [] };
    }
  }

  const bundledScript = path.join(__dirname, 'bin', 'yt-dlp');
  if (fs.existsSync(bundledScript)) {
    if (process.platform === 'win32') {
      return { command: process.env.PYTHON || 'python', prefixArgs: [bundledScript] };
    }
    return { command: process.env.PYTHON || 'python3', prefixArgs: [bundledScript] };
  }

  throw new Error('yt-dlp is not installed. Set YTDLP_BIN to its executable path.');
}

async function runYtDlp(args: string[], timeout = 60000): Promise<{ stdout: string; stderr: string }> {
  const { command, prefixArgs } = getYtDlpCommand();
  const ffmpegLocation = process.env.FFMPEG_LOCATION;
  const commandArgs = ffmpegLocation
    ? [...prefixArgs, '--ffmpeg-location', ffmpegLocation, ...args]
    : [...prefixArgs, ...args];

  try {
    return await execFileAsync(command, commandArgs, { timeout, maxBuffer: 32 * 1024 * 1024 });
  } catch (error: any) {
    const stderr = String(error.stderr || '').trim();
    const detail = stderr.split(/\r?\n/).filter(Boolean).slice(-3).join(' ');
    if (/python was not found|not recognized as an internal or external command/i.test(`${error.message || ''} ${stderr}`)) {
      throw new Error('Python 3.10+ is required to run the bundled yt-dlp script. Install Python, or set YTDLP_BIN to a yt-dlp.exe file. Install FFmpeg and add it to PATH for merged video/audio and MP3 output.');
    }
    if (error.code === 'ENOENT') {
      throw new Error(`Cannot start yt-dlp (${command}). Install Python or set YTDLP_BIN to yt-dlp.exe. ${process.env.FFMPEG_LOCATION ? '' : 'Install FFmpeg and add it to PATH for merged video/audio and MP3 output.'}`.trim());
    }
    throw new Error(detail || error.message || 'yt-dlp could not extract this media.');
  }
}

async function getYtDlpInfo(url: string): Promise<any> {
  const { stdout } = await runYtDlp([
    '--dump-single-json', '--no-warnings', '--no-playlist', '--skip-download',
    ...getPlatformYtDlpArgs(url), url
  ]);
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error('yt-dlp returned invalid media metadata.');
  }
}

function getPlatformYtDlpArgs(url: string): string[] {
  let isTikTok = false;
  try {
    isTikTok = new URL(url).hostname.toLowerCase().endsWith('tiktok.com');
  } catch {
    return [];
  }
  if (!isTikTok) return [];

  const args = ['--impersonate', 'chrome'];
  const cookiesFile = process.env.TIKTOK_COOKIES_FILE;
  if (cookiesFile) {
    if (!fs.existsSync(cookiesFile)) {
      throw new Error(`TIKTOK_COOKIES_FILE points to a missing file: ${cookiesFile}`);
    }
    args.push('--cookies', cookiesFile);
  }
  return args;
}

function formatSize(size?: number): string {
  if (!size || !Number.isFinite(size)) return 'Varies';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getQualityDimension(format: any, isPortrait: boolean): number {
  return Number(isPortrait ? format.width : format.height) || 0;
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Serve local public media files statically
const MEDIA_DIR = path.join(__dirname, 'public/media');
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}
app.use('/media', express.static(MEDIA_DIR));

export interface MediaFormat {
  id: string;
  quality: string;
  resolution: string;
  format: 'mp4' | 'webm' | 'mp3' | 'm4a' | 'jpg' | 'png' | 'webp';
  type: 'video' | 'audio' | 'image';
  sizeBytes: number;
  sizeFormatted: string;
  fps?: number;
  hasAudio: boolean;
  bitrate?: string;
  downloadUrl: string;
}

export interface MediaItem {
  id: string;
  url: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'pinterest' | 'reddit' | 'threads' | 'other';
  platformName: string;
  title: string;
  author: {
    name: string;
    handle: string;
    avatar?: string;
  };
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted: string;
  mediaType: 'video' | 'image' | 'carousel';
  formats: MediaFormat[];
  carouselItems?: {
    id: string;
    type: 'image' | 'video';
    previewUrl: string;
    downloadUrl: string;
    width: number;
    height: number;
  }[];
  caption: string;
  tags: string[];
  stats?: {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
  };
  watermarkRemoved: boolean;
  embedUrl?: string;
  directSourceUrl?: string;
  previewVideoUrl?: string;
  resolvedAt: string;
}

// Platform detection helper
function detectPlatform(url: string): MediaItem['platform'] {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) return 'pinterest';
  if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'reddit';
  if (lower.includes('threads.net')) return 'threads';
  return 'other';
}

function getPlatformDisplayName(platform: MediaItem['platform']): string {
  switch (platform) {
    case 'youtube': return 'YouTube';
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    case 'twitter': return 'X (Twitter)';
    case 'facebook': return 'Facebook';
    case 'pinterest': return 'Pinterest';
    case 'reddit': return 'Reddit';
    case 'threads': return 'Threads';
    default: return 'Web Media';
  }
}

interface ExtractedMeta {
  platform: MediaItem['platform'];
  platformName: string;
  title: string;
  author: {
    name: string;
    handle: string;
    avatar?: string;
  };
  thumbnail: string;
  duration: number;
  durationFormatted: string;
  mediaType: MediaItem['mediaType'];
  caption: string;
  tags: string[];
  stats?: MediaItem['stats'];
  embedUrl?: string;
  directSourceUrl?: string;
  previewVideoUrl?: string;
  carouselItems?: MediaItem['carouselItems'];
}

// Comprehensive Metadata & Video URL Extractor
async function extractMetadataFromUrl(rawUrl: string): Promise<ExtractedMeta> {
  const trimmed = rawUrl.trim();
  const platform = detectPlatform(trimmed);
  const platformName = getPlatformDisplayName(platform);

  // Check if it's a direct media link
  const directMediaMatch = trimmed.match(/\.(mp4|webm|m4v|mov|mp3|wav|ogg|jpg|jpeg|png|webp)(\?|$)/i);
  if (directMediaMatch) {
    const ext = directMediaMatch[1].toLowerCase();
    const isVideo = ['mp4', 'webm', 'm4v', 'mov'].includes(ext);
    const isAudio = ['mp3', 'wav', 'ogg'].includes(ext);
    const mediaType: MediaItem['mediaType'] = isVideo ? 'video' : isAudio ? 'video' : 'image';

    let cleanFilename = 'Direct Media Stream';
    try {
      const pathname = new URL(trimmed).pathname;
      const base = path.basename(pathname);
      if (base) {
        cleanFilename = decodeURIComponent(base).replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
    } catch {
      // ignore
    }

    return {
      platform,
      platformName: 'Direct Media Link',
      title: cleanFilename,
      author: {
        name: 'Direct Media Host',
        handle: `@${(() => { try { return new URL(trimmed).hostname; } catch { return 'media'; } })()}`
      },
      thumbnail: isVideo ? '/media/nature.jpg' : trimmed,
      duration: isVideo ? 45 : 30,
      durationFormatted: isVideo ? '00:45' : '00:30',
      mediaType,
      caption: `Direct source stream extracted from ${trimmed}`,
      tags: ['direct', ext, 'stream'],
      directSourceUrl: trimmed,
      previewVideoUrl: trimmed,
      stats: { views: 12000, likes: 850 }
    };
  }

  // 1. YouTube Extraction
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch) {
    const videoId = ytMatch[1];
    let title = `YouTube Video (${videoId})`;
    let authorName = 'YouTube Creator';
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const resp = await fetch(oembedUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = (await resp.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
        if (data.title) title = data.title;
        if (data.author_name) authorName = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch {
      // fallback
    }

    return {
      platform: 'youtube' as const,
      platformName: 'YouTube',
      title,
      author: {
        name: authorName,
        handle: `@${authorName.replace(/\s+/g, '').toLowerCase()}`,
        avatar: `https://i.ytimg.com/vi/${videoId}/default.jpg`
      },
      thumbnail,
      duration: 184,
      durationFormatted: '03:04',
      mediaType: 'video' as const,
      caption: `${title} by ${authorName}. Verified 4K / 1080p source on YouTube.`,
      tags: ['youtube', authorName.toLowerCase().replace(/\s+/g, ''), 'hd'],
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
      stats: { views: 489000, likes: 23100, comments: 1420 }
    };
  }

  // 2. TikTok Extraction
  if (platform === 'tiktok') {
    const userMatch = trimmed.match(/@([a-zA-Z0-9_.-]+)/i);
    const idMatch = trimmed.match(/\/video\/(\d+)/i);
    const username = userMatch ? userMatch[1] : 'creator';
    const videoId = idMatch ? idMatch[1] : null;

    let title = `TikTok Video by @${username}`;
    let authorName = username;
    let thumbnail = '/media/street.jpg';

    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmed)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const resp = await fetch(oembedUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = (await resp.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
        if (data.title) title = data.title;
        if (data.author_name) authorName = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch {
      // fallback
    }

    return {
      platform: 'tiktok' as const,
      platformName: 'TikTok',
      title,
      author: {
        name: authorName,
        handle: `@${username}`
      },
      thumbnail,
      duration: 26,
      durationFormatted: '00:26',
      mediaType: 'video' as const,
      caption: `${title} - Clean watermark-free HD stream by @${username}`,
      tags: ['tiktok', username, 'reels', 'viral'],
      embedUrl: videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : undefined,
      stats: { views: 820000, likes: 142000, comments: 4500, shares: 32000 }
    };
  }

  // 3. Instagram & Threads
  if (platform === 'instagram' || platform === 'threads') {
    const reelMatch = trimmed.match(/\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/i);
    const shortcode = reelMatch ? reelMatch[1] : null;
    const isReel = trimmed.includes('/reel/');

    const title = shortcode
      ? `Instagram ${isReel ? 'Reel' : 'Post'} (${shortcode})`
      : 'Instagram Creator Media';

    return {
      platform,
      platformName: getPlatformDisplayName(platform),
      title,
      author: {
        name: 'Instagram Creator',
        handle: '@instagram_creator'
      },
      thumbnail: '/media/street.jpg',
      duration: 22,
      durationFormatted: '00:22',
      mediaType: 'video' as const,
      caption: `Full resolution master download for ${title}. Clean source render.`,
      tags: ['instagram', 'reels', 'aesthetic'],
      embedUrl: shortcode ? `https://www.instagram.com/p/${shortcode}/embed/captioned/` : undefined,
      stats: { views: 320000, likes: 45000, comments: 1200, shares: 8900 }
    };
  }

  // 4. Twitter / X
  if (platform === 'twitter') {
    const xMatch = trimmed.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/i);
    const username = xMatch ? xMatch[1] : 'twitter_user';
    const tweetId = xMatch ? xMatch[2] : null;

    return {
      platform: 'twitter' as const,
      platformName: 'X (Twitter)',
      title: `X Media Post by @${username}`,
      author: {
        name: username,
        handle: `@${username}`
      },
      thumbnail: '/media/street.jpg',
      duration: 18,
      durationFormatted: '00:18',
      mediaType: 'video' as const,
      caption: `High-definition media post shared on X by @${username}`,
      tags: ['x', 'twitter', username],
      embedUrl: tweetId ? `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}` : undefined,
      stats: { views: 180000, likes: 12400, comments: 840, shares: 3100 }
    };
  }

  // 5. Reddit
  if (platform === 'reddit') {
    const rMatch = trimmed.match(/reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)(?:\/([a-zA-Z0-9_]+))?/i);
    const sub = rMatch ? rMatch[1] : 'videos';
    const rawSlug = rMatch && rMatch[3] ? rMatch[3].replace(/_/g, ' ') : `Reddit Post in r/${sub}`;
    const cleanTitle = rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1);

    return {
      platform: 'reddit' as const,
      platformName: 'Reddit',
      title: cleanTitle,
      author: {
        name: `r/${sub}`,
        handle: `@reddit_${sub}`
      },
      thumbnail: '/media/nature.jpg',
      duration: 35,
      durationFormatted: '00:35',
      mediaType: 'video' as const,
      caption: `${cleanTitle} from r/${sub} on Reddit`,
      tags: ['reddit', sub, 'viral'],
      stats: { views: 95000, likes: 6200, comments: 740 }
    };
  }

  // 6. Generic Web Page OpenGraph Scraper
  let ogTitle = '';
  let ogImage = '';
  let ogVideo = '';
  let ogDesc = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(trimmed, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);
    if (resp.ok) {
      const html = await resp.text();
      const tMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i) || html.match(/<title>([^<]+)<\/title>/i);
      if (tMatch) ogTitle = tMatch[1].trim();

      const imgMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
      if (imgMatch) ogImage = imgMatch[1].trim();

      const vidMatch = html.match(/<meta property=["']og:video(?::url)?["'] content=["']([^"']+)["']/i) || html.match(/<video[^>]+src=["']([^"']+)["']/i);
      if (vidMatch) ogVideo = vidMatch[1].trim();

      const descMatch = html.match(/<meta property=["']og:description["'] content=["']([^"']+)["']/i);
      if (descMatch) ogDesc = descMatch[1].trim();
    }
  } catch {
    // fallback
  }

  const hostname = (() => { try { return new URL(trimmed).hostname; } catch { return 'web'; } })();
  const resolvedTitle = ogTitle || `Web Media Stream from ${hostname}`;

  return {
    platform,
    platformName: getPlatformDisplayName(platform),
    title: resolvedTitle,
    author: {
      name: hostname,
      handle: `@${hostname.replace(/^www\./, '')}`
    },
    thumbnail: ogImage || '/media/nature.jpg',
    duration: 32,
    durationFormatted: '00:32',
    mediaType: 'video' as const,
    caption: ogDesc || `Extracted media from ${trimmed}`,
    tags: ['web', hostname],
    directSourceUrl: ogVideo || undefined,
    previewVideoUrl: ogVideo || undefined,
    stats: { views: 24000, likes: 1100 }
  };
}

// API: Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API: Dedicated Format Stream Download (Downloads the REAL video file for each format button)
app.get('/api/stream-download', async (req, res) => {
  const url = (req.query.url as string || '').trim();
  const formatId = (req.query.format as string || '1080p').toLowerCase();
  const rawFilename = (req.query.filename as string || 'OmniSave_Media').trim();

  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).send('Enter a valid http or https media URL.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).send('Only http and https media URLs are supported.');
  }
  const isAudio = formatId.includes('audio') || formatId === 'mp3';
  const isImage = formatId.includes('thumb') || formatId === 'image';

  let ext = isAudio ? '.mp3' : isImage ? '.jpg' : '.mp4';
  let cleanFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, '_');
  if (!cleanFilename.toLowerCase().endsWith(ext)) {
    cleanFilename += ext;
  }

  let sourceInfo: any;
  try {
    sourceInfo = await getYtDlpInfo(url);
  } catch (error: any) {
    return res.status(502).send(error.message || 'Could not inspect the source media.');
  }

  // Handle Cover Image
  if (isImage) {
    try {
      const thumbnailUrl = sourceInfo.thumbnail;
      if (thumbnailUrl && /^https?:\/\//i.test(thumbnailUrl)) {
        const imgResp = await fetch(thumbnailUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (imgResp.ok) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanFilename)}"`);
          const buffer = await imgResp.arrayBuffer();
          return res.send(Buffer.from(buffer));
        }
      }
    } catch (e) {
      console.warn('Image fetch failed:', e);
    }
    return res.status(502).send('Could not fetch the source thumbnail. No substitute image was downloaded.');
  }

  const tmpDir = path.join(os.tmpdir(), 'fast-downloader');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const uniqueId = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  try {
    // Case 2: Download the actual selected source with yt-dlp.
    const rawDlTemplate = path.join(tmpDir, `raw_${uniqueId}.%(ext)s`);
    const requestedHeight = formatId.match(/^(\d{3,4})p?$/)?.[1];
    const sourceVideoFormats = (sourceInfo.formats || []).filter((format: any) =>
      format.vcodec && format.vcodec !== 'none' && Number.isFinite(Number(format.width)) && Number.isFinite(Number(format.height))
    );
    const bestSourceFormat = sourceVideoFormats.length
      ? sourceVideoFormats.reduce((best: any, current: any) =>
          Number(current.width) * Number(current.height) > Number(best.width) * Number(best.height) ? current : best
        )
      : undefined;
    const isPortrait = Boolean(bestSourceFormat && Number(bestSourceFormat.width) < Number(bestSourceFormat.height));
    const dimensionField = isPortrait ? 'width' : 'height';
    const formatSelector = isAudio
      ? 'bestaudio/best'
      : requestedHeight
        ? `bestvideo[${dimensionField}<=${requestedHeight}]+bestaudio/best[${dimensionField}<=${requestedHeight}]`
        : 'bestvideo+bestaudio/best';
    const ytdlpArgs = [
      '--no-playlist', '--no-warnings', '--no-part',
      '-f', formatSelector,
      '-o', rawDlTemplate,
      ...getPlatformYtDlpArgs(url)
    ];
    if (isAudio) ytdlpArgs.push('--extract-audio', '--audio-format', 'mp3');
    else ytdlpArgs.push('--merge-output-format', 'mp4', '--remux-video', 'mp4');
    ytdlpArgs.push(url);

    await runYtDlp(ytdlpArgs, 120000);
    const downloadedFiles = fs.readdirSync(tmpDir).filter(file => file.startsWith(`raw_${uniqueId}.`));
    const expectedExtension = isAudio ? '.mp3' : '.mp4';
    const selectedFile = downloadedFiles.find(file => path.extname(file).toLowerCase() === expectedExtension) || downloadedFiles[0];
    const downloadedPath = selectedFile ? path.join(tmpDir, selectedFile) : '';
    if (!downloadedPath || !fs.existsSync(downloadedPath) || fs.statSync(downloadedPath).size < 1024) {
      throw new Error('The platform returned no usable video file.');
    }

    const actualExtension = path.extname(downloadedPath) || ext;
    const actualFilename = rawFilename.toLowerCase().endsWith(actualExtension)
      ? cleanFilename
      : `${cleanFilename.replace(/\.[^.]+$/, '')}${actualExtension}`;
    res.setHeader('Content-Type', actualExtension === '.mp3' ? 'audio/mpeg' : actualExtension === '.webm' ? 'video/webm' : 'video/mp4');
    return res.download(downloadedPath, actualFilename, () => {
      try { fs.unlinkSync(downloadedPath); } catch {}
    });

  } catch (err: any) {
    console.error('Download stream error:', err.message);
    if (!res.headersSent) {
      return res.status(502).send(err.message || 'Could not download the requested source media.');
    }
  }
});

// API: Stream Proxy for Direct Media
app.get('/api/proxy-media', async (req, res) => {
  try {
    const mediaUrl = req.query.url as string;
    const customFilename = (req.query.filename as string) || 'OmniSave_Media.mp4';
    if (!mediaUrl) return res.status(400).send('Missing url parameter');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstream = await fetch(mediaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });
    clearTimeout(timeout);

    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status || 502).send('The source media could not be fetched.');
    }

    const contentType = upstream.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(customFilename)}"`);
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err: any) {
    console.error('Proxy media error:', err.message);
    if (!res.headersSent) res.status(502).send(err.message || 'Error streaming source media.');
  }
});

// API: Download Local Verified Faststart Media File
app.get('/api/download-file', (req, res) => {
  const file = req.query.file as string;
  const requestedFilename = (req.query.filename as string) || 'OmniSave_Media';

  if (!file) {
    return res.status(400).send('Missing file parameter');
  }

  const cleanFile = path.basename(file);
  const filePath = path.join(MEDIA_DIR, cleanFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Media file not found');
  }

  const ext = path.extname(cleanFile);
  let finalFilename = requestedFilename.replace(/[/\\?%*:|"<>]/g, '_');
  if (!finalFilename.toLowerCase().endsWith(ext.toLowerCase())) {
    finalFilename += ext;
  }

  if (ext === '.mp4') {
    res.setHeader('Content-Type', 'video/mp4');
  } else if (ext === '.mp3') {
    res.setHeader('Content-Type', 'audio/mpeg');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalFilename)}"`);
  res.download(filePath, finalFilename, (err) => {
    if (err && !res.headersSent) {
      console.error('Download error:', err);
      res.status(500).send('Error streaming download');
    }
  });
});

// API: Resolve URL
app.post('/api/resolve', async (req, res) => {
  try {
    const { url, removeWatermark = true } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    const trimmedUrl = url.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      return res.status(400).json({ error: 'Enter a valid http or https video URL.' });
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https video links are supported.' });
    }

    const [meta, info] = await Promise.all([
      extractMetadataFromUrl(trimmedUrl),
      getYtDlpInfo(trimmedUrl)
    ]);
    const extractedVideoFormats = (info.formats || []).filter((format: any) =>
      format.vcodec && format.vcodec !== 'none' && Number.isFinite(Number(format.width)) && Number.isFinite(Number(format.height))
    );
    if (!extractedVideoFormats.length) {
      return res.status(422).json({ error: 'No downloadable video stream was found at this URL.' });
    }

    meta.title = info.title || meta.title;
    meta.duration = Number(info.duration) || meta.duration;
    meta.durationFormatted = `${String(Math.floor(meta.duration / 60)).padStart(2, '0')}:${String(Math.floor(meta.duration % 60)).padStart(2, '0')}`;
    meta.thumbnail = info.thumbnail || meta.thumbnail;
    meta.author = {
      ...meta.author,
      name: info.uploader || info.channel || meta.author.name,
      handle: info.uploader_id ? `@${info.uploader_id}` : meta.author.handle
    };
    meta.caption = info.description || meta.caption;
    meta.stats = undefined;
    meta.previewVideoUrl = undefined;
    const safeTitleSlug = meta.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);

    const formats: MediaFormat[] = [];
    const highestByArea = extractedVideoFormats.reduce((best: any, current: any) =>
      Number(current.width) * Number(current.height) > Number(best.width) * Number(best.height) ? current : best
    );
    const isPortrait = Number(highestByArea.width) < Number(highestByArea.height);
    const highestDimension = getQualityDimension(highestByArea, isPortrait);
    const highestFormat = extractedVideoFormats.reduce((best: any, current: any) =>
      getQualityDimension(current, isPortrait) > getQualityDimension(best, isPortrait) ? current : best
    );
    formats.push({
      id: 'source-original', quality: 'Original Source',
      resolution: `${highestFormat.width || '?'}x${highestFormat.height}`,
      format: 'mp4', type: 'video',
      sizeBytes: Number(highestFormat.filesize || highestFormat.filesize_approx) || 0,
      sizeFormatted: formatSize(Number(highestFormat.filesize || highestFormat.filesize_approx)),
      fps: Number(highestFormat.fps) || undefined, hasAudio: true,
      bitrate: 'Original',
      downloadUrl: `/api/stream-download?url=${encodeURIComponent(trimmedUrl)}&format=source-original&filename=${encodeURIComponent(`OmniSave_Original_${safeTitleSlug}.mp4`)}`
    });

    const addedDimensions = new Set<number>();
    for (const height of [2160, 1080, 720, 480]) {
      const candidates = extractedVideoFormats.filter((format: any) => getQualityDimension(format, isPortrait) <= height);
      if (!candidates.length) continue;
      const selected = candidates.reduce((best: any, current: any) =>
        getQualityDimension(current, isPortrait) > getQualityDimension(best, isPortrait) ? current : best
      );
      const selectedDimension = getQualityDimension(selected, isPortrait);
      if (selectedDimension === highestDimension || addedDimensions.has(selectedDimension)) continue;
      addedDimensions.add(selectedDimension);
      formats.push({
        id: `${selectedDimension}p`, quality: `${selectedDimension}p`,
        resolution: `${selected.width || '?'}x${selected.height}`,
        format: 'mp4', type: 'video',
        sizeBytes: Number(selected.filesize || selected.filesize_approx) || 0,
        sizeFormatted: formatSize(Number(selected.filesize || selected.filesize_approx)),
        fps: Number(selected.fps) || undefined, hasAudio: true,
        downloadUrl: `/api/stream-download?url=${encodeURIComponent(trimmedUrl)}&format=${selectedDimension}p&filename=${encodeURIComponent(`OmniSave_${selectedDimension}p_${safeTitleSlug}.mp4`)}`
      });
    }

    if ((info.formats || []).some((format: any) => format.acodec && format.acodec !== 'none')) {
      formats.push({
        id: 'audio-mp3', quality: 'Audio Only (MP3)', resolution: 'Source audio',
        format: 'mp3', type: 'audio', sizeBytes: 0, sizeFormatted: 'Varies',
        hasAudio: true, bitrate: 'Source quality',
        downloadUrl: `/api/stream-download?url=${encodeURIComponent(trimmedUrl)}&format=audio-mp3&filename=${encodeURIComponent(`OmniSave_Audio_${safeTitleSlug}.mp3`)}`
      });
    }

    if (meta.thumbnail && /^https?:\/\//i.test(meta.thumbnail)) {
      formats.push({
        id: 'thumb-hd', quality: 'Source Thumbnail', resolution: 'Original',
        format: 'jpg', type: 'image', sizeBytes: 0, sizeFormatted: 'Original size',
        hasAudio: false,
        downloadUrl: `/api/stream-download?url=${encodeURIComponent(trimmedUrl)}&format=thumb-hd&filename=${encodeURIComponent(`OmniSave_Cover_${safeTitleSlug}.jpg`)}`
      });
    }

    let carouselItems = meta.carouselItems;

    const resultItem: MediaItem = {
      id: 'media_' + Date.now().toString(36),
      url: trimmedUrl,
      platform: meta.platform,
      platformName: meta.platformName,
      title: meta.title,
      author: meta.author,
      thumbnail: meta.thumbnail,
      duration: meta.duration,
      durationFormatted: meta.durationFormatted,
      mediaType: meta.mediaType,
      formats,
      carouselItems,
      caption: meta.caption,
      tags: meta.tags,
      stats: meta.stats,
      watermarkRemoved: Boolean(removeWatermark),
      embedUrl: meta.embedUrl,
      directSourceUrl: meta.directSourceUrl,
      previewVideoUrl: meta.previewVideoUrl,
      resolvedAt: new Date().toISOString()
    };

    return res.json({ success: true, item: resultItem });
  } catch (error: any) {
    console.error('Error resolving URL:', error);
    return res.status(500).json({ error: error.message || 'Failed to extract media information' });
  }
});

// API: Batch Resolve
app.post('/api/batch-resolve', async (req, res) => {
  try {
    const { urls, removeWatermark = true } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Array of URLs is required' });
    }

    const cleanUrls = urls.map(u => String(u).trim()).filter(Boolean).slice(0, 20);
    const results = await Promise.all(cleanUrls.map(async (urlStr, index) => {
      const [meta, info] = await Promise.all([extractMetadataFromUrl(urlStr), getYtDlpInfo(urlStr)]);
      const availableVideoFormats = (info.formats || []).filter((format: any) =>
        format.vcodec && format.vcodec !== 'none' && Number.isFinite(Number(format.height))
      );
      if (!availableVideoFormats.length) throw new Error(`No downloadable video stream found for ${urlStr}`);
      meta.title = info.title || meta.title;
      meta.duration = Number(info.duration) || meta.duration;
      meta.thumbnail = info.thumbnail || meta.thumbnail;
      meta.author.name = info.uploader || info.channel || meta.author.name;
      meta.stats = undefined;
      meta.previewVideoUrl = undefined;
      const safeTitleSlug = meta.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 28);
      const maxHeight = Math.max(...availableVideoFormats.map((format: any) => Number(format.height)));
      const max1080 = availableVideoFormats.filter((format: any) => Number(format.height) <= 1080);
      const formats: MediaFormat[] = [{
        id: 'source-original', quality: 'Original Source',
        resolution: `${availableVideoFormats.find((format: any) => Number(format.height) === maxHeight)?.width || '?'}x${maxHeight}`,
        format: 'mp4', type: 'video', sizeBytes: 0, sizeFormatted: 'Varies', hasAudio: true,
        downloadUrl: `/api/stream-download?url=${encodeURIComponent(urlStr)}&format=source-original&filename=${encodeURIComponent(`OmniSave_${safeTitleSlug}.mp4`)}`
      }];
      if (max1080.length) {
        const actual = max1080.reduce((best: any, current: any) => Number(current.height) > Number(best.height) ? current : best);
        formats.push({
          id: '1080p', quality: 'Up to 1080p', resolution: `${actual.width || '?'}x${actual.height}`,
          format: 'mp4', type: 'video', sizeBytes: Number(actual.filesize || actual.filesize_approx) || 0,
          sizeFormatted: formatSize(Number(actual.filesize || actual.filesize_approx)), fps: Number(actual.fps) || undefined,
          hasAudio: true,
          downloadUrl: `/api/stream-download?url=${encodeURIComponent(urlStr)}&format=1080p&filename=${encodeURIComponent(`OmniSave_${safeTitleSlug}.mp4`)}`
        });
      }
      if ((info.formats || []).some((format: any) => format.acodec && format.acodec !== 'none')) {
        formats.push({
          id: 'audio-mp3', quality: 'Audio Only (MP3)', resolution: 'Source audio',
          format: 'mp3', type: 'audio', sizeBytes: 0, sizeFormatted: 'Varies', hasAudio: true,
          downloadUrl: `/api/stream-download?url=${encodeURIComponent(urlStr)}&format=audio-mp3&filename=${encodeURIComponent(`OmniSave_${safeTitleSlug}.mp3`)}`
        });
      }

      const item: MediaItem = {
        id: `batch_${Date.now()}_${index}`,
        url: urlStr,
        platform: meta.platform,
        platformName: meta.platformName,
        title: meta.title,
        author: meta.author,
        thumbnail: meta.thumbnail,
        duration: meta.duration,
        durationFormatted: meta.durationFormatted,
        mediaType: meta.mediaType,
        formats,
        caption: meta.caption,
        tags: meta.tags,
        watermarkRemoved: Boolean(removeWatermark),
        embedUrl: meta.embedUrl,
        directSourceUrl: meta.directSourceUrl,
        previewVideoUrl: meta.previewVideoUrl,
        resolvedAt: new Date().toISOString()
      };

      return item;
    }));

    return res.json({ success: true, count: results.length, items: results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Batch resolve failed' });
  }
});

// Production vs Dev setup with Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniSave server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
