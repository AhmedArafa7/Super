'use client';

import React from 'react';
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/auth/types';
import { NavItemId } from '@/lib/sidebar-store';

interface NavGroupItem {
  id: NavItemId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavGroupItem[];
}

interface DulmsSidebarProps {
  user: User | null;
  isDark: boolean;
  hasAdminAccess: boolean;
  activeTab: NavItemId;
  expandedGroup: string | null;
  setExpandedGroup: (group: string | null) => void;
  onTabChange: (tab: NavItemId) => void;
  getBadge: (id: NavItemId) => number | undefined;
  navGroups: NavGroup[];
}

export function DulmsSidebar({
  user, isDark, hasAdminAccess, activeTab,
  expandedGroup, setExpandedGroup, onTabChange, getBadge, navGroups
}: DulmsSidebarProps) {
  return (
    <aside className={cn(
      "w-[240px] flex flex-col shrink-0 overflow-y-auto overflow-x-hidden transition-colors border-r",
      isDark ? "bg-[#151822] border-white/5" : "bg-[#34495e] border-transparent shadow-[2px_0_5px_rgba(0,0,0,0.1)] text-white"
    )}>
      {/* User info strip */}
      <div className="p-3 bg-[#2ecc71] text-white flex items-center gap-3 flex-row-reverse">
        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs font-bold">{user?.name?.charAt(0)}</span>
          )}
        </div>
        <div className="flex flex-col text-right min-w-0">
          <span className="text-sm font-bold truncate">{user?.name || 'مستخدم'}</span>
          <span className="text-[10px] opacity-90 truncate">@{user?.username}</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex flex-col w-full py-1">
        {navGroups.map(group => {
          const isExpanded = expandedGroup === group.label;
          const hasActiveItem = group.items.some(item => item.id === activeTab);

          return (
            <div key={group.label} className="flex flex-col w-full">
              {/* Group Header */}
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors border-b",
                  hasActiveItem
                    ? (isDark ? "bg-[#c088b6] text-white" : "bg-[#c582b4] text-white")
                    : (isDark ? "border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200" : "border-white/5 text-white/80 hover:bg-white/10")
                )}
              >
                <span className="text-right flex-1">{group.label}</span>
                <ChevronDown className={cn("size-3 transition-transform", isExpanded ? "rotate-0" : "-rotate-90")} />
              </button>

              {/* Group Items */}
              {isExpanded && (
                <div className={cn(
                  "flex flex-col w-full py-0.5",
                  isDark ? "bg-[#0b0d14]" : "bg-[#2c3e50]"
                )}>
                  {group.items.map(item => {
                    const badge = getBadge(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-5 py-2.5 text-xs transition-colors flex-row-reverse",
                          activeTab === item.id
                            ? (isDark ? "bg-[#22273b] text-white font-bold border-l-2 border-slate-400" : "bg-[#1a252f] text-white font-bold border-l-2 border-white/50")
                            : (isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5")
                        )}
                      >
                        <item.icon className="size-4 opacity-70" />
                        <span className="flex-1 text-right">{item.label}</span>
                        {badge !== undefined && (
                          <span className="size-5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                            {badge}
                          </span>
                        )}
                        {!badge && <ChevronRight className="size-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin Panel */}
        {hasAdminAccess && (
          <button
            onClick={() => onTabChange('admin')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-xs transition-colors border-t flex-row-reverse",
              activeTab === 'admin'
                ? (isDark ? "bg-amber-500/20 text-amber-300 font-bold" : "bg-amber-500/20 text-amber-100 font-bold")
                : (isDark ? "border-white/5 text-slate-400 hover:bg-white/5" : "border-white/5 text-white/70 hover:bg-white/10")
            )}
          >
            <ShieldCheck className="size-4" />
            <span className="flex-1 text-right font-bold">لوحة الإدارة</span>
          </button>
        )}
      </div>
    </aside>
  );
}
