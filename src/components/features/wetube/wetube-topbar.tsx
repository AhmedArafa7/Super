'use client';

import React from 'react';
import {
  Menu, Search, Mic, Bell, Video as VideoIcon,
  PlaySquare, UserCircle, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreamUploadDialog } from '../stream/stream-upload-dialog';

interface WeTubeTopbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isMobileSearchOpen: boolean;
  setIsMobileSearchOpen: (v: boolean) => void;
  onOpenVault?: () => void;
  user: any;
  onUpload: (source: any, data: any) => Promise<string | null>;
  onSearch?: (q: string) => void;
}

export function WeTubeTopbar({
  isSidebarOpen, setIsSidebarOpen,
  searchQuery, setSearchQuery,
  isMobileSearchOpen, setIsMobileSearchOpen,
  onOpenVault, user, onUpload, onSearch
}: WeTubeTopbarProps) {
  return (
    <header className="sticky top-0 inset-x-0 h-16 w-full glass rounded-[2rem] border border-white/10 z-40 flex items-center justify-between px-6 rtl flex-row-reverse mx-auto my-2 shrink-0">
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
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.(searchQuery)}
              dir="auto"
            />
          </div>
          <button 
            onClick={() => onSearch?.(searchQuery)}
            className="bg-[#222222] border border-[#303030] border-r-0 rounded-l-full px-5 h-10 flex items-center justify-center hover:bg-[#303030] transition-colors"
          >
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
        <StreamUploadDialog onUpload={onUpload} onOpenVault={onOpenVault} trigger={
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
        <div className="absolute inset-x-0 top-16 bg-black/95 backdrop-blur-xl z-50 flex items-center px-4 gap-2 flex-row-reverse sm:hidden rounded-2xl border border-white/10 p-2 shadow-2xl">
          <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
            <X className="size-6 text-white" />
          </button>
          <div className="flex flex-1 items-center bg-[#222222] rounded-full overflow-hidden flex-row-reverse h-10">
            <input
              type="text"
              placeholder="بحث في WeTube..."
              className="flex-1 bg-transparent border-none outline-none text-white px-4 h-full text-right"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.(searchQuery)}
            />
          </div>
          <button className="bg-[#222222] rounded-full p-2" onClick={() => onSearch?.(searchQuery)}>
            <Search className="size-5 text-white" />
          </button>
        </div>
      )}
    </header>
  );
}
