/**
 * [STABILITY_ANCHOR: YOUTUBE_UTILS_V1.0]
 * Utilities for handling YouTube specific data and transformations.
 */

/**
 * Extracts the 11-character YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/v/...
 */
export function extractYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  
  // Standard ID matches (11 characters)
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[7].length === 11) {
    return match[7];
  }
  
  // Handing already extracted ID
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
    return url;
  }

  return null;
}
