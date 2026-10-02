import { PlatformConfig, PlatformType } from '../types';

export const PLATFORMS: Record<PlatformType, PlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    badge: 'IG',
    color: '#E1306C',
    gradient: 'from-amber-500 via-rose-500 to-purple-600',
    textColor: 'text-rose-400',
    description: 'Reels, Carousels, Stories & High-Res Posts',
    supportedTypes: ['1080p Reels', 'Original Photos', 'Multi-slide Carousels', 'Audio Track'],
    exampleUrl: 'https://www.instagram.com/reel/C8qP8q0vdEa/'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    badge: 'TT',
    color: '#00F2FE',
    gradient: 'from-[#00F2FE] to-[#FE0979]',
    textColor: 'text-cyan-400',
    description: 'HD Watermark-Free Videos & Original Sound MP3',
    supportedTypes: ['Clean HD No-Watermark', 'Original Audio (MP3)', 'Fast Bitrate'],
    exampleUrl: 'https://www.tiktok.com/@kenji_creative/video/7382910482910'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    badge: 'YT',
    color: '#FF0000',
    gradient: 'from-red-600 to-rose-700',
    textColor: 'text-red-400',
    description: '4K Ultra HD, 1080p 60fps & YouTube Shorts',
    supportedTypes: ['4K UHD 2160p', '1080p 60fps', 'Shorts', '320kbps MP3'],
    exampleUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    badge: 'X',
    color: '#E7E9EA',
    gradient: 'from-slate-200 to-slate-400',
    textColor: 'text-slate-200',
    description: 'Videos, Animated GIFs & Photo Threads',
    supportedTypes: ['HD 1080p MP4', 'Looping GIFs', 'Full Resolution Images'],
    exampleUrl: 'https://x.com/tech_visuals/status/1798329482901'
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    badge: 'FB',
    color: '#1877F2',
    gradient: 'from-blue-600 to-indigo-600',
    textColor: 'text-blue-400',
    description: 'Reels, Watch Videos & Public Clips',
    supportedTypes: ['Full HD 1080p', 'Reels', 'SD Data Saver'],
    exampleUrl: 'https://www.facebook.com/reel/1049281729012'
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    badge: 'PIN',
    color: '#E60023',
    gradient: 'from-red-500 to-red-700',
    textColor: 'text-red-400',
    description: 'Idea Pins, Video Loops & Maximum Res Graphics',
    supportedTypes: ['Original Resolution Pin', 'Video Pins (MP4)', 'Idea Pin Carousels'],
    exampleUrl: 'https://www.pinterest.com/pin/914090049382109/'
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    badge: 'RD',
    color: '#FF4500',
    gradient: 'from-orange-500 to-amber-600',
    textColor: 'text-orange-400',
    description: 'Audio-Merged v.redd.it Videos & Galleries',
    supportedTypes: ['Merged Audio/Video MP4', 'GIFs', 'Album Galleries'],
    exampleUrl: 'https://www.reddit.com/r/NatureIsFuckingLit/comments/182a/alpine_lake/'
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    badge: 'TH',
    color: '#FFFFFF',
    gradient: 'from-neutral-200 to-neutral-400',
    textColor: 'text-neutral-300',
    description: 'Video Posts & Photo Collections',
    supportedTypes: ['1080p Video', 'Lossless Images', 'Post Audio'],
    exampleUrl: 'https://www.threads.net/@photographer/post/Cz801lP'
  },
  other: {
    id: 'other',
    name: 'Universal Web',
    badge: 'WEB',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-600',
    textColor: 'text-indigo-400',
    description: 'Direct MP4, WebM, HLS & Image Media Links',
    supportedTypes: ['Direct Stream Detection', 'MP4 / WebM', 'Raw Photos'],
    exampleUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }
};

export function detectPlatformFromUrl(url: string): PlatformType {
  const lower = url.toLowerCase().trim();
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

export interface SampleQuickLink {
  title: string;
  platform: PlatformType;
  tag: string;
  url: string;
}

export const SAMPLE_QUICK_LINKS: SampleQuickLink[] = [
  {
    title: 'Alpine Drone 4K',
    platform: 'youtube',
    tag: '4K Ultra HD',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
  },
  {
    title: 'Tokyo Streetwear Reel',
    platform: 'instagram',
    tag: '1080p Reel',
    url: 'https://www.instagram.com/reel/C8qP8q0vdEa/'
  },
  {
    title: 'Cyberpunk Shinjuku Dance',
    platform: 'tiktok',
    tag: 'No Watermark',
    url: 'https://www.tiktok.com/@kenjiofficial/video/7382910482910'
  },
  {
    title: 'Cinematic Robotics Clip',
    platform: 'twitter',
    tag: 'HD 60fps',
    url: 'https://x.com/tech_visuals/status/1798329482901'
  },
  {
    title: 'Nordic Architectural Pin',
    platform: 'pinterest',
    tag: 'Carousel Set',
    url: 'https://www.pinterest.com/pin/914090049382109/'
  },
  {
    title: 'Wildlife High-Res Footage',
    platform: 'reddit',
    tag: 'Merged Audio',
    url: 'https://www.reddit.com/r/nature/comments/fitzroy_drone/'
  }
];
