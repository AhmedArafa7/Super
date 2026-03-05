"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Menu, Search, Mic, Bell, Video as VideoIcon,
  Home, Compass, PlaySquare, Clock, ThumbsUp,
  History, UserCircle, LogOut, Settings, HelpCircle,
  MoreVertical, X, Loader2, Sparkles, Flame, Music2, Gamepad2, Trophy
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, Video, deleteVideo } from "@/lib/video-store";
import { listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { VideoCard } from "./stream/video-card";
import { StreamUploadDialog } from "./stream/stream-upload-dialog";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";
import { WeTubeWatchView } from "./wetube/wetube-watch-view";
import { WeTubeShortsView } from "./wetube/wetube-shorts-view";

const CATEGORIES = [
  "الكل", "موسيقى", "ألعاب", "مباشر", "رياضة", "أخبار",
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

  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'subs' | 'library'>('home');
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

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
    const loadVideos = async () => {
      const data = await getStoredVideos();
      setVideos(data || []);
    };
    loadVideos();

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

  const handleToggleLocal = (video: any) => {
    const assetId = `video-${video.id}`;
    if (cachedAssets.some(a => a.id === assetId)) {
      removeAsset(assetId);
      toast({ title: "تم الإزالة", description: "تم حذف الفيديو من التنزيلات" });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: 45 });
      toast({ title: "جاري التنزيل", description: "سيتم حفظ الفيديو للمشاهدة بدون إنترنت" });
    }
  };

  // Merge Platform Videos & Feed Videos for "Home"
  const allHomeContent = useMemo(() => {
    const platformVids = videos.filter(v => v.status === 'published').map(v => ({ ...v, source: 'platform' }));
    const feedVids = feedVideos.map(v => ({ ...v, externalUrl: v.url, time: "حديثاً", source: 'youtube' }));
    return [...platformVids, ...feedVids].sort(() => Math.random() - 0.5); // Random shuffle for mix
  }, [videos, feedVideos]);

  // If a video is playing, replace the entire layout with Watch View
  if (activeVideo) {
    return (
      <div className="bg-[#0f0f0f] min-h-screen text-[#f1f1f1] w-full relative">
        <Topbar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen}
          onOpenVault={onOpenVault} user={user}
        />
        <WeTubeWatchView
          video={activeVideo as any}
          user={user}
          onClose={() => setActiveVideo(null)}
          relatedVideos={allHomeContent.filter(v => v.id !== activeVideo.id).slice(0, 15)}
          onSync={handleToggleLocal}
          isCached={cachedAssets.some(a => a.id === `video-${activeVideo.id}`)}
        />
      </div>
    );
  }

  // If Shorts tab is active
  if (activeTab === 'shorts') {
    return (
      <div className="bg-[#0f0f0f] min-h-screen text-[#f1f1f1] w-full overflow-hidden flex flex-col">
        <Topbar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen}
          onOpenVault={onOpenVault} user={user}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isSidebarOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} subscriptions={subscriptions} />
          <WeTubeShortsView shorts={allHomeContent.filter((v: any) => v.isShorts || v.type === 'short')} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f0f] min-h-screen text-[#f1f1f1] w-full flex flex-col font-sans">
      <Topbar
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen}
        onOpenVault={onOpenVault} user={user}
      />

      <div className="flex flex-1 overflow-hidden pt-14">
        <Sidebar isSidebarOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} subscriptions={subscriptions} />

        <main className={cn(
          "flex-1 overflow-y-auto w-full transition-all duration-300",
          isSidebarOpen ? "md:pl-60" : "md:pl-20"
        )}>
          {/* Categories Filter (Chips) */}
          <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm px-4 py-3 border-b border-white/10 flex items-center gap-3 overflow-x-auto no-scrollbar rtl flex-row-reverse shadow-md">
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
                    <button onClick={() => setIsManageModalOpen(true)} className="text-blue-400 text-sm font-bold px-3 py-2 hover:bg-blue-500/10 rounded-full transition-colors">إدارة الاشتراكات</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="text-blue-400 text-sm font-bold px-3 py-2 hover:bg-blue-500/10 rounded-full transition-colors">إضافة قناة</button>
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
    </div>
  );
}

// --- SUBCOMPONENTS FOR LAYOUT ---

