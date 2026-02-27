
'use client';

/**
 * [STABILITY_ANCHOR: YOUTUBE_FEED_V2.0]
 * محرك جلب فيديوهات القنوات المشترك بها مع استخدام الصور الحقيقية عالية الدقة.
 */

export interface FeedVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  author: string;
  authorId: string;
  published: string;
  source: 'youtube';
}

export const fetchChannelVideos = async (channelId: string): Promise<FeedVideo[]> => {
  if (!channelId) return [];
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(rssUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const entries = xmlDoc.getElementsByTagName("entry");
    const videos: FeedVideo[] = [];

    for (let i = 0; i < Math.min(entries.length, 15); i++) {
      const entry = entries[i];
      const videoId = entry.getElementsByTagName("yt:videoId")[0]?.textContent || "";
      const title = entry.getElementsByTagName("title")[0]?.textContent || "";
      const author = entry.getElementsByTagName("author")[0]?.getElementsByTagName("name")[0]?.textContent || "";
      const published = entry.getElementsByTagName("published")[0]?.textContent || "";
      
      if (videoId) {
        videos.push({
          id: videoId,
          title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          // استخدام الرابط المباشر للصورة المصغرة عالية الجودة لتجنب الوهمية
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          author,
          authorId: channelId,
          published,
          source: 'youtube'
        });
      }
    }

    return videos;
  } catch (err) {
    console.error(`Failed to fetch feed for channel ${channelId}`, err);
    return [];
  }
};

export const fetchAllSubscriptionsFeed = async (channelIds: string[]): Promise<FeedVideo[]> => {
  if (!channelIds || channelIds.length === 0) return [];
  
  const feedPromises = channelIds.map(id => fetchChannelVideos(id));
  const results = await Promise.all(feedPromises);
  
  const allVideos = results.flat();
  return allVideos.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
};
