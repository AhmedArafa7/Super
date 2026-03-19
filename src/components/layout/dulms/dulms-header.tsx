'use client';

import React from 'react';
import { Bell, Wallet, ChevronDown, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/auth/types';

interface DulmsHeaderProps {
  user: User | null;
  isDark: boolean;
  hasAdminAccess: boolean;
  unreadCount: number;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
  onTabChange: (tab: any) => void;
  onExitDulms: () => void;
}

export function DulmsHeader({
  user, isDark, hasAdminAccess, unreadCount,
  showDropdown, setShowDropdown, onTabChange, onExitDulms
}: DulmsHeaderProps) {
  return (
    <header className={cn(
      "h-[50px] w-full flex items-center justify-between px-4 shrink-0 transition-colors z-20 shadow-sm",
      isDark ? "bg-[#151822] border-b border-white/5" : "bg-[#34495e] text-white"
    )}>
      <div className="flex items-center gap-2">
        <div className="flex flex-col select-none">
          <span className="text-[#f1c40f] font-black text-xl leading-none tracking-wide">DULMS</span>
          <span className={cn("text-[8px] uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-300")}>
            NexusAI — Theme Edition
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5 mr-2">
        {/* Notifications */}
        <button onClick={() => onTabChange('notifications')} className="relative">
          <Bell className={cn("size-4", isDark ? "text-slate-400" : "text-white/80")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 size-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Wallet */}
        <button onClick={() => onTabChange('wallet')} className="relative">
          <Wallet className={cn("size-4", isDark ? "text-slate-400" : "text-white/80")} />
        </button>

        {/* User Dropdown */}
        <div className="relative pl-4 border-l border-white/20">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="size-8 rounded-full border border-white/30 overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="User" className="size-full object-cover" />
              ) : (
                <span className="text-white text-xs">{user?.name?.charAt(0) || "U"}</span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-sm font-medium">{user?.name || 'مستخدم'}</span>
              <ChevronDown className="size-3 opacity-70" />
            </div>
          </button>

          {showDropdown && (
            <div className={cn(
              "absolute top-full right-0 mt-2 w-52 rounded-md shadow-lg py-1 border z-50",
              isDark ? "bg-[#1e2130] border-white/10" : "bg-white border-slate-200"
            )}>
              <button
                onClick={() => { onTabChange('dashboard'); setShowDropdown(false); }}
                className={cn(
                  "w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 flex-row-reverse transition-colors",
                  isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Settings className="size-4" />
                الإعدادات
              </button>
              {hasAdminAccess && (
                <button
                  onClick={() => { onTabChange('admin'); setShowDropdown(false); }}
                  className={cn(
                    "w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 flex-row-reverse transition-colors",
                    isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <ShieldCheck className="size-4" />
                  لوحة الإدارة
                </button>
              )}
              <div className={cn("h-px my-1", isDark ? "bg-white/5" : "bg-slate-200")} />
              <button
                onClick={onExitDulms}
                className={cn(
                  "w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 flex-row-reverse transition-colors",
                  isDark ? "text-amber-400 hover:bg-white/5" : "text-amber-600 hover:bg-slate-50"
                )}
              >
                <LogOut className="size-4" />
                العودة إلى Nexus
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
