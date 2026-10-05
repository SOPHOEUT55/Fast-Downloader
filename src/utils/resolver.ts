import { MediaItem } from '../types';

export async function resolveMedia(url: string, removeWatermark = true): Promise<MediaItem> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid link');
  }

  let response: Response;
  try {
    response = await fetch('/api/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed, removeWatermark })
    });
  } catch (error) {
    console.error('Backend API resolve failed:', error);
    throw new Error('The media resolver is unavailable. Start the app server and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Could not resolve this media (HTTP ${response.status}).`);
  }
  if (!data.item) {
    throw new Error('The media resolver did not return a source video.');
  }
  return data.item as MediaItem;
}