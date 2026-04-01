"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, History, Bell, Sparkles, Home, PlaySquare, Library, BellRing, Compass, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, Video, deleteVideo } from "@/lib/video-store";
import { listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
import { searchYouTube, fetchTrending } from "@/lib/youtube-discovery-store";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useUploadStore } from "@/lib/upload-store";
import { useSettingsStore } from "@/lib/settings-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getHistory, HistoryItem } from "@/lib/history-store";
import { extractYouTubeId } from "@/lib/youtube-utils";

import { VideoCard } from "./stream/video-card";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";
import { ImportSubscriptionsModal } from "./wetube/import-subscriptions-modal";
import { WeTubeWatchView } from "./wetube/wetube-watch-view";
import { WeTubeShortsView } from "./wetube/wetube-shorts-view";
import { WeTubeTopbar } from "./wetube/wetube-topbar";
import { WeTubeSidebar } from "./wetube/wetube-sidebar";

import { FeatureHeader } from "@/components/ui/feature-header";
import { GlassCard } from "@/components/ui/glass-card";

interface ContentItem {
  id: string;
  title: string;
  source: 'youtube' | 'drive' | 'local' | 'offline' | 'platform';
  thumbnail?: string | null;
  author: string;
  authorId?: string;
  channelAvatar?: string | null;
  time?: string;
  isShorts?: boolean;
  hasMusic?: boolean;
  category?: string;
  fetchedAt?: number;
  url?: string;
  status?: string;
  visibility?: string;
  externalUrl?: string;
}

const CATEGORIES = [
  "الكل", "تريند", "موسيقى", "ألعاب", "مباشر", "رياضة", "أخبار",
  "بودكاست", "برمجة", "طبخ", "تكنولوجيا", "كوميديا", "اقتصاد"
];

