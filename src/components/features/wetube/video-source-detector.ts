/**
 * [STABILITY_ANCHOR: VIDEO_SOURCE_DETECTOR_V1.0]
 * Utility to identify the origin of a video file or stream.
 */

export type VideoSource = 'youtube' | 'telegram' | 'local' | 'stream' | 'unknown';

export function detectVideoSource(url: string | undefined, sourceProperty?: string): VideoSource {
  if (!url) return 'unknown';

  // If a source property is explicitly provided (e.g. from a database record)
  if (sourceProperty) {
    const s = sourceProperty.toLowerCase();
    if (s === 'youtube') return 'youtube';
    if (s === 'telegram') return 'telegram';
    if (s === 'local') return 'local';
    if (s === 'stream') return 'stream';
  }

  // Detect by URL patterns
  if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
    return 'youtube';
  }

  if (url.includes('t.me/') || url.includes('telegram.org/')) {
    return 'telegram';
  }

  if (url.startsWith('blob:') || url.startsWith('file:') || url.includes('/firebasestorage.googleapis.com/')) {
    return 'local';
  }

  if (url.includes('m3u8') || url.includes('rtmp://')) {
    return 'stream';
  }

  return 'unknown';
}
