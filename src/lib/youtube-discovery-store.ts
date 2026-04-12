'use client';

import { FeedVideo } from "./youtube-feed-store";
import { useDataUsageStore } from "./data-usage-store";

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
    const channelAvatar = renderer.channelThumbnail?.thumbnails?.[0]?.url;

    return {
      id: videoId,
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      author,
      authorId,
      published: published || views,
      source: 'youtube',
      isShorts: false, // سيتم التحقق لاحقاً إذا كان الرابط shorts
      channelAvatar,
      type: renderer.videoId ? 'video' : 'channel'
    };
  } catch (e) {
    return null;
  }
}

/**
 * البحث في يوتيوب مع دعم الفلاتر
 */
export const searchYouTube = async (query: string, sp?: string): Promise<FeedVideo[]> => {
  const url = YOUTUBE_SEARCH_URL + encodeURIComponent(query) + (sp ? `&sp=${sp}` : "");
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();
    useDataUsageStore.getState().recordUsage(html.length, 'api');
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
    useDataUsageStore.getState().recordUsage(html.length, 'api');
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
    useDataUsageStore.getState().recordUsage(html.length, 'api');
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
      channelAvatar: data.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find((c: any) => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer?.thumbnail?.thumbnails?.[0]?.url,
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
 * جلب تعليقات فيديو (الحقيقية عبر Innertube API)
 */
export const fetchVideoComments = async (videoId: string): Promise<YouTubeComment[]> => {
  const url = YOUTUBE_WATCH_URL + videoId;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();
    const data = extractInitialData(html);

    if (!data) return [];

    // 1. استخراج مفتاح API الداخلي
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    const clientVersionMatch = html.match(/"clientVersion":"([^"]+)"/);
    
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;
    const clientVersion = clientVersionMatch ? clientVersionMatch[1] : '2.20230214.07.00';

    if (!apiKey) return [];

    // 2. البحث عن توكن التعليقات (Continuation Token)
    let commentsToken: string | null = null;
    const findCommentContinuation = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      if (
          (obj.targetId === "comments-section" || obj.sectionIdentifier === "comment-item-section") && 
          obj.continuations?.[0]?.nextContinuationData?.continuation
      ) {
         return obj.continuations[0].nextContinuationData.continuation;
      }
      for (const key in obj) {
        const res = findCommentContinuation(obj[key]);
        if (res) return res;
      }
      return null;
    };

    commentsToken = findCommentContinuation(data);
    if (!commentsToken) return []; // قد تكون التعليقات معطلة

    // 3. جلب التعليقات عبر طلب POST للبروكسي
    const nextUrl = `https://www.youtube.com/youtubei/v1/next?key=${apiKey}`;
    const nextProxyUrl = `/api/proxy?url=${encodeURIComponent(nextUrl)}`;
    
    const commentsRes = await fetch(nextProxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: clientVersion
          }
        },
        continuation: commentsToken
      })
    });

    const rawComments = await commentsRes.json();
    const parsedComments: YouTubeComment[] = [];
    
    // 4. استخراج التعليقات من الاستجابة المعقدة
    const endpoints = rawComments.onResponseReceivedEndpoints || [];
    const items = endpoints[endpoints.length - 1]?.appendContinuationItemsAction?.continuationItems || 
                  endpoints[endpoints.length - 1]?.reloadContinuationItemsCommand?.continuationItems || [];

    for (const item of items) {
      if (item.commentThreadRenderer) {
        const comment = item.commentThreadRenderer.comment.commentRenderer;
        parsedComments.push({
          author: comment.authorText?.simpleText || comment.authorText?.runs?.[0]?.text || "Unknown",
          text: comment.contentText?.runs?.map((r: any) => r.text).join("") || comment.contentText?.simpleText || "",
          authorThumb: comment.authorThumbnail?.thumbnails?.[0]?.url || "",
          time: comment.publishedTimeText?.runs?.[0]?.text || comment.publishedTimeText?.simpleText || ""
        });
      }
    }

    return parsedComments;
  } catch (err) {
    console.error("Real Comments Fetch Error", err);
    return [];
  }
};

/**
 * [NEURAL_BRIDGE] جلب سجل مشاهدات يوتيوب الرسمي (للقراءة فقط)
 * يسمح للمستخدم بإكمال ما بدأه على المنصة الرسمية دون تتبع
 */
export const fetchYouTubeRemoteHistory = async (): Promise<FeedVideo[]> => {
  const url = "https://www.youtube.com/feed/history";
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    const html = await response.text();
    const data = extractInitialData(html);

    if (!data) return [];

    // المسار الخاص بسجل المشاهدات في ytInitialData
    const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
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
    console.error("YouTube Remote History Sync Error", err);
    return [];
  }
};
