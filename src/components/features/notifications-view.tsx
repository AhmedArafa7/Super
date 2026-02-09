"use client";

import React, { useEffect, useState } from "react";
import { Bell, ArrowRight, History, Edit3, MessageCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStoredMessages, WizardMessage } from "@/lib/chat-store";
import { formatDistanceToNow } from "date-fns";

interface NotificationsViewProps {
  onViewInChat: (messageId: string) => void;
}

export function NotificationsView({ onViewInChat }: NotificationsViewProps) {
  const [editedMessages, setEditedMessages] = useState<WizardMessage[]>([]);

  useEffect(() => {
    const load = () => {
      const all = getStoredMessages();
      const edited = all.filter(m => m.isEdited).sort((a, b) => 
        new Date(b.editedAt || b.timestamp).getTime() - new Date(a.editedAt || a.timestamp).getTime()
      );
      setEditedMessages(edited);
    };
    load();
    window.addEventListener('storage-update', load);
    return () => window.removeEventListener('storage-update', load);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <Bell className="text-indigo-400" />
            Neural Updates
          </h2>
          <p className="text-muted-foreground mt-2">Historical log of corrected transmissions and neural adjustments.</p>
        </div>
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 px-4 py-1">
          {editedMessages.length} Corrections
        </Badge>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-4 pb-10">
          {editedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl opacity-50 border-dashed border-2">
              <History className="size-12 mb-4" />
              <p className="text-lg">No neural corrections recorded yet.</p>
            </div>
          ) : (
            editedMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="group p-6 glass border-white/5 hover:border-indigo-500/30 rounded-[2rem] transition-all duration-300 shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Edit3 className="size-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white uppercase text-xs tracking-widest">Correction Issued</h3>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <Clock className="size-3" />
                        {msg.editedAt ? formatDistanceToNow(new Date(msg.editedAt), { addSuffix: true }) : 'Recently'}
                      </div>
                    </div>
                  </div>
                  {msg.hasUnreadUpdate && (
                    <Badge className="bg-indigo-500 animate-pulse">NEW UPDATE</Badge>
                  )}
                </div>

                <div className="bg-black/20 rounded-2xl p-4 mb-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="size-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Adjustment Note</span>
                  </div>
                  <p className="text-sm text-indigo-100/80 italic line-clamp-2">
                    "{msg.editReason}"
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2 uppercase font-bold tracking-widest">Modified Signal Content</p>
                  <p className="text-sm text-white/70 line-clamp-3 bg-white/5 p-4 rounded-xl italic">
                    {msg.response}
                  </p>
                </div>

                <Button 
                  onClick={() => onViewInChat(msg.id)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all group-hover:scale-[1.01]"
                >
                  Jump to Transmission
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}