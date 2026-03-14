
"use client";

/**
 * [STABILITY_ANCHOR: YOUTUBE_AUTH_SERVICE_V1.0]
 * Provides services to interact with the YouTube API for authentication and channel linking.
 */

export interface YouTubeChannelMetadata {
  id: string;
  title: string;
  description: string;
  avatarUrl: string;
  customUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
}

/**
 * Fetches the authenticated user's YouTube channel information.
 * @param accessToken Google OAuth Access Token with youtube.readonly scope.
 */
export async function fetchMyChannelInfo(accessToken: string): Promise<YouTubeChannelMetadata | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API Error:", errorData);
      return null;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      avatarUrl: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
      customUrl: channel.snippet.customUrl,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube channel info:", error);
    return null;
  }
}
