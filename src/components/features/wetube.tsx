"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { WeTubeWatchView } from "./wetube/wetube-watch-view";
import { WeTubeShortsView } from "./wetube/wetube-shorts-view";
import { WeTubeTopbar } from "./wetube/wetube-topbar";
import { WeTubeSidebar } from "./wetube/wetube-sidebar";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";
import { ImportSubscriptionsModal } from "./wetube/import-subscriptions-modal";

import { useWeTubeState } from "./wetube/use-wetube-state";
import { WeTubeHomeTab } from "./wetube/wetube-home-tab";
import { WeTubeSubsTab } from "./wetube/wetube-subs-tab";
import { WeTubeLibraryTab } from "./wetube/wetube-library-tab";
import { WeTubeNotificationsTab } from "./wetube/wetube-notifications-tab";
import { Video } from "@/lib/video-store";

/**
 * [STABILITY_ANCHOR: WETUBE_V2.5_REFACTORED]
 * واجهة المحتوى الترفيهي المطورة — تم تصميمها كلوحة تحجيم تستخدم (Higher-Order-Components).
 */
export function WeTube({ onOpenVault }: { onOpenVault?: () => void }) {
  const state = useWeTubeState();

  const renderContent = () => {
    if (state.activeTab === 'shorts') {
      return (
        <div className="h-full relative overflow-hidden animate-in fade-in duration-700">
           {state.isShortsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-10 text-primary animate-spin" />
            </div>
          ) : (
            <WeTubeShortsView shorts={state.shortsFeed.length > 0 ? state.shortsFeed : (state.allHomeContent as any).filter((v: any) => v.isShorts || v.type === 'short')} />
          )}
        </div>
      );
    }

    if (state.activeTab === 'home' || state.activeTab === 'explore') {
      return (
         <WeTubeHomeTab
           activeCategory={state.activeCategory} setActiveCategory={state.setActiveCategory}
           searchQuery={state.searchQuery} handleSearch={state.handleSearch}
           setSearchResults={state.setSearchResults} setSearchQuery={state.setSearchQuery}
           searchResults={state.searchResults} searchSp={state.searchSp} setSearchSp={state.setSearchSp}
           allHomeContent={state.allHomeContent} visibleCount={state.visibleCount} 
           observerTarget={state.observerTarget} cachedAssets={state.cachedAssets} 
           user={state.user} setActiveVideo={state.setActiveVideo as any} 
           handleToggleLocal={state.handleToggleLocal}
           handleChannelClick={state.handleChannelClick}
         />
      );
    }

    if (state.activeTab === 'subs') {
      return (
         <WeTubeSubsTab
           isChannelLoading={state.isChannelLoading} isFeedLoading={state.isFeedLoading}
           feedVideos={state.feedVideos} cachedAssets={state.cachedAssets}
           setActiveVideo={state.setActiveVideo as any} handleToggleLocal={state.handleToggleLocal}
           handleChannelClick={state.handleChannelClick}
           setIsImportModalOpen={state.setIsImportModalOpen} setIsManageModalOpen={state.setIsManageModalOpen}
           setIsAddModalOpen={state.setIsAddModalOpen}
         />
      );
    }

    if (state.activeTab === 'library') {
       return (
          <WeTubeLibraryTab
             cachedAssets={state.cachedAssets as any} history={state.history}
             allHomeContent={state.allHomeContent} setActiveVideo={state.setActiveVideo as any}
             handleToggleLocal={state.handleToggleLocal} handleChannelClick={state.handleChannelClick}
          />
       );
    }

    if (state.activeTab === 'notifications') {
       return (
          <WeTubeNotificationsTab
             feedVideos={state.feedVideos} lastSeenNotifications={state.lastSeenNotifications}
             setActiveVideo={state.setActiveVideo as any}
          />
       );
    }

    return null;
  };

  return (
    <div className="flex flex-col w-full h-full relative font-sans text-white bg-slate-950">
      <WeTubeTopbar
        isSidebarOpen={state.isSidebarOpen} setIsSidebarOpen={state.setIsSidebarOpen}
        searchQuery={state.searchQuery} setSearchQuery={state.setSearchQuery}
        isMobileSearchOpen={state.isMobileSearchOpen} setIsMobileSearchOpen={state.setIsMobileSearchOpen}
        onOpenVault={onOpenVault} user={state.user} onUpload={state.handleUpload}
        onSearch={state.handleSearch} onLogoClick={() => { state.setActiveVideo(null); state.setActiveChannel(null); }}
      />

      <div className="flex flex-1 overflow-hidden mt-4 gap-4 h-[calc(100vh-140px)]">
        <WeTubeSidebar
          isSidebarOpen={state.isSidebarOpen} activeTab={state.activeTab} setActiveTab={state.setActiveTab}
          subscriptions={state.subscriptions} onChannelClick={state.handleChannelClick}
        />

        <main className="flex-1 overflow-hidden">
          <div className="glass h-full flex flex-col overflow-hidden bg-slate-900/20 backdrop-blur-3xl border-none shadow-2xl rounded-[2.5rem] text-white">
            {state.activeVideo ? (
              <div className="h-full overflow-y-auto animate-in zoom-in-95 duration-500">
                <WeTubeWatchView
                  video={state.activeVideo as any}
                  user={state.user}
                  onClose={() => state.setActiveVideo(null)}
                  relatedVideos={state.allHomeContent.filter(v => v.id !== state.activeVideo?.id).slice(0, 15)}
                  onSync={state.handleToggleLocal as any}
                  onChannelClick={state.handleChannelClick}
                  isCached={state.cachedAssets.some(a => a.id === `video-${state.activeVideo?.id}`)}
                />
              </div>
            ) : renderContent()}
          </div>
        </main>
      </div>

      <AddChannelModal isOpen={state.isAddModalOpen} onOpenChange={state.setIsAddModalOpen} userId={state.user?.id || ""} />
      <ManageChannelsModal isOpen={state.isManageModalOpen} onOpenChange={state.setIsManageModalOpen} subscriptions={state.subscriptions} userId={state.user?.id || ""} />
      <ImportSubscriptionsModal isOpen={state.isImportModalOpen} onOpenChange={state.setIsImportModalOpen} userId={state.user?.id || ""} />
    </div>
  );
}