function Topbar({
  isSidebarOpen, setIsSidebarOpen, searchQuery, setSearchQuery,
  isMobileSearchOpen, setIsMobileSearchOpen, onOpenVault, user
}: any) {
  return (
    <header className="fixed top-0 inset-x-0 h-14 bg-[#0f0f0f] z-50 flex items-center justify-between px-4 rtl flex-row-reverse">
      {/* Left (Logo & Menu) */}
      <div className="flex items-center gap-4 flex-row-reverse">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block">
          <Menu className="size-6 text-white" />
        </button>
        <div className="flex items-center gap-1 cursor-pointer select-none">
          <div className="bg-red-600 rounded-lg p-1.5 flex items-center justify-center">
            <PlaySquare className="size-4 text-white fill-white" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tighter text-white">WeTube</span>
          <span className="text-[10px] text-muted-foreground -mt-3 ml-1">EG</span>
        </div>
      </div>

      {/* Center (Search) */}
      {!isMobileSearchOpen && (
        <div className="hidden sm:flex items-center flex-1 max-w-[600px] ml-10 flex-row-reverse">
          <div className="flex flex-1 items-center bg-[#121212] border border-[#303030] rounded-r-full overflow-hidden focus-within:border-blue-500 focus-within:ml-0 transition-all flex-row-reverse">
            <div className="pl-4 pr-2 text-muted-foreground hidden group-focus-within:block"><Search className="size-4" /></div>
            <input
              type="text"
              placeholder="بحث"
              className="flex-1 bg-transparent border-none outline-none text-white px-4 py-2 h-10 w-full text-right placeholder:text-[#AAAAAA]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              dir="auto"
            />
          </div>
          <button className="bg-[#222222] border border-[#303030] border-r-0 rounded-l-full px-5 h-10 flex items-center justify-center hover:bg-[#303030] transition-colors">
            <Search className="size-5 text-white" />
          </button>
          <button className="bg-[#181818] hover:bg-[#303030] rounded-full p-2.5 ml-4 transition-colors">
            <Mic className="size-5 text-white" />
          </button>
        </div>
      )}

      {/* Right (Actions) */}
      <div className={cn("flex items-center gap-1 md:gap-3 flex-row-reverse", isMobileSearchOpen && "hidden")}>
        <button onClick={() => setIsMobileSearchOpen(true)} className="sm:hidden p-2 hover:bg-white/10 rounded-full">
          <Search className="size-6 text-white" />
        </button>
        <StreamUploadDialog onUpload={() => { }} onOpenVault={onOpenVault} trigger={
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
            <VideoIcon className="size-6 text-white" />
          </button>
        } />
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
          <Bell className="size-6 text-white" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-600 rounded-full border-2 border-[#0f0f0f]"></span>
        </button>
        <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden cursor-pointer ml-2">
          {user?.avatar_url ? <img src={user.avatar_url} className="size-full object-cover" alt="" /> : <UserCircle className="size-full text-white/50" />}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-[#0f0f0f] z-50 flex items-center px-4 gap-2 flex-row-reverse sm:hidden">
          <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
            <X className="size-6 text-white" />
          </button>
          <div className="flex flex-1 items-center bg-[#222222] rounded-full overflow-hidden flex-row-reverse h-10">
            <input
              type="text"
              placeholder="بحث في WeTube..."
              className="flex-1 bg-transparent border-none outline-none text-white px-4 h-full text-right"
              autoFocus
            />
          </div>
          <button className="bg-[#222222] rounded-full p-2">
            <Mic className="size-5 text-white" />
          </button>
        </div>
      )}
    </header>
  );
}

