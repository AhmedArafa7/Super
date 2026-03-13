"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, History } from "lucide-react";
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

  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'subs' | 'library'>('home');
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Auto-sync logic (kept from original)
  const runAutoSync = useCallback(async (subs: YouTubeSubscription[], feed: FeedVideo[]) => {
    const favorites = subs.filter(s => s.isFavorite);
    if (favorites.length === 0) return;
    let syncCount = 0;
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
          syncCount++;
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
        syncFeed(subs);
      });
      return () => unsubscribeSubs();
    }
  }, [user?.id]);

  const syncFeed = async (subs: YouTubeSubscription[]) => {
    if (subs.length === 0) {
      setFeedVideos([]);
      return;
    }
    setIsFeedLoading(true);
    try {
      const feed = await fetchAllSubscriptionsFeed(subs.map(s => s.channelId));
      setFeedVideos(feed);
      runAutoSync(subs, feed);
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

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchQuery(q);
    try {
      const results = await searchYouTube(q);
      setSearchResults(results);
      setActiveTab('home');
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
      toast({ title: "تم إرسال الرابط للشبكة بنجاح", description: user.role === 'admin' ? "تم النشر." : "في انتظار المراجعة." });
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

  // Merge Platform Videos & Feed Videos for "Home"
  const allHomeContent = useMemo(() => {
    if (searchResults.length > 0 && searchQuery) return searchResults;

    const isFakeThumb = (url?: string) => !url || url.includes('photo-1611162617474-5b21e879e113') || url.includes('picsum.photos');

    const platformVids = videos.filter(v => v.status === 'published').map(v => ({
      ...v,
      source: 'platform',
      thumbnail: isFakeThumb(v.thumbnail) ? null : v.thumbnail
    }));

    const feedVids = feedVideos.map(v => ({ ...v, externalUrl: v.url, time: "حديثاً", source: 'youtube' }));
    const trendingVids = trendingVideos.map(v => ({ ...v, externalUrl: v.url, time: "رائج", source: 'youtube' }));

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
        <div className="flex flex-1 overflow-hidden mt-4 gap-4">
          <WeTubeSidebar 
            isSidebarOpen={isSidebarOpen} 
            activeTab={activeTab} 
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
        onSearch={handleSearch} onLogoClick={() => setActiveVideo(null)}
      />

      <div className="flex flex-1 overflow-hidden mt-4 gap-4 h-[calc(100vh-140px)]">
        <WeTubeSidebar isSidebarOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} subscriptions={subscriptions} />

        <main className="flex-1 overflow-y-auto w-full glass rounded-3xl border border-white/5 relative flex flex-col hide-scroll">
          {/* Categories Filter (Chips) */}
          <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-md px-6 py-3 border-b border-white/10 flex items-center gap-3 overflow-x-auto no-scrollbar rtl flex-row-reverse shadow-lg">
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
                {isFeedLoading ? (
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
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LIBRARY TAB */}
            {activeTab === 'library' && (
              <div className="space-y-8 rtl flex-row-reverse text-right">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                  <History className="size-6" />
                  <h2 className="text-xl font-bold">المشاهدة لاحقاً والتنزيلات</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 rtl flex-row-reverse">
                  {cachedAssets.map((asset, i) => {
                    const vidId = asset.id.replace('video-', '');
                    const vid = allHomeContent.find(v => v.id === vidId) || { id: vidId, title: asset.title, authorName: 'Offline Video', status: 'published', source: 'offline' };
                    return (
                      <VideoCard
                        key={`saved-${asset.id}-${i}`} video={vid as any}
                        isCached={true} onSync={handleToggleLocal}
                        onClick={() => setActiveVideo(vid as any)}
                      />
                    );
                  })}
                </div>
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
