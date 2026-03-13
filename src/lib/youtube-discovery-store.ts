'use client';

import { FeedVideo } from "./youtube-feed-store";

/**
 * [STABILITY_ANCHOR: YOUTUBE_DISCOVERY_V1.0]
 * محرك البحث والاكتشاف المستقل - يقوم بجلب البيانات مباشرة من يوتيوب عبر البروكسي.
 */

export interface VideoDetails extends FeedVideo {
  description: string;
  views: string;
  duration: string;
  likes?: number;
  date?: string;
  relatedVideos: FeedVideo[];
}

export interface YouTubeComment {
  author: string;
  text: string;
  authorThumb: string;
  time: string;
}

const YOUTUBE_SEARCH_URL = "https://www.youtube.com/results?search_query=";
const YOUTUBE_TRENDING_URL = "https://www.youtube.com/feed/trending";
const YOUTUBE_WATCH_URL = "https://www.youtube.com/watch?v=";

/**
 * دالة لاستخراج ytInitialData من نص الاستجابة
 */
function extractInitialData(html: string): any {
  try {
    const startPattern = 'var ytInitialData = ';
    const endPattern = ';</script>';
    const startIndex = html.indexOf(startPattern);
    if (startIndex === -1) return null;
    
    const jsonStart = startIndex + startPattern.length;
    const endIndex = html.indexOf(endPattern, jsonStart);
    if (endIndex === -1) return null;
    
    const jsonString = html.substring(jsonStart, endIndex);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse ytInitialData", e);
    return null;
  }
}

/**
 * تحويل كائن فيديو يوتيوب الداخلي إلى واجهة FeedVideo الخاصة بنا
 */
function parseVideoRenderer(renderer: any): FeedVideo | null {
  try {
    const videoId = renderer.videoId;
    if (!videoId) return null;

    const title = renderer.title.runs[0].text;
    const author = renderer.ownerText?.runs[0].text || renderer.shortBylineText?.runs[0].text || "YouTube Channel";
    const authorId = renderer.ownerText?.runs[0].navigationEndpoint?.browseEndpoint?.browseId || "";
    const published = renderer.publishedTimeText?.simpleText || "";
    const views = renderer.viewCountText?.simpleText || "";

    return {
      id: videoId,
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      author,
      authorId,
      published: published || views,
      source: 'youtube',
      isShorts: false // سيتم التحقق لاحقاً إذا كان الرابط shorts
    };
  } catch (e) {
    return null;
  }
}

/**
 * البحث في يوتيوب
 */
export const searchYouTube = async (query: string): Promise<FeedVideo[]> => {
  const url = YOUTUBE_SEARCH_URL + encodeURIComponent(query);
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();
    const data = extractInitialData(html);

    if (!data) return [];

    // المسار للـ videos في نتائج البحث
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return [];

    const videos: FeedVideo[] = [];
    contents.forEach((section: any) => {
      const items = section.itemSectionRenderer?.contents;
      if (items) {
        items.forEach((item: any) => {
          if (item.videoRenderer) {
            const v = parseVideoRenderer(item.videoRenderer);
            if (v) videos.push(v);
          }
        });
      }
    });

    return videos;
  } catch (err) {
    console.error("YouTube Search Error", err);
    return [];
  }
};

/**
 * جلب الفيديوهات الرائجة
 */
export const fetchTrending = async (): Promise<FeedVideo[]> => {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(YOUTUBE_TRENDING_URL)}`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();
    const data = extractInitialData(html);

    if (!data) return [];

    // المسار للـ videos في التريند
    const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
    const trendingTab = tabs?.find((t: any) => t.tabRenderer?.selected)?.tabRenderer;
    const contents = trendingTab?.content?.sectionListRenderer?.contents;
    
    if (!contents) return [];

    const videos: FeedVideo[] = [];
    contents.forEach((section: any) => {
      const shelf = section.itemSectionRenderer?.contents[0]?.shelfRenderer;
      const items = shelf?.content?.expandedShelfContentsRenderer?.items;
      if (items) {
        items.forEach((item: any) => {
          if (item.videoRenderer) {
            const v = parseVideoRenderer(item.videoRenderer);
            if (v) videos.push(v);
          }
        });
      }
    });

    return videos;
  } catch (err) {
    console.error("YouTube Trending Error", err);
    return [];
  }
};

/**
 * جلب تفاصيل فيديو محدد
 */
export const fetchVideoDetails = async (videoId: string): Promise<VideoDetails | null> => {
  const url = YOUTUBE_WATCH_URL + videoId;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();
    const data = extractInitialData(html);

    if (!data) return null;

    const playerResponse = JSON.parse(html.split('var ytInitialPlayerResponse = ')[1].split(';</script>')[0]);
    const videoDetails = playerResponse?.videoDetails;

    // استخراج الفيديوهات ذات الصلة
    const secondaryContents = data.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results;
    const related: FeedVideo[] = [];
    if (secondaryContents) {
      secondaryContents.forEach((item: any) => {
        if (item.compactVideoRenderer) {
          const v = parseVideoRenderer(item.compactVideoRenderer);
          if (v) related.push(v);
        }
      });
    }

    return {
      id: videoId,
      title: videoDetails?.title || "",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      author: videoDetails?.author || "",
      authorId: videoDetails?.channelId || "",
      published: "", 
      source: 'youtube',
      isShorts: false,
      description: videoDetails?.shortDescription || "",
      views: videoDetails?.viewCount || "0",
      duration: videoDetails?.lengthSeconds || "0",
      relatedVideos: related
    };
  } catch (err) {
    console.error("Video Details Fetch Error", err);
    return null;
  }
};

/**
 * جلب تعليقات فيديو (تبسيط)
 */
export const fetchVideoComments = async (videoId: string): Promise<YouTubeComment[]> => {
  // للبيئة الحقيقية، نحتاج لاستخدام YouTube Data API أو نظام تعليقات داخلي.
  // حالياً سنرجع مصفوفة فارغة بدلاً من البيانات الوهمية لضمان مصداقية البيانات في البرودكشن.
  return [];
};
