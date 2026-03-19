
"use client";

import React from "react";
import { Bell, Search, Wallet } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function AppHeader({ unreadCount, onTabChange, onNavigateToWallet }: any) {
  return (
    <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-20 flex-row-reverse shrink-0">
      <div className="flex items-center gap-4 flex-row-reverse">
        <SidebarTrigger className="md:hidden" />
        <div className="relative hidden md:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="البحث في نكسوس..." className="w-64 pr-9 h-9 bg-white/5 border-white/10 rounded-lg text-sm text-right" />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-row-reverse">
        <Button variant="ghost" size="icon" className="text-muted-foreground relative" onClick={() => onTabChange("notifications")}>
          <Bell className="size-5" />
          {unreadCount > 0 && <Badge className="absolute top-2 left-2 h-4 w-4 p-0 flex items-center justify-center bg-red-500 border border-slate-900 text-[9px]">{unreadCount}</Badge>}
        </Button>
        <div className="h-8 w-px bg-white/10" />
        <Button variant="outline" className="h-9 px-4 rounded-xl border-white/10 gap-2 text-xs font-bold text-white hover:bg-white/5 flex-row-reverse" onClick={onNavigateToWallet}>
          <Wallet className="size-4 text-primary" /> رصيد المحفظة
        </Button>
      </div>
    </header>
  );
}
