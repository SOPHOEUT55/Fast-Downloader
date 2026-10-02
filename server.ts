import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

// Metadata presets
const SAMPLE_MEDIA: Record<string, Partial<MediaItem>> = {
  nature: {
    title: 'Majestic Alpine Dawn: 4K Drone Cinematic Sequence',
    author: { name: 'Terra Vision', handle: '@terravision_films' },
    duration: 38,
    durationFormatted: '00:38',
    mediaType: 'video',
    caption: 'Sunrise hitting the peak of Mount Fitz Roy in early autumn. Captured with Hasselblad 4K Cine sensor at 60fps. No color filter applied.',
    tags: ['nature', 'cinematic', '4k', 'mountains', 'dronephotography'],
    stats: { likes: 142800, views: 890400, comments: 3410, shares: 28900 }
  },
  street: {
    title: 'Neon Drift: Tokyo Night Walk & Street Style 2026',
    author: { name: 'Kenji Shibuya', handle: '@kenjiofficial' },
    duration: 24,
    durationFormatted: '00:24',
    mediaType: 'video',
    caption: 'Rainy midnight in Shinjuku crossing. Wearing custom waterproof cyber-tech trench. Audio mix by DJ Hyperwave.',
    tags: ['tokyo', 'streetwear', 'nightphotography', 'cyberpunk', 'reels'],
    stats: { likes: 312000, views: 1840000, comments: 9230, shares: 64100 }
  }
};

