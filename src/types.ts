export type PlatformType =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'facebook'
  | 'pinterest'
  | 'reddit'
  | 'threads'
  | 'other';

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

export interface CarouselItem {
  id: string;
  type: 'image' | 'video';
  previewUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
}

export interface MediaItem {
  id: string;
  url: string;
  platform: PlatformType;
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
  carouselItems?: CarouselItem[];
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

export interface DownloadHistoryEntry {
  id: string;
  title: string;
  platform: PlatformType;
  format: string;
  quality: string;
  downloadDate: string;
  sizeFormatted: string;
  thumbnail: string;
  url: string;
  downloadUrl: string;
}

export interface BatchTask {
  id: string;
  url: string;
  status: 'pending' | 'resolving' | 'ready' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  item?: MediaItem;
  selectedFormatId?: string;
}

export interface PlatformConfig {
  id: PlatformType;
  name: string;
  badge: string;
  color: string;
  gradient: string;
  textColor: string;
  description: string;
  supportedTypes: string[];
  exampleUrl: string;
}
