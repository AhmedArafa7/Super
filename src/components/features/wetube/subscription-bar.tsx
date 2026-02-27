
"use client";

import React from "react";
import { LayoutGrid, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { YouTubeSubscription } from "@/lib/subscription-store";

interface SubscriptionBarProps {
  subscriptions: YouTubeSubscription[];
  selectedChannelId: string | null;
  onSelectChannel: (id: string | null) => void;
  onOpenAddModal: () => void;
  onOpenManageModal: () => void;
}

export function SubscriptionBar({ 
  subscriptions, 
  selectedChannelId, 
  onSelectChannel, 
  onOpenAddModal, 
  onOpenManageModal 
}: SubscriptionBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl py-4 border-b border-white/5 -mx-8 px-8">
      <div className="flex items-center justify-between flex-row-reverse gap-6">
        <ScrollArea className="flex-1" dir="rtl">
          <div className="flex items-center gap-4 pb-4">
            <Button 
              variant={selectedChannelId === null ? 'default' : 'outline'}
              onClick={() => onSelectChannel(null)}
              className={cn(
                "rounded-2xl h-14 px-6 font-bold gap-2 shrink-0 transition-all",
                selectedChannelId === null ? "bg-indigo-600 shadow-lg shadow-indigo-600/20" : "border-white/10"
              )}
            >
              <LayoutGrid className="size-4" /> الكل
            </Button>
            
            {subscriptions.map(sub => (
              <button
                key={sub.id}
                onClick={() => onSelectChannel(selectedChannelId === sub.channelId ? null : sub.channelId)}
                className={cn(
                  "flex flex-col items-center gap-2 group shrink-0 px-2 transition-all",
                  selectedChannelId === sub.channelId ? "scale-110" : "opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "size-14 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden bg-slate-900 shadow-xl",
                  selectedChannelId === sub.channelId ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-white/10 group-hover:border-white/30"
                )}>
                  <img 
                    src={sub.avatarUrl || `https://picsum.photos/seed/${sub.channelId}/100/100`} 
                    className="size-full object-cover" 
                    alt={sub.channelName} 
                  />
                </div>
                <span className="text-[10px] font-bold text-white truncate max-w-[70px]">{sub.channelName}</span>
              </button>
            ))}

            <div className="flex items-center gap-2 shrink-0 pr-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onOpenAddModal}
                className="size-14 rounded-full border-dashed border-white/20 hover:bg-white/5 shadow-xl"
              >
                <Plus className="size-6 text-indigo-400" />
              </Button>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={onOpenManageModal}
                className="size-14 rounded-full border-white/10 hover:bg-white/5 shadow-xl"
              >
                <Settings className="size-6 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>
    </div>
  );
}