function Sidebar({ isSidebarOpen, activeTab, setActiveTab, subscriptions }: any) {
  const mainLinks = [
    { id: 'home', label: 'الصفحة الرئيسية', icon: Home },
    { id: 'shorts', label: 'Shorts', icon: Flame },
    { id: 'subs', label: 'الاشتراكات', icon: PlaySquare },
  ];
  const libraryLinks = [
    { id: 'library', label: 'المكتبة', icon: History },
    { id: 'history', label: 'سجل المشاهدة', icon: Clock },
    { id: 'liked', label: 'فيديوهات أعجبتني', icon: ThumbsUp },
  ];

  if (!isSidebarOpen) {
    return (
      <aside className="hidden md:flex w-20 flex-col items-center py-2 gap-6 bg-[#0f0f0f] border-l border-white/5 fixed left-0 top-14 bottom-0 rtl">
        {mainLinks.map(link => (
          <button
            key={link.id} onClick={() => setActiveTab(link.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full gap-1 p-2 rounded-xl transition-colors",
              activeTab === link.id ? "text-white" : "text-white/70 hover:bg-white/10"
            )}
          >
            <link.icon className={cn("size-6", activeTab === link.id && "fill-current")} />
            <span className="text-[10px] truncate max-w-full px-1">{link.label}</span>
          </button>
        ))}
        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            "flex flex-col items-center justify-center w-full gap-1 p-2 rounded-xl transition-colors",
            activeTab === 'library' ? "text-white" : "text-white/70 hover:bg-white/10"
          )}
        >
          <History className="size-6" />
          <span className="text-[10px]">المكتبة</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-60 flex-col py-3 bg-[#0f0f0f] border-l border-white/5 hover:overflow-y-auto no-scrollbar fixed left-0 top-14 bottom-0 rtl text-right">
      <div className="pb-3 px-3 border-b border-white/10 space-y-1">
        {mainLinks.map(link => (
          <button
            key={link.id} onClick={() => setActiveTab(link.id)}
            className={cn(
              "flex items-center gap-5 w-full p-2.5 px-3 rounded-xl transition-colors",
              activeTab === link.id ? "bg-white/10 text-white font-bold" : "text-white hover:bg-white/10"
            )}
          >
            <link.icon className={cn("size-6 shrink-0", activeTab === link.id ? "fill-current" : "")} />
            <span className="text-sm truncate">{link.label}</span>
          </button>
        ))}
      </div>

      <div className="py-3 px-3 border-b border-white/10 space-y-1">
        <h3 className="px-3 py-1 font-bold text-base flex items-center gap-2 mb-1">
          أنت <Compass className="size-4" />
        </h3>
        {libraryLinks.map(link => (
          <button
            key={link.id} onClick={() => setActiveTab(link.id === 'history' || link.id === 'liked' ? 'library' : link.id)}
            className={cn(
              "flex items-center gap-5 w-full p-2.5 px-3 rounded-xl transition-colors",
              activeTab === link.id ? "bg-white/10 text-white font-bold" : "text-white hover:bg-white/10"
            )}
          >
            <link.icon className="size-6 shrink-0" />
            <span className="text-sm truncate">{link.label}</span>
          </button>
        ))}
      </div>

      <div className="py-3 px-3 border-b border-white/10 space-y-1">
        <h3 className="px-3 py-2 font-bold text-base">الاشتراكات</h3>
        {subscriptions.length === 0 ? (
          <p className="px-4 py-2 text-xs text-white/50">لا توجد اشتراكات</p>
        ) : (
          subscriptions.map((sub: any) => (
            <button key={sub.id} onClick={() => setActiveTab('subs')} className="flex items-center gap-4 w-full p-2 px-3 rounded-xl hover:bg-white/10 transition-colors">
              <div className="size-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-white/5 overflow-hidden">
                {sub.channelAvatar ? <img src={sub.channelAvatar} className="size-full object-cover" /> : sub.channelTitle.charAt(0)}
              </div>
              <span className="text-sm truncate">{sub.channelTitle}</span>
              {sub.isFavorite && <span className="size-1.5 rounded-full bg-blue-500 mr-auto"></span>}
            </button>
          ))
        )}
      </div>

      <div className="py-3 px-3 space-y-1">
        <h3 className="px-3 py-2 font-bold text-base">استكشاف</h3>
        {[
          { icon: Flame, label: 'المحتوى الرائج' },
          { icon: Music2, label: 'موسيقى' },
          { icon: Gamepad2, label: 'ألعاب فيديو' },
          { icon: Trophy, label: 'رياضة' },
        ].map(cat => (
          <button key={cat.label} className="flex items-center gap-5 w-full p-2.5 px-3 rounded-xl hover:bg-white/10 transition-colors text-white">
            <cat.icon className="size-6 shrink-0" />
            <span className="text-sm truncate">{cat.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
