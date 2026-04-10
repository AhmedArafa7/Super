"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, Video } from "@/lib/video-store";
import { listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
import { searchYouTube, fetchTrending } from "@/lib/youtube-discovery-store";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useUploadStore } from "@/lib/upload-store";
import { useSettingsStore } from "@/lib/settings-store";
import { useToast } from "@/hooks/use-toast";
import { getHistory, HistoryItem } from "@/lib/history-store";
import { extractYouTubeId } from "@/lib/youtube-utils";
import { ContentItem } from "./wetube-types";

export function useWeTubeState() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { cachedAssets, addAsset, removeAsset } = useGlobalStorage();
  const { activeVideo, setActiveVideo } = useStreamStore();

  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>([]);
  const [feedVideos, setFeedVideos] = useState<FeedVideo[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<FeedVideo[]>([]);
  const [searchResults, setSearchResults] = useState<FeedVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [shortsFeed, setShortsFeed] = useState<FeedVideo[]>([]);
  const [isShortsLoading, setIsShortsLoading] = useState(false);
  const [lastSeenNotifications, setLastSeenNotifications] = useState(0);

  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'subs' | 'library' | 'notifications' | 'explore'>('home');
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchSp, setSearchSp] = useState<string>("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [activeChannel, setActiveChannel] = useState<{ id: string, name: string, avatar?: string } | null>(null);
  const [channelVideos, setChannelVideos] = useState<FeedVideo[]>([]);
  const [isChannelLoading, setIsChannelLoading] = useState(false);

  const [visibleCount, setVisibleCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    const target = observerTarget.current;
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [observerTarget]);

  useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, activeCategory, searchQuery]);

  const runAutoSync = useCallback(async (subs: YouTubeSubscription[], feed: FeedVideo[]) => {
    const favorites = subs.filter(s => s.isFavorite);
    if (favorites.length === 0) return;
    for (const sub of favorites) {
      const channelFeed = feed.filter(v => v.authorId === sub.channelId);
      const toSync = channelFeed.filter(v => {
        if (cachedAssets.some(a => a.id === `video-${v.id}`)) return false;
        if (sub.autoSyncType === 'long') return !v.isShorts;
        if (sub.autoSyncType === 'shorts') return v.isShorts;
        return true;
      });
      if (toSync.length > 0) {
        toSync.forEach(v => {
          addAsset({ id: `video-${v.id}`, type: 'video', title: v.title, sizeMB: v.isShorts ? 15 : 45 });
        });
      }
    }
  }, [cachedAssets, addAsset]);

  const loadTrending = async () => {
    try {
      const trending = await fetchTrending();
      setTrendingVideos(trending);
    } catch (e) { }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const data = await getStoredVideos();
      setVideos(data || []);
      loadTrending();
      setLastSeenNotifications(Number(localStorage.getItem('nexus_last_notifications') || 0));
    };
    loadInitialData();

    if (user?.id) {
      const unsubscribeSubs = listenToSubscriptions(user.id, (subs) => {
        setSubscriptions(subs);
        if (subs.length > 0) syncFeed(subs);
      });

      const loadHistory = async () => {
        const data = await getHistory(user.id);
        setHistory(data);
      };
      loadHistory();
      window.addEventListener('history-update', loadHistory);
      return () => {
        unsubscribeSubs();
        window.removeEventListener('history-update', loadHistory);
      };
    }
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    if (activeChannel?.id) {
      const loadChannelContent = async () => {
        setIsChannelLoading(true);
        setChannelVideos([]);
        try {
          const { fetchChannelVideos } = await import("@/lib/youtube-feed-store");
          const vids = await fetchChannelVideos(activeChannel.id);
          if (isMounted) {
            const enriched = vids.map(v => ({ ...v, channelAvatar: activeChannel.avatar }));
            setChannelVideos(enriched);
          }
        } catch (e) {
          if (isMounted) toast({ variant: "destructive", title: "فشل تحميل محتوى القناة" });
        } finally {
          if (isMounted) setIsChannelLoading(false);
        }
      };
      loadChannelContent();
    } else {
      setChannelVideos([]);
      setIsChannelLoading(false);
    }
    return () => { isMounted = false; };
  }, [activeChannel?.id, activeChannel?.avatar, toast]);

  const syncFeed = async (subs: YouTubeSubscription[]) => {
    if (subs.length === 0) {
      setFeedVideos([]);
      return;
    }
    setIsFeedLoading(true);
    try {
      const feed = await fetchAllSubscriptionsFeed(subs.map(s => s.channelId));
      const now = Date.now();
      const enrichedFeed = feed.map(v => {
        const sub = subs.find(s => s.channelId === v.authorId);
        return { ...v, channelAvatar: sub?.avatarUrl, fetchedAt: now };
      });
      setFeedVideos(enrichedFeed);
      runAutoSync(subs, enrichedFeed);
    } catch (e) {
      console.error("Feed Sync Failure", e);
    } finally {
      setIsFeedLoading(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'subs' || activeTab === 'notifications') && feedVideos.length === 0 && subscriptions.length > 0 && !isFeedLoading) {
      syncFeed(subscriptions);
    }
  }, [activeTab, feedVideos.length, subscriptions, isFeedLoading]);

  useEffect(() => {
    if (activeTab === 'shorts' && shortsFeed.length === 0) {
      const loadShorts = async () => {
        setIsShortsLoading(true);
        try {
          const results = await searchYouTube('#shorts', 'EgQQASAB');
          setShortsFeed(results.map(v => ({ ...v, isShorts: true })));
        } catch (e) { }
        setIsShortsLoading(false);
      };
      loadShorts();
    }
  }, [activeTab, shortsFeed.length]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      const timeout = setTimeout(() => {
        const now = Date.now();
        setLastSeenNotifications(now);
        localStorage.setItem('nexus_last_notifications', now.toString());
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [activeTab]);

  const handleSearch = async (q: string, sp?: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchQuery(q);
    try {
      const results = await searchYouTube(q, sp || searchSp);
      setSearchResults(results);
      setActiveTab('home');
      setActiveChannel(null);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل البحث" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleLocal = (video: Video | FeedVideo) => {
    const assetId = `video-${video.id}`;
    if (cachedAssets.some(a => a.id === assetId)) {
      removeAsset(assetId);
      toast({ title: "تم الإزالة", description: "تم حذف الفيديو من التنزيلات" });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: 45, downloadedQuality: '720' });
      toast({ title: "جاري التنزيل", description: "سيتم حفظ الفيديو للمشاهدة بدون إنترنت بجودة 720p" });
    }
  };

  const addTask = useUploadStore(state => state.addTask);

  const handleUpload = async (source: 'youtube' | 'drive' | 'local', uploadData: { title: string, externalUrl?: string, file?: File, productIds?: string[], productDisplayMode?: any }) => {
    if (!user) return null;
    if (source === 'youtube' || source === 'drive') {
      let youtubeMeta = null;
      if (source === 'youtube' && uploadData.externalUrl) {
         const { fetchVideoDetails } = await import("@/lib/youtube-discovery-store");
         const ytId = extractYouTubeId(uploadData.externalUrl);
         if (ytId) youtubeMeta = await fetchVideoDetails(ytId);
      }
      await import("@/lib/video-store").then(m => m.addVideo({
        title: youtubeMeta?.title || uploadData.title,
        author: youtubeMeta?.author || "",
        authorId: youtubeMeta?.authorId || "", 
        channelAvatar: youtubeMeta?.channelAvatar || "",
        thumbnail: "", 
        time: source === 'youtube' ? "YouTube" : "Vault",
        status: (user.role === 'admin' || user.role === 'founder') ? 'published' : 'pending_review',
        visibility: 'public',
        allowedUserIds: [],
        uploaderRole: user.role as any,
        submitterId: user.id,
        submitterName: user.name,
        source: source,
        externalUrl: uploadData.externalUrl || "",
        productIds: uploadData.productIds,
        productDisplayMode: uploadData.productDisplayMode
      }));
      toast({ title: "تم إرسال الرابط للشبكة بنجاح", description: (user.role === 'admin' || user.role === 'founder') ? "تم النشر." : "في انتظار المراجعة." });
      return null;
    } else if (uploadData.file) {
      const taskId = addTask(uploadData.file, 'video', {
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        channelAvatar: user.avatar_url,
        status: user.role === 'admin' ? 'published' : 'pending_review',
        productIds: uploadData.productIds,
        productDisplayMode: uploadData.productDisplayMode
      });
      toast({ title: "بدأ الرفع المباشر..." });
      return taskId;
    }
    return null;
  };

  const handleChannelClick = (id: string, name: string, avatar?: string) => {
    setActiveVideo(null);
    setActiveTab('home');
    setSearchResults([]);
    setSearchQuery("");
    setActiveChannel({ id, name, avatar });
  };

  const allHomeContent = useMemo(() => {
    if (searchResults.length > 0 && searchQuery) {
      return searchResults.map(v => {
        const sub = subscriptions.find(s => s.channelId === v.authorId);
        return { ...v, channelAvatar: v.channelAvatar || sub?.avatarUrl };
      });
    }

    if (activeChannel) {
      return channelVideos.map(v => {
        const sub = subscriptions.find(s => s.channelId === v.authorId);
        return { ...v, channelAvatar: v.channelAvatar || activeChannel.avatar || sub?.avatarUrl };
      });
    }

    const issaveThumb = (url?: string) => !url || url.includes('photo-1611162617474-5b21e879e113') || url.includes('picsum.photos');

    const platformVids = videos.filter(v => v.status === 'published').map(v => {
      const sub = subscriptions.find(s => s.channelId === v.authorId);
      let vidId = v.id;
      if (v.source === 'youtube' && v.externalUrl) {
        const extractedId = extractYouTubeId(v.externalUrl);
        if (extractedId) vidId = extractedId;
      }
      return {
        ...v,
        id: vidId,
        source: v.source || 'platform',
        thumbnail: issaveThumb(v.thumbnail) ? null : v.thumbnail,
        channelAvatar: v.channelAvatar || sub?.avatarUrl || (v.authorId === user?.id ? user?.avatar_url : null)
      };
    });

    const feedVids = feedVideos.map(v => {
      const sub = subscriptions.find(s => s.channelId === v.authorId);
      return {
        ...v,
        externalUrl: v.url,
        time: "حديثاً",
        source: 'youtube' as const,
        channelAvatar: v.channelAvatar || sub?.avatarUrl
      };
    });

    const trendingVids = trendingVideos.map(v => {
      const sub = subscriptions.find(s => s.channelId === v.authorId);
      return {
        ...v,
        externalUrl: v.url,
        time: "رائج",
        source: 'youtube' as const,
        channelAvatar: v.channelAvatar || sub?.avatarUrl
      };
    });

    let combined: ContentItem[] = [];
    if (activeTab === 'home') combined = [...platformVids, ...feedVids];
    else if (activeTab === 'explore') combined = trendingVids;
    else combined = [...platformVids, ...feedVids, ...trendingVids];

    let finalCombined = combined;
    if (activeCategory === "تريند") finalCombined = trendingVids;
    else if (activeCategory !== "الكل" && searchResults.length === 0) {
      finalCombined = combined.filter(v => v.title.toLowerCase().includes(activeCategory.toLowerCase()) || (v as any).category === activeCategory);
    }
    
    const systemSettings = useSettingsStore.getState().settings;
    if (systemSettings.general.hideMusic !== false) {
      finalCombined = finalCombined.filter(v => !(v as any).hasMusic);
    }

    return finalCombined.sort(() => Math.random() - 0.5).sort((a, b) => {
      const aHasThumb = a.source === 'youtube' || (a.thumbnail && !issaveThumb(a.thumbnail));
      const bHasThumb = b.source === 'youtube' || (b.thumbnail && !issaveThumb(b.thumbnail));
      if (aHasThumb && !bHasThumb) return -1;
      if (!aHasThumb && bHasThumb) return 1;
      return 0;
    });
  }, [videos, feedVideos, trendingVideos, searchResults, searchQuery, activeCategory, activeTab, subscriptions, activeChannel, channelVideos, user?.id, user?.avatar_url]);

  return {
    user,
    cachedAssets,
    activeVideo, setActiveVideo,
    videos, subscriptions, feedVideos, searchResults, setSearchResults, isSearching,
    shortsFeed, isShortsLoading, lastSeenNotifications,
    activeTab, setActiveTab,
    activeCategory, setActiveCategory,
    isSidebarOpen, setIsSidebarOpen,
    searchQuery, setSearchQuery,
    isMobileSearchOpen, setIsMobileSearchOpen,
    isFeedLoading, history,
    searchSp, setSearchSp,
    isAddModalOpen, setIsAddModalOpen,
    isManageModalOpen, setIsManageModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    activeChannel, setActiveChannel,
    channelVideos, isChannelLoading,
    visibleCount, observerTarget,
    allHomeContent,
    handleSearch, handleToggleLocal, handleUpload, handleChannelClick
  };
}
