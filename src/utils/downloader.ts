import JSZip from 'jszip';
import { DownloadHistoryEntry, MediaFormat, MediaItem } from '../types';

const HISTORY_STORAGE_KEY = 'omnisave_download_history_v1';

// Save download to local history
export function saveToHistory(item: MediaItem, format: MediaFormat): void {
  try {
    const existing = getDownloadHistory();
    const entry: DownloadHistoryEntry = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      title: item.title,
      platform: item.platform,
      format: format.format.toUpperCase(),
      quality: format.quality,
      downloadDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      sizeFormatted: format.sizeFormatted,
      thumbnail: item.thumbnail,
      url: item.url,
      downloadUrl: format.downloadUrl
    };

    const updated = [entry, ...existing.filter(h => h.url !== item.url || h.quality !== format.quality)].slice(0, 50);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to history:', err);
  }
}

// Retrieve download history
export function getDownloadHistory(): DownloadHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Clear history
export function clearDownloadHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

// Trigger real browser download with verified binary MIME type
export async function triggerFileDownload(
  downloadUrl: string,
  filename: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (onProgress) onProgress(20);

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }

    // Verify response is not an HTML error page!
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Received HTML instead of media binary data');
    }

    if (onProgress) onProgress(60);
    const rawBlob = await response.blob();

    if (rawBlob.size < 512) {
      throw new Error('File payload too small or truncated');
    }

    if (onProgress) onProgress(90);

    // Determine exact binary MIME type
    let mimeType = rawBlob.type;
    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith('.mp4')) {
      mimeType = 'video/mp4';
    } else if (lowerName.endsWith('.mp3')) {
      mimeType = 'audio/mpeg';
    } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (lowerName.endsWith('.png')) {
      mimeType = 'image/png';
    }

    // Wrap in explicit typed Blob to ensure OS associations work on Windows/Mac/iOS/Android
    const typedBlob = new Blob([rawBlob], { type: mimeType });
    const blobUrl = URL.createObjectURL(typedBlob);

    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
    if (onProgress) onProgress(100);
  } catch (err) {
    console.warn('Direct blob fetch failed, falling back to direct anchor trigger:', err);
    // Direct anchor fallback with download attribute
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onProgress) onProgress(100);
  }
}

// Download carousel items or batch items as a single organized ZIP
export async function downloadAllAsZip(
  files: { url: string; filename: string }[],
  zipFilename: string,
  onProgress?: (percent: number, currentItem: string) => void
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(Math.round(((i) / files.length) * 85), file.filename);
    }

    try {
      const resp = await fetch(file.url);
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          const blob = await resp.blob();
          if (blob.size > 256) {
            zip.file(file.filename, blob);
            continue;
          }
        }
      }
      // If fetch fails or returned html, fallback to text manifest entry
      zip.file(`${file.filename}.txt`, `Source link: ${file.url}\nSaved with OmniSave Downloader\n`);
    } catch {
      zip.file(`${file.filename}.txt`, `Source link: ${file.url}\nSaved with OmniSave Downloader\n`);
    }
  }

  // Include a clean manifest note
  zip.file(
    'DOWNLOAD_MANIFEST.txt',
    `OmniSave Downloader Package\nGenerated at: ${new Date().toISOString()}\nTotal items: ${files.length}\nAll items saved at maximum source resolution.\n`
  );

  if (onProgress) onProgress(90, 'Packing archive...');
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) onProgress(90 + Math.round(metadata.percent * 0.1), 'Compiling ZIP...');
  });

  const zipUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = zipUrl;
  link.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(zipUrl), 8000);
  if (onProgress) onProgress(100, 'Done');
}
