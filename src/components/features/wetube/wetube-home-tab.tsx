"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoCard } from "../stream/video-card";
import { Video } from "@/lib/video-store";
import { ContentItem, CATEGORIES } from "./wetube-types";

interface WeTubeHomeTabProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  handleSearch: (q: string, sp?: string) => void;
  setSearchResults: (res: any[]) => void;
  setSearchQuery: (q: string) => void;
  searchResults: any[];
  searchSp: string;
  setSearchSp: (sp: string) => void;
  allHomeContent: ContentItem[];
  visibleCount: number;
  observerTarget: React.RefObject<HTMLDivElement | null>;
  cachedAssets: { id: string }[];
  user: any;
  setActiveVideo: (v: Video) => void;
  handleToggleLocal: (v: any) => void;
  handleChannelClick: (id: string, name: string, avatar?: string) => void;
  deleteVideo?: (id: string) => void;
}

export function WeTubeHomeTab({
  activeCategory, setActiveCategory,
  searchQuery, handleSearch, setSearchResults, setSearchQuery,
  searchResults, searchSp, setSearchSp,
  allHomeContent, visibleCount, observerTarget,
  cachedAssets, user, setActiveVideo, handleToggleLocal,
  handleChannelClick, deleteVideo
}: WeTubeHomeTabProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-700">
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

      <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-12">
          {allHomeContent.slice(0, visibleCount).map((v, i) => (
            <VideoCard
              key={`${v.id}-${i}`} video={v as Video}
              isCached={cachedAssets.some(a => a.id === `video-${v.id}`)}
              currentUser={user} onClick={() => setActiveVideo(v as Video)}
              onSync={handleToggleLocal} onDelete={deleteVideo} // Not actually imported from store here directly, maybe pass it?
              onChannelClick={handleChannelClick}
            />
          ))}
        </div>
        {/* عنصر المراقبة للتمرير اللانهائي */}
        <div ref={observerTarget} className="h-20 w-full flex items-center justify-center mt-10">
          {visibleCount < allHomeContent.length && (
            <Loader2 className="size-8 text-primary animate-spin opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
}
