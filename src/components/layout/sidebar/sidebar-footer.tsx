'use client';

import React from "react";
import { SidebarFooter as ShadcnSidebarFooter } from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, 
  DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { UserCircle, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "./nav-items";
import { useSidebarLayout } from "./use-sidebar-layout";

interface SidebarFooterProps {
  user: User | null;
  logout: () => void;
  onTabChange: (id: string) => void;
}

export function SidebarFooter({ user, logout, onTabChange }: SidebarFooterProps) {
  const { isCollapsed, flexDir, textDir } = useSidebarLayout();

  return (
    <ShadcnSidebarFooter className="p-3 mt-auto border-t border-white/5">
      <div className={cn(
        "flex items-center gap-3",
        flexDir,
        isCollapsed ? "justify-center" : "px-2"
      )}>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <div className="size-9 rounded-xl bg-indigo-900/50 border border-white/10 overflow-hidden cursor-pointer relative shrink-0 group/avatar">
              <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/40/40`} className="size-full object-cover group-hover/avatar:scale-110 transition-transform" alt="User" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64 bg-slate-900/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-[1.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <DropdownMenuLabel className="text-right px-2 py-4">
              <div className="flex items-center gap-3 mb-4 px-2 flex-row-reverse">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 border border-white/5">
                  <UserCircle className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{user?.name || 'مستخدم'}</p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">عضو نظام Si-Neuro</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10 mx-2" />
            <div className="p-1">
              <DropdownMenuItem onClick={() => onTabChange("dashboard")} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all text-right flex-row-reverse group">
                <LayoutDashboard className="size-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="flex-1 font-bold text-xs text-white/80 group-hover:text-white">لوحة التحكم المركزية</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("settings")} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all text-right flex-row-reverse group">
                <Settings className="size-4 text-muted-foreground group-hover:rotate-45 transition-transform" />
                <span className="flex-1 font-bold text-xs text-white/80 group-hover:text-white">إعدادات الحساب</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-white/10 mx-2" />
            <div className="p-1">
              <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-red-500/10 text-red-400 rounded-xl transition-all text-right flex-row-reverse group">
                <LogOut className="size-4 group-hover:-translate-x-1 transition-transform" />
                <span className="flex-1 font-black text-xs uppercase tracking-widest">تسجيل الخروج الآمن</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isCollapsed && (
          <div className={cn(
            "flex-1 min-w-0 animate-in fade-in slide-in-from-right-1 cursor-default",
            textDir
          )}>
            <p className="text-xs font-bold truncate text-white">{user?.name || 'مستخدم'}</p>
            <p className="text-[9px] text-muted-foreground truncate capitalize">عضو مفعل</p>
          </div>
        )}
      </div>
    </ShadcnSidebarFooter>
  );
}
