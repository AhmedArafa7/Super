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
 * دالة لاستخراج JSON من نص HTML بناءً على اسم المتغير بأسلوب مطابقة الأقواس المتداخلة
 */
function extractJSONFromHTML(html: string, variableName: string): any {
  try {
    const pattern = `var ${variableName} = `;
    const startIndex = html.indexOf(pattern);
    if (startIndex === -1) return null;

    const jsonStart = html.indexOf('{', startIndex + pattern.length);
    if (jsonStart === -1) return null;

    let braceCount = 0;
    let inString = false;
    let escape = false;
    
    for (let i = jsonStart; i < html.length; i++) {
        const char = html[i];
        
        if (escape) {
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') braceCount++;
            else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    const jsonString = html.substring(jsonStart, i + 1);
                    return JSON.parse(jsonString);
                }
            }
        }
    }
    return null;
  } catch (e) {
    console.error(`Error parsing ${variableName}`, e);
    return null;
  }
}

function extractInitialData(html: string): any {
  return extractJSONFromHTML(html, 'ytInitialData');
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
    const published = renderer.publishedTimeText?.simpleText || renderer.videoInfo?.runs?.[0]?.text || "";
    const views = renderer.viewCountText?.simpleText || renderer.shortViewCountText?.simpleText || "";

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

    const playerResponse = extractJSONFromHTML(html, 'ytInitialPlayerResponse');
    const videoDetails = playerResponse?.videoDetails;
    const primaryInfo = data.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find((c: any) => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
    const dateText = primaryInfo?.dateText?.simpleText || "";

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
      date: dateText,
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
  const url = YOUTUBE_WATCH_URL + videoId;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();
    const data = extractInitialData(html);

    if (!data) return [];

    const comments: YouTubeComment[] = [];
    
    // محاول الوصول لمسار التعليقات في شجرة JSON يوتيوب
    // ملاحظة: التعليقات غالباً لا تكون متوفرة في الطلب الأول وتحتاج لطلب continuation
    // ولكننا سنحاول البحث عن أي تعليقات موجودة بالفعل
    const findComments = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.commentRenderer) return obj.commentRenderer;
      
      for (const key in obj) {
        const result = findComments(obj[key]);
        if (result) return result;
      }
      return null;
    };

    // هذا مجرد بحث سطحي، يوتيوب الحديث نادراً ما يرسل التعليقات في التحميل الأول
    // سنقوم الآن بإرجاع مصفوفة فارغة بشكل نظيف لتجنب الـ SyntaxError 
    // وجعل الواجهة تعرض "لا توجد تعليقات حالياً" بدلاً من التوقف
    
    return comments;
  } catch (err) {
    console.error("Comments Fetch Error", err);
    return [];
  }
};
