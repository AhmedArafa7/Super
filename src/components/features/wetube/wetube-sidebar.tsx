'use client';

import React from 'react';
import {
  Home, Compass, PlaySquare, Clock, ThumbsUp,
  History, Flame, Music2, Gamepad2, Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { YouTubeSubscription } from '@/lib/subscription-store';

interface WeTubeSidebarProps {
  isSidebarOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  subscriptions: YouTubeSubscription[];
}

const MAIN_LINKS = [
  { id: 'home', label: 'الصفحة الرئيسية', icon: Home },
  { id: 'shorts', label: 'Shorts', icon: Flame },
  { id: 'subs', label: 'الاشتراكات', icon: PlaySquare },
];

const LIBRARY_LINKS = [
  { id: 'library', label: 'المكتبة', icon: History },
  { id: 'history', label: 'سجل المشاهدة', icon: Clock },
  { id: 'liked', label: 'فيديوهات أعجبتني', icon: ThumbsUp },
];

const EXPLORE_LINKS = [
  { icon: Flame, label: 'المحتوى الرائج' },
  { icon: Music2, label: 'موسيقى' },
  { icon: Gamepad2, label: 'ألعاب فيديو' },
  { icon: Trophy, label: 'رياضة' },
];

export function WeTubeSidebar({ isSidebarOpen, activeTab, setActiveTab, subscriptions }: WeTubeSidebarProps) {
  if (!isSidebarOpen) {
    return (
      <aside className="hidden md:flex w-24 flex-col items-center py-4 gap-4 bg-black/20 backdrop-blur-md rounded-3xl border border-white/5 h-full rtl overflow-y-auto no-scrollbar shrink-0 pt-6">
        {MAIN_LINKS.map(link => (
          <button
            key={link.id} onClick={() => setActiveTab(link.id)}
            className={cn(
              "flex flex-col items-center justify-center w-20 gap-1.5 p-3 rounded-xl transition-all duration-300",
              activeTab === link.id ? "bg-white/10 text-white font-bold shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <link.icon className="size-6 shrink-0" />
            <span className="text-[10px] font-medium truncate max-w-full px-1">{link.label}</span>
          </button>
        ))}
        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            "flex flex-col items-center justify-center w-20 gap-1.5 p-3 rounded-xl transition-all duration-300",
            activeTab === 'library' ? "bg-white/10 text-white font-bold shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          <History className="size-6 shrink-0" />
          <span className="text-[10px] font-medium">المكتبة</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-64 flex-col py-3 bg-black/20 backdrop-blur-md rounded-3xl border border-white/5 h-full hover:overflow-y-auto no-scrollbar rtl text-right shrink-0">
      {/* Main Links */}
      <div className="pb-3 px-3 border-b border-white/10 space-y-0.5 mt-2">
        {MAIN_LINKS.map(link => (
          <button
            key={link.id} onClick={() => setActiveTab(link.id)}
            className={cn(
              "flex items-center gap-4 w-full p-2.5 px-3 rounded-lg transition-colors",
              activeTab === link.id ? "bg-white/10 text-white font-bold" : "text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
          >
            <link.icon className="size-5 shrink-0" />
            <span className="text-[15px] truncate">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Library */}
      <div className="py-3 px-3 border-b border-white/10 space-y-0.5">
        <h3 className="px-3 py-1.5 font-bold text-base flex items-center gap-2 mb-1 text-white">
          أنت <Compass className="size-4 shrink-0" />
        </h3>
        {LIBRARY_LINKS.map(link => (
          <button
            key={link.id} onClick={() => setActiveTab(link.id === 'history' || link.id === 'liked' ? 'library' : link.id)}
            className={cn(
              "flex items-center gap-4 w-full p-2.5 px-3 rounded-lg transition-colors",
              activeTab === link.id ? "bg-white/10 text-white font-bold" : "text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
          >
            <link.icon className="size-5 shrink-0" />
            <span className="text-[15px] truncate">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Subscriptions */}
      <div className="py-3 px-3 border-b border-white/10 space-y-0.5">
        <h3 className="px-3 py-2 font-bold text-base text-white">الاشتراكات</h3>
        {subscriptions.length === 0 ? (
          <p className="px-4 py-2 text-sm text-muted-foreground">لا توجد اشتراكات</p>
        ) : (
          subscriptions.map((sub: any) => (
            <button key={sub.id} onClick={() => setActiveTab('subs')} className="flex items-center gap-3 w-full p-2 px-3 rounded-lg hover:bg-white/10 transition-colors group">
              <div className="size-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-white/5 overflow-hidden">
                {sub.avatarUrl ? <img src={sub.avatarUrl} className="size-full object-cover" /> : (sub.channelName?.charAt(0) || "?")}
              </div>
              <span className="text-sm truncate text-muted-foreground group-hover:text-white">{sub.channelName || "قناة غير معروفة"}</span>
              {sub.isFavorite && <span className="size-1.5 rounded-full bg-blue-500 shrink-0 mr-auto"></span>}
            </button>
          ))
        )}
      </div>

      {/* Explore */}
      <div className="py-3 px-3 space-y-0.5">
        <h3 className="px-3 py-2 font-bold text-base text-white">استكشاف</h3>
        {EXPLORE_LINKS.map(cat => (
          <button key={cat.label} className="flex items-center gap-4 w-full p-2.5 px-3 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white">
            <cat.icon className="size-5 shrink-0" />
            <span className="text-[15px] truncate">{cat.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
