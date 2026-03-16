"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, History, Bell } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, Video, deleteVideo } from "@/lib/video-store";
import { listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
import { searchYouTube, fetchTrending } from "@/lib/youtube-discovery-store";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useUploadStore } from "@/lib/upload-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getHistory, HistoryItem } from "@/lib/history-store";

import { VideoCard } from "./stream/video-card";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";
import { ImportSubscriptionsModal } from "./wetube/import-subscriptions-modal";
import { WeTubeWatchView } from "./wetube/wetube-watch-view";
import { WeTubeShortsView } from "./wetube/wetube-shorts-view";
import { WeTubeTopbar } from "./wetube/wetube-topbar";
import { WeTubeSidebar } from "./wetube/wetube-sidebar";

const CATEGORIES = [
  "الكل", "تريند", "موسيقى", "ألعاب", "مباشر", "رياضة", "أخبار",
  "بودكاست", "برمجة", "طبخ", "تكنولوجيا", "كوميديا", "اقتصاد"
];

/**
 * [STABILITY_ANCHOR: WETUBE_YOUTUBE_CLONE_V1.0]
 * النسخة المطابقة ليوتيوب بالكامل (تصميم، هيكلة، وشعور الاستخدام).
 */
export function WeTube({ onOpenVault }: { onOpenVault?: () => void }) {
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

  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'subs' | 'library' | 'notifications'>('home');
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

  // Auto-sync logic (kept from original)
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

  useEffect(() => {
    const loadInitialData = async () => {
      const data = await getStoredVideos();
      setVideos(data || []);
      loadTrending();
    };
    loadInitialData();

    if (user?.id) {
      const unsubscribeSubs = listenToSubscriptions(user.id, (subs) => {
        setSubscriptions(subs);
        // Removed: syncFeed(subs); // Optimization: Fetch on demand instead of auto-sync
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

  // Performance Optimization: Trigger feed sync only when relevant tabs are accessed
  useEffect(() => {
    if ((activeTab === 'subs' || activeTab === 'notifications') && feedVideos.length === 0 && subscriptions.length > 0 && !isFeedLoading) {
      syncFeed(subscriptions);
    }
  }, [activeTab, feedVideos.length, subscriptions, isFeedLoading]);

  const syncFeed = async (subs: YouTubeSubscription[]) => {
    if (subs.length === 0) {
      setFeedVideos([]);
      return;
    }
    setIsFeedLoading(true);
    try {
      const feed = await fetchAllSubscriptionsFeed(subs.map(s => s.channelId));
      const enrichedFeed = feed.map(v => {
        const sub = subs.find(s => s.channelId === v.authorId);
        return { ...v, channelAvatar: sub?.avatarUrl };
      });
      setFeedVideos(enrichedFeed);
      runAutoSync(subs, enrichedFeed);
    } catch (e) {
      console.error("Feed Sync Failure", e);
    } finally {
      setIsFeedLoading(false);
    }
  };

  const loadTrending = async () => {
    try {
      const trending = await fetchTrending();
      setTrendingVideos(trending);
    } catch (e) {}
  };

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
      setActiveChannel(null); // Clear channel view on search
    } catch (e) {
      toast({ variant: "destructive", title: "فشل البحث" });
    } finally {
      setIsSearching(false);
    }
  };

  const addTask = useUploadStore(state => state.addTask);

  const handleToggleLocal = (video: any) => {
    const assetId = `video-${video.id}`;
    if (cachedAssets.some(a => a.id === assetId)) {
      removeAsset(assetId);
      toast({ title: "تم الإزالة", description: "تم حذف الفيديو من التنزيلات" });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: 45, downloadedQuality: '720' });
      toast({ title: "جاري التنزيل", description: "سيتم حفظ الفيديو للمشاهدة بدون إنترنت بجودة 720p" });
    }
  };

  const handleUpload = async (source: any, uploadData: any) => {
    if (!user) return null;
    if (source === 'youtube' || source === 'drive') {
      await import("@/lib/video-store").then(m => m.addVideo({
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        thumbnail: "", // Real thumbnail is parsed automatically by the cards for youtube
        time: source === 'youtube' ? "YouTube" : "Vault",
        status: user.role === 'admin' ? 'published' : 'pending_review',
        visibility: 'public',
        allowedUserIds: [],
        uploaderRole: user.role as any,
        source: source,
        externalUrl: uploadData.externalUrl,
        productIds: uploadData.productIds,
        productDisplayMode: uploadData.productDisplayMode
      }));
      toast({ title: "تم إرسال الرابط للشبكة بنجاح", description: (user.role === 'admin' || user.role === 'founder') ? "تم النشر." : "في انتظار المراجعة." });
      return null;
    } else {
      const taskId = addTask(uploadData.file, 'video', { 
        title: uploadData.title, 
        author: user.name, 
        authorId: user.id, 
        status: user.role === 'admin' ? 'published' : 'pending_review',
        productIds: uploadData.productIds,
        productDisplayMode: uploadData.productDisplayMode
      });
      toast({ title: "بدأ الرفع المباشر..." });
      return taskId;
    }
  };

  const handleChannelClick = async (id: string, name: string, avatar?: string) => {
    setActiveVideo(null);
    setActiveTab('home');
    setSearchResults([]);
    setSearchQuery("");
    setActiveChannel({ id, name, avatar });
    setIsChannelLoading(true);
    try {
      const { fetchChannelVideos } = await import("@/lib/youtube-feed-store");
      const vids = await fetchChannelVideos(id);
      // Enrich with avatar
      const enriched = vids.map(v => ({ ...v, channelAvatar: avatar }));
      setChannelVideos(enriched);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل تحميل محتوى القناة" });
    } finally {
      setIsChannelLoading(false);
    }
  };


  // Merge Platform Videos & Feed Videos for "Home"
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

    const isFakeThumb = (url?: string) => !url || url.includes('photo-1611162617474-5b21e879e113') || url.includes('picsum.photos');

    const platformVids = videos.filter(v => v.status === 'published').map(v => ({
      ...v,
      source: 'platform',
      thumbnail: isFakeThumb(v.thumbnail) ? null : v.thumbnail
    }));

    const feedVids = feedVideos.map(v => {
      const sub = subscriptions.find(s => s.channelId === v.authorId);
      return { 
        ...v, 
        externalUrl: v.url, 
        time: "حديثاً", 
        source: 'youtube',
        channelAvatar: v.channelAvatar || sub?.avatarUrl 
      };
    });

    const trendingVids = trendingVideos.map(v => {
      const sub = subscriptions.find(s => s.channelId === v.authorId);
      return { 
        ...v, 
        externalUrl: v.url, 
        time: "رائج", 
        source: 'youtube',
        channelAvatar: v.channelAvatar || sub?.avatarUrl 
      };
    });

    let combined = [...platformVids, ...feedVids, ...trendingVids];
    
    // Category Filter
    if (activeCategory === "تريند") return trendingVids;
    if (activeCategory !== "الكل") {
      combined = combined.filter(v => v.title.toLowerCase().includes(activeCategory.toLowerCase()) || (v as any).category === activeCategory);
    }

    // Shuffle and prioritize
    combined = combined.sort(() => Math.random() - 0.5); 

    combined.sort((a, b) => {
      const aHasThumb = a.source === 'youtube' || (a.thumbnail && !isFakeThumb(a.thumbnail));
      const bHasThumb = b.source === 'youtube' || (b.thumbnail && !isFakeThumb(b.thumbnail));
      if (aHasThumb && !bHasThumb) return -1;
      if (!aHasThumb && bHasThumb) return 1;
      return 0;
    });

    return combined;
  }, [videos, feedVideos, trendingVideos, searchResults, searchQuery, activeCategory]);

  // If a video is playing, replace the entire layout with Watch View
  if (activeVideo) {
    return (
      <div className="flex flex-col w-full h-full relative font-sans text-[#f1f1f1]">
        <WeTubeTopbar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen}
          onOpenVault={onOpenVault} user={user} onUpload={handleUpload}
          onLogoClick={() => setActiveVideo(null)}
        />
        <div className="flex flex-1 overflow-hidden mt-4 gap-0 relative">
          <WeTubeSidebar 
            isSidebarOpen={isSidebarOpen} 
            activeTab={activeTab} 
            variant="overlay"
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setActiveVideo(null);
            }} 
            subscriptions={subscriptions} 
          />
          
          <div className="flex-1 overflow-y-auto w-full glass rounded-3xl border border-white/5 relative">
            <WeTubeWatchView
              video={activeVideo as any}
              user={user}
              onClose={() => setActiveVideo(null)}
              relatedVideos={allHomeContent.filter(v => v.id !== activeVideo.id).slice(0, 15)}
              onSync={handleToggleLocal}
              onChannelClick={handleChannelClick}
              isCached={cachedAssets.some(a => a.id === `video-${activeVideo.id}`)}
            />
          </div>
        </div>
      </div>
    );
  }

  // If Shorts tab is active
  if (activeTab === 'shorts') {
    return (
      <div className="flex flex-col w-full h-full relative font-sans text-[#f1f1f1]">
        <WeTubeTopbar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen}
          onOpenVault={onOpenVault} user={user} onUpload={handleUpload}
        />
        <div className="flex flex-1 overflow-hidden mt-4 gap-4">
          <WeTubeSidebar isSidebarOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} subscriptions={subscriptions} />
          <div className="flex-1 glass rounded-3xl border border-white/5 overflow-hidden">
            <WeTubeShortsView shorts={allHomeContent.filter((v: any) => v.isShorts || v.type === 'short')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full relative font-sans text-[#f1f1f1]">
      <WeTubeTopbar
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen}
        onOpenVault={onOpenVault} user={user} onUpload={handleUpload}
        onSearch={handleSearch} onLogoClick={() => { setActiveVideo(null); setActiveChannel(null); }}
      />

      <div className="flex flex-1 overflow-hidden mt-4 gap-4 h-[calc(100vh-140px)]">
        <WeTubeSidebar 
          isSidebarOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} 
          subscriptions={subscriptions} onChannelClick={handleChannelClick} 
        />

        <main className="flex-1 overflow-y-auto w-full glass rounded-3xl border border-white/5 relative flex flex-col hide-scroll">
          {/* Categories & Search Filters Wrapper */}
          <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-md border-b border-white/10 flex flex-col shadow-lg">
            {/* Categories Filter (Chips) */}
            <div className="px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar rtl flex-row-reverse">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat
                      ? "bg-white text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Filters (Only if searching) */}
            {searchResults.length > 0 && searchQuery && (
              <div className="px-6 py-2 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar rtl flex-row-reverse bg-black/20">
                <span className="text-[10px] uppercase font-bold text-muted-foreground ml-2 whitespace-nowrap">الفلاتر:</span>
                {[
                  { label: "الكل", sp: "" },
                  { label: "آخر ساعة", sp: "EgIIAQ%3D%3D" },
                  { label: "اليوم", sp: "EgQIAhAB" },
                  { label: "هذا الأسبوع", sp: "EgQIAxAB" },
                  { label: "قنوات", sp: "EgIQAg%3D%3D" },
                  { label: "قوائم تشغيل", sp: "EgIQAw%3D%3D" },
                  { label: "أفلام", sp: "EgIQBA%3D%3D" },
                  { label: "قصير (<4د)", sp: "EgQYAXAB" },
                  { label: "طويل (>20د)", sp: "EgQYAnAB" },
                ].map(f => (
                  <button
                    key={f.label}
                    onClick={() => {
                        setSearchSp(f.sp);
                        handleSearch(searchQuery, f.sp);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                      searchSp === f.sp 
                        ? "bg-white text-black border-white shadow-lg" 
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 pb-24">
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10 rtl flex-row-reverse">
                {allHomeContent.map((v: any, i) => (
                  <VideoCard
                    key={`${v.id}-${i}`} video={v}
                    isCached={cachedAssets.some(a => a.id === `video-${v.id}`)}
                    currentUser={user} onClick={() => setActiveVideo(v)}
                    onSync={handleToggleLocal} onDelete={deleteVideo}
                    onChannelClick={handleChannelClick}
                  />
                ))}
              </div>
            )}

            {/* SUBSCRIPTIONS TAB */}
            {activeTab === 'subs' && (
              <div className="space-y-8 rtl flex-row-reverse text-right">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">الأحدث من اشتراكاتك</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="text-emerald-400 text-sm font-bold w-full sm:w-auto px-3 py-2 hover:bg-emerald-500/10 rounded-full transition-colors truncate">استيراد من يوتيوب</button>
                    <button onClick={() => setIsManageModalOpen(true)} className="text-blue-400 text-sm font-bold w-full sm:w-auto px-3 py-2 hover:bg-blue-500/10 rounded-full transition-colors truncate">إدارة الاشتراكات</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="text-blue-400 text-sm font-bold w-full sm:w-auto px-3 py-2 hover:bg-blue-500/10 rounded-full transition-colors truncate">إضافة قناة</button>
                  </div>
                </div>
                {activeChannel && (
                  <div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/10 pr-4 flex-row-reverse">
                    <div className="size-20 rounded-full bg-white/5 overflow-hidden border-2 border-white/10">
                      {activeChannel.avatar ? (
                        <img src={activeChannel.avatar} className="size-full object-cover" alt={activeChannel.name} />
                      ) : (
                        <div className="size-full flex items-center justify-center text-2xl font-bold opacity-30">{activeChannel.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex flex-col text-right">
                      <h2 className="text-3xl font-bold text-white mb-2">{activeChannel.name}</h2>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm flex-row-reverse">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-white">مشترك</span>
                        <span>{channelVideos.length} فيديو</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveChannel(null)}
                      className="mr-auto px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm"
                    >
                      إغلاق القناة
                    </button>
                  </div>
                )}

                {isChannelLoading || isFeedLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="size-10 animate-spin text-white/50 mb-4" />
                  </div>
                ) : feedVideos.length === 0 ? (
                  <div className="text-center py-20 opacity-50">
                    <History className="size-16 mx-auto mb-4" />
                    <p className="text-lg">لا يوجد محتوى جديد</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 rtl flex-row-reverse">
                    {feedVideos.map((v, i) => (
                      <VideoCard
                        key={`feed-${v.id}-${i}`} video={{ ...v, externalUrl: v.url, time: "اليوم" } as any}
                        isCached={cachedAssets.some(a => a.id === `video-${v.id}`)}
                        onSync={handleToggleLocal} onClick={() => setActiveVideo({ ...v, externalUrl: v.url, source: 'youtube' } as any)}
                        onChannelClick={handleChannelClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LIBRARY TAB */}
            {activeTab === 'library' && (
              <div className="space-y-12 rtl flex flex-col items-end text-right">
                <div className="w-full">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                    <History className="size-6 text-indigo-400" />
                    <h2 className="text-xl font-bold">المشاهدة لاحقاً والتنزيلات</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                    {cachedAssets.map((asset, i) => {
                      const vidId = asset.id.replace('video-', '');
                      const vid = allHomeContent.find(v => v.id === vidId) || { id: vidId, title: asset.title, author: 'Offline Video', status: 'published', source: 'offline' };
                      return (
                        <VideoCard
                          key={`saved-${asset.id}-${i}`} video={vid as any}
                          isCached={true} onSync={handleToggleLocal}
                          onClick={() => setActiveVideo(vid as any)}
                          onChannelClick={handleChannelClick}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                    <History className="size-6 text-blue-400" />
                    <h2 className="text-xl font-bold">سجل المشاهدة الأخير</h2>
                  </div>
                  {history.length === 0 ? (
                      <p className="text-center py-20 opacity-50 bg-white/5 rounded-3xl">لا يوجد سجل مشاهدة حالياً</p>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                       {history.map((h, i) => {
                           const sub = subscriptions.find(s => s.channelId === h.channelId);
                           const vid = { 
                               id: h.videoId, 
                               title: h.title, 
                               thumbnail: h.thumbnail, 
                               author: h.author, 
                               channelAvatar: h.channelAvatar || sub?.avatarUrl, 
                               source: 'youtube' as const, 
                               time: "شوهد مؤخراً" 
                           };
                           return (
                               <VideoCard
                                   key={`hist-${h.id}-${i}`} 
                                   video={vid as any}
                                   isCached={cachedAssets.some(a => a.id === `video-${h.videoId}`)} 
                                   onSync={handleToggleLocal}
                                   onChannelClick={handleChannelClick}
                                   onClick={() => setActiveVideo(vid as any)}
                               />
                           );
                       })}
                      </div>
                  )}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 rtl flex flex-col items-end text-right">
                <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                   <h2 className="text-xl font-bold">التنبيهات والمستجدات</h2>
                   <Bell className="size-6 text-yellow-400" />
                </div>
                {feedVideos.length === 0 ? (
                    <div className="w-full text-center py-20 opacity-50 bg-white/5 rounded-3xl">
                        <Bell className="size-12 mx-auto mb-4 opacity-20" />
                        <p>لا توجد تنبيهات جديدة من قنواتك</p>
                    </div>
                ) : (
                    <div className="w-full space-y-4">
                        {feedVideos.slice(0, 20).map((v, i) => (
                            <button 
                                key={`notif-${v.id}-${i}`}
                                onClick={() => setActiveVideo({ ...v, externalUrl: v.url, source: 'youtube' } as any)}
                                className="w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
                            >
                                <div className="size-16 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/5">
                                    <img src={v.thumbnail} className="size-full object-cover" />
                                </div>
                                <div className="flex-1 text-right">
                                    <p className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-indigo-400 transition-colors">{v.title}</p>
                                    <div className="flex items-center gap-2 justify-end text-[10px] text-muted-foreground">
                                        <span 
                                            className="hover:text-white transition-colors cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleChannelClick(v.authorId, v.author, v.channelAvatar);
                                            }}
                                        >
                                            • {v.author}
                                        </span>
                                        {v.channelAvatar && (
                                            <div 
                                                className="size-4 rounded-full overflow-hidden border border-white/10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleChannelClick(v.authorId, v.author, v.channelAvatar);
                                                }}
                                            >
                                                <img src={v.channelAvatar} className="size-full object-cover" />
                                            </div>
                                        )}
                                        <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">فيديو جديد</span>
                                    </div>
                                </div>
                                <div className="size-2 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            </button>
                        ))}
                    </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddChannelModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} userId={user?.id || ""} />
      <ManageChannelsModal isOpen={isManageModalOpen} onOpenChange={setIsManageModalOpen} subscriptions={subscriptions} userId={user?.id || ""} />
      <ImportSubscriptionsModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} userId={user?.id || ""} />
    </div>
  );
}
