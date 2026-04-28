
"use client";

/**
 * [STABILITY_ANCHOR: YOUTUBE_SYNC_V1.0]
 * محرك المزامنة العصبية: يقوم بمزامنة التفاعلات (الإعجابات، الاشتراكات، التعليقات) مع حساب يوتيوب الرسمي.
 */

export async function syncLike(videoId: string, rating: 'like' | 'dislike' | 'none', accessToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=${rating}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "فشلت مزامنة التفضيل");
    }
    return true;
  } catch (error) {
    console.error("YouTube Sync Error (Like):", error);
    throw error;
  }
}

export async function syncSubscription(channelId: string, action: 'subscribe' | 'unsubscribe', accessToken: string) {
  try {
    if (action === 'subscribe') {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              resourceId: {
                kind: 'youtube#channel',
                channelId: channelId,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "فشلت عملية الاشتراك");
      }
    } else {
        // Find the subscription ID first
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/subscriptions?part=id&mine=true&forChannelId=${channelId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!searchResponse.ok) {
          throw new Error("فشل في البحث عن الاشتراك للإلغاء");
        }

        const searchData = await searchResponse.json();
        if (searchData.items && searchData.items.length > 0) {
          const subscriptionId = searchData.items[0].id;
          
          const deleteResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/subscriptions?id=${subscriptionId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!deleteResponse.ok) {
            throw new Error("فشلت عملية إلغاء الاشتراك");
          }
        } else {
          console.warn("User is not subscribed to this channel, nothing to unsubscribe from.");
        }
    }
    return true;
  } catch (error) {
    console.error("YouTube Sync Error (Subscription):", error);
    throw error;
  }
}

export async function postComment(videoId: string, text: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            videoId: videoId,
            topLevelComment: {
              snippet: {
                textOriginal: text,
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "فشل إرسال التعليق");
    }
    return true;
  } catch (error) {
    console.error("YouTube Sync Error (Comment):", error);
    throw error;
  }
}

export async function listMyPlaylists(accessToken: string) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "فشل جلب قوائم التشغيل");
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      itemCount: item.contentDetails.itemCount,
      thumbnail: item.snippet.thumbnails.default?.url
    }));
  } catch (error) {
    console.error("YouTube Sync Error (ListPlaylists):", error);
    throw error;
  }
}

export async function addToPlaylist(playlistId: string, videoId: string, accessToken: string) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "فشلت الإضافة لقائمة التشغيل");
    }

    return true;
  } catch (error) {
    console.error("YouTube Sync Error (AddToPlaylist):", error);
    throw error;
  }
}

export async function createPlaylist(title: string, privacyStatus: 'public' | 'private' | 'unlisted' = 'private', accessToken: string) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title,
          },
          status: {
            privacyStatus: privacyStatus,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "فشل إنشاء قائمة التشغيل");
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("YouTube Sync Error (CreatePlaylist):", error);
    throw error;
  }
}