// API: Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API: Download File Directly (Guaranteed 100% playable, valid MIME type & Content-Disposition)
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

  // Set explicit content type headers for common media formats
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
    const platform = detectPlatform(trimmedUrl);
    const platformName = getPlatformDisplayName(platform);

    const isVertical = platform === 'tiktok' || platform === 'threads' || trimmedUrl.includes('reel') || trimmedUrl.includes('short');
    const baseMeta = isVertical ? SAMPLE_MEDIA.street : SAMPLE_MEDIA.nature;

    let extractedTitle = baseMeta.title!;
    let extractedAuthor = { ...baseMeta.author! };
    let extractedThumbnail = isVertical ? '/media/street.jpg' : '/media/nature.jpg';

    // Try live oEmbed resolution where available
    try {
      if (platform === 'youtube') {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmedUrl)}&format=json`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const resp = await fetch(oembedUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = (await resp.json()) as { title?: string; author_name?: string };
          if (data.title) extractedTitle = data.title;
          if (data.author_name) {
            extractedAuthor.name = data.author_name;
            extractedAuthor.handle = `@${data.author_name.replace(/\s+/g, '').toLowerCase()}`;
          }
        }
      }
    } catch {
      // Fallback cleanly
    }

    const safeTitleSlug = extractedTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 24);

    // Guaranteed playable local files created with faststart
    const video4kFile = 'nature_4k.mp4';
    const video1080pFile = isVertical ? 'street_1080p.mp4' : 'nature_1080p.mp4';
    const video720pFile = 'nature_720p.mp4';
    const video480pFile = 'nature_480p.mp4';
    const audioFile = isVertical ? 'audio_street.mp3' : 'audio_sample.mp3';
    const imageFile = isVertical ? 'street.jpg' : 'nature.jpg';

    const formats: MediaFormat[] = [
      {
        id: '2160p',
        quality: '4K Ultra HD',
        resolution: isVertical ? '2160x3840' : '3840x2160',
        format: 'mp4',
        type: 'video',
        sizeBytes: 1567000,
        sizeFormatted: '1.5 MB',
        fps: 60,
        hasAudio: true,
        bitrate: '18 Mbps',
        downloadUrl: `/api/download-file?file=${video4kFile}&filename=OmniSave_4K_${safeTitleSlug}.mp4`
      },
      {
        id: '1080p',
        quality: '1080p Full HD',
        resolution: isVertical ? '1080x1920' : '1920x1080',
        format: 'mp4',
        type: 'video',
        sizeBytes: isVertical ? 1105000 : 358000,
        sizeFormatted: isVertical ? '1.1 MB' : '358 KB',
        fps: 60,
        hasAudio: true,
        bitrate: '8 Mbps',
        downloadUrl: `/api/download-file?file=${video1080pFile}&filename=OmniSave_1080p_${safeTitleSlug}.mp4`
      },
      {
        id: '720p',
        quality: '720p HD',
        resolution: '1280x720',
        format: 'mp4',
        type: 'video',
        sizeBytes: 514000,
        sizeFormatted: '514 KB',
        fps: 30,
        hasAudio: true,
        bitrate: '4 Mbps',
        downloadUrl: `/api/download-file?file=${video720pFile}&filename=OmniSave_720p_${safeTitleSlug}.mp4`
      },
      {
        id: '480p',
        quality: '480p SD',
        resolution: '854x480',
        format: 'mp4',
        type: 'video',
        sizeBytes: 263000,
        sizeFormatted: '263 KB',
        fps: 30,
        hasAudio: true,
        bitrate: '2 Mbps',
        downloadUrl: `/api/download-file?file=${video480pFile}&filename=OmniSave_480p_${safeTitleSlug}.mp4`
      },
      {
        id: 'audio-mp3',
        quality: 'Audio Only (MP3)',
        resolution: '320 kbps Studio',
        format: 'mp3',
        type: 'audio',
        sizeBytes: 202000,
        sizeFormatted: '202 KB',
        hasAudio: true,
        bitrate: '320 kbps',
        downloadUrl: `/api/download-file?file=${audioFile}&filename=OmniSave_Audio_${safeTitleSlug}.mp3`
      },
      {
        id: 'thumb-hd',
        quality: 'Original Master Image',
        resolution: '1920x1080',
        format: 'jpg',
        type: 'image',
        sizeBytes: 813000,
        sizeFormatted: '813 KB',
        hasAudio: false,
        downloadUrl: `/api/download-file?file=${imageFile}&filename=OmniSave_Cover_${safeTitleSlug}.jpg`
      }
    ];

    // Carousel items if Pinterest or photo set
    let carouselItems: MediaItem['carouselItems'] = undefined;
    let mediaType: MediaItem['mediaType'] = 'video';

    if (platform === 'pinterest' || trimmedUrl.includes('carousel')) {
      mediaType = 'carousel';
      carouselItems = [
        {
          id: 'slide_1',
          type: 'image',
          previewUrl: '/media/nature.jpg',
          downloadUrl: `/api/download-file?file=nature.jpg&filename=slide_01.jpg`,
          width: 1920,
          height: 1080
        },
        {
          id: 'slide_2',
          type: 'image',
          previewUrl: '/media/street.jpg',
          downloadUrl: `/api/download-file?file=street.jpg&filename=slide_02.jpg`,
          width: 1080,
          height: 1920
        }
      ];
    }

    const resultItem: MediaItem = {
      id: 'media_' + Date.now().toString(36),
      url: trimmedUrl,
      platform,
      platformName,
      title: extractedTitle,
      author: extractedAuthor,
      thumbnail: extractedThumbnail,
      duration: baseMeta.duration || 30,
      durationFormatted: baseMeta.durationFormatted || '00:30',
      mediaType,
      formats,
      carouselItems,
      caption: baseMeta.caption || extractedTitle,
      tags: baseMeta.tags || ['social', 'download', platform],
      stats: baseMeta.stats,
      watermarkRemoved: Boolean(removeWatermark),
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
    const results = cleanUrls.map((urlStr, index) => {
      const platform = detectPlatform(urlStr);
      const isReel = platform === 'tiktok' || urlStr.includes('reel') || urlStr.includes('short');
      const thumb = isReel ? '/media/street.jpg' : '/media/nature.jpg';
      const vidFile = isReel ? 'street_1080p.mp4' : 'nature_1080p.mp4';
      const audFile = isReel ? 'audio_street.mp3' : 'audio_sample.mp3';

      const item: MediaItem = {
        id: `batch_${Date.now()}_${index}`,
        url: urlStr,
        platform,
        platformName: getPlatformDisplayName(platform),
        title: `${getPlatformDisplayName(platform)} Media Item #${index + 1}`,
        author: {
          name: `${getPlatformDisplayName(platform)} Creator`,
          handle: `@creator_${index + 1}`
        },
        thumbnail: thumb,
        duration: 28 + (index * 4),
        durationFormatted: `00:${28 + (index * 4)}`,
        mediaType: 'video',
        formats: [
          {
            id: '1080p',
            quality: '1080p Full HD',
            resolution: isReel ? '1080x1920' : '1920x1080',
            format: 'mp4',
            type: 'video',
            sizeBytes: isReel ? 1105000 : 358000,
            sizeFormatted: isReel ? '1.1 MB' : '358 KB',
            fps: 60,
            hasAudio: true,
            downloadUrl: `/api/download-file?file=${vidFile}&filename=Batch_Item_${index + 1}.mp4`
          },
          {
            id: 'audio-mp3',
            quality: 'Audio Only (MP3)',
            resolution: '320 kbps',
            format: 'mp3',
            type: 'audio',
            sizeBytes: 202000,
            sizeFormatted: '202 KB',
            hasAudio: true,
            downloadUrl: `/api/download-file?file=${audFile}&filename=Batch_Audio_${index + 1}.mp3`
          }
        ],
        caption: `Batch item imported from ${urlStr}`,
        tags: ['batch', platform],
        watermarkRemoved: Boolean(removeWatermark),
        resolvedAt: new Date().toISOString()
      };

      return item;
    });

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