/**
 * [STABILITY_ANCHOR: WETUBE_V2.0_MERGED]
 * واجهة المحتوى الترفيهي المطورة — Nexus V2
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
      setLastSeenNotifications(Number(localStorage.getItem('nexus_last_notifications') || 0));
    };
    loadInitialData();

    if (user?.id) {
      const unsubscribeSubs = listenToSubscriptions(user.id, (subs) => {
        setSubscriptions(subs);
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

  const loadTrending = async () => {
    try {
      const trending = await fetchTrending();
      setTrendingVideos(trending);
    } catch (e) { }
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
      setActiveChannel(null);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل البحث" });
    } finally {
      setIsSearching(false);
    }
  };

  const addTask = useUploadStore(state => state.addTask);

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

  const handleUpload = async (source: 'youtube' | 'drive' | 'local', uploadData: { title: string, externalUrl?: string, file?: File, productIds?: string[], productDisplayMode?: any }) => {
    if (!user) return null;
    if (source === 'youtube' || source === 'drive') {
      await import("@/lib/video-store").then(m => m.addVideo({
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        channelAvatar: user.avatar_url,
        thumbnail: "",
        time: source === 'youtube' ? "YouTube" : "Vault",
        status: user.role === 'admin' ? 'published' : 'pending_review',
        visibility: 'public',
        allowedUserIds: [],
        uploaderRole: user.role as any,
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
        channelAvatar: v.channelAvatar || sub?.avatarUrl || (v.authorId === user?.id ? user?.id === v.authorId ? user?.avatar_url : null : null)
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

  const renderContent = () => {
    if (activeTab === 'shorts') {
      return (
        <div className="h-full relative overflow-hidden animate-in fade-in duration-700">
           {isShortsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-10 text-primary animate-spin" />
            </div>
          ) : (
            <WeTubeShortsView shorts={shortsFeed.length > 0 ? shortsFeed : (allHomeContent as any).filter((v: any) => v.isShorts || v.type === 'short')} />
          )}
        </div>
      );
    }

    return (
       <div className="flex flex-col h-full animate-in fade-in duration-700">
          <div className="sticky top-0 z-10 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 py-3 px-6 shadow-2xl">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar rtl flex-row-reverse">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    if (cat === "الكل") { setSearchResults([]); setSearchQuery(""); }
                    else if (cat !== "تريند") { handleSearch(cat); }
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    activeCategory === cat
                      ? "bg-white text-slate-950 shadow-lg scale-105"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {searchResults.length > 0 && searchQuery && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar rtl flex-row-reverse">
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
                    onClick={() => { setSearchSp(f.sp); handleSearch(searchQuery, f.sp); }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap",
                      searchSp === f.sp
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 md:p-8 flex-1 overflow-y-auto no-scrollbar">
             {activeTab === 'home' || activeTab === 'explore' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-12">
                  {allHomeContent.map((v, i) => (
                    <VideoCard
                      key={`${v.id}-${i}`} video={v as Video}
                      isCached={cachedAssets.some(a => a.id === `video-${v.id}`)}
                      currentUser={user} onClick={() => setActiveVideo(v as Video)}
                      onSync={handleToggleLocal} onDelete={deleteVideo}
                      onChannelClick={handleChannelClick}
                    />
                  ))}
                </div>
             ) : activeTab === 'subs' ? (
                <div className="space-y-10 text-right">
                  <FeatureHeader 
                    title="اشتراكاتك النشطة"
                    description="أحدث الفيديوهات من القنوات التي تتابعها."
                    Icon={Sparkles}
                    action={
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setIsImportModalOpen(true)} className="text-emerald-400 font-bold rounded-full">استيراد</Button>
                        <Button variant="ghost" onClick={() => setIsManageModalOpen(true)} className="text-blue-400 font-bold rounded-full">إدارة</Button>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(true)} className="rounded-xl border-primary/20 text-primary">إضافة قناة</Button>
                      </div>
                    }
                  />
                  {(isChannelLoading || isFeedLoading) ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="size-10 animate-spin text-primary" /></div>
                  ) : feedVideos.length === 0 ? (
                    <div className="text-center py-32 opacity-30"><History className="size-16 mx-auto mb-4" /><p>لا يوجد محتوى جديد حالياً</p></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {feedVideos.map((v, i) => (
                        <VideoCard
                          key={`feed-${v.id}-${i}`} video={{ ...v, externalUrl: v.url, time: "اليوم" } as unknown as Video}
                          isCached={cachedAssets.some(a => a.id === `video-${v.id}`)}
                          onSync={handleToggleLocal} onClick={() => setActiveVideo({ ...v, externalUrl: v.url, source: 'youtube' } as unknown as Video)}
                          onChannelClick={handleChannelClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
             ) : activeTab === 'library' ? (
                <div className="space-y-12 text-right">
                   <section>
                      <FeatureHeader title="المكتبة الرقمية" description="الفيديوهات المحفوظة وسجل المشاهدة." Icon={Library} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {cachedAssets.map((asset, i) => {
                          const vidId = asset.id.replace('video-', '');
                          const vid = allHomeContent.find(v => v.id === vidId) || { id: vidId, title: asset.title, author: 'Offline Video', status: 'published', source: 'offline' };
                          return <VideoCard key={`saved-${asset.id}-${i}`} video={vid as Video} isCached={true} onSync={handleToggleLocal} onClick={() => setActiveVideo(vid as Video)} onChannelClick={handleChannelClick} />;
                        })}
                      </div>
                   </section>
                   <section>
                      <FeatureHeader title="سجل المشاهدة" Icon={History} titleClassName="text-xl" />
                      {history.length === 0 ? <GlassCard variant="flat" className="text-center py-10 opacity-40">السجل فارغ</GlassCard> : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {history.map((h, i) => (
                              <VideoCard key={`hist-${h.id}-${i}`} video={{ id: h.videoId, title: h.title, thumbnail: h.thumbnail || "", author: h.author, source: 'youtube', time: "شوهد مؤخراً" } as Video} isCached={cachedAssets.some(a => a.id === `video-${h.videoId}`)} onSync={handleToggleLocal} onChannelClick={handleChannelClick} onClick={() => setActiveVideo(h as unknown as Video)} />
                            ))}
                         </div>
                      )}
                   </section>
                </div>
             ) : activeTab === 'notifications' ? (
                <div className="space-y-8 text-right">
                   <FeatureHeader title="التنبيهات" Icon={BellRing} />
                   {feedVideos.length === 0 ? <GlassCard variant="flat" className="text-center py-20 opacity-30">لا توجد تنبيهات</GlassCard> : (
                      <div className="max-w-3xl ml-auto space-y-4">
                        {feedVideos.slice(0, 20).map((v, i) => (
                          <GlassCard key={`notif-${v.id}-${i}`} variant="hover" className="p-4 flex items-start gap-4 flex-row-reverse group cursor-pointer" onClick={() => setActiveVideo({ ...v, externalUrl: v.url, source: 'youtube' } as unknown as Video)}>
                             <div className="size-20 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                <img src={v.thumbnail} className="size-full object-cover" alt={v.title} />
                             </div>
                             <div className="flex-1 text-right">
                                <p className="font-bold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">{v.title}</p>
                                <p className="text-xs text-muted-foreground">• {v.author}</p>
                             </div>
                             {(v as ContentItem).fetchedAt && ((v as ContentItem).fetchedAt || 0) > lastSeenNotifications && <div className="size-2 rounded-full bg-primary shadow-lg shadow-primary/50 mt-2" />}
                          </GlassCard>
                        ))}
                      </div>
                   )}
                </div>
             ) : null}
          </div>
       </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full relative font-sans text-white bg-slate-950">
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

        <main className="flex-1 overflow-hidden">
          <GlassCard variant="borderless" noPadding className="h-full flex flex-col bg-slate-900/20 backdrop-blur-3xl border border-white/5 shadow-2xl">
            {activeVideo ? (
              <div className="h-full overflow-y-auto animate-in zoom-in-95 duration-500">
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
            ) : renderContent()}
          </GlassCard>
        </main>
      </div>

      <AddChannelModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} userId={user?.id || ""} />
      <ManageChannelsModal isOpen={isManageModalOpen} onOpenChange={setIsManageModalOpen} subscriptions={subscriptions} userId={user?.id || ""} />
      <ImportSubscriptionsModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} userId={user?.id || ""} />
    </div>
  );
}
