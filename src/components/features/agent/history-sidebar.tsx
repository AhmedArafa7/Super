'use client';

import React, { useEffect, useState } from "react";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  History, 
  Clock, 
  MoreVertical,
  ChevronLeft,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentStore } from "@/lib/agent-store";
import { 
  getAgentConversationsSnapshot, 
  deleteAgentConversation,
  createAgentConversation 
} from "@/lib/agent-history-service";
import { useAuth } from "@/components/auth/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * [STABILITY_ANCHOR: HISTORY_SIDEBAR_V1.0]
 * شريط الجانبي لتاريخ المحادثات - يتيح إدارة الجلسات البرمجية.
 */

export function HistorySidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    conversations, 
    setConversations, 
    activeConversationId, 
    setActiveConversationId,
    linkedRepo,
    setLinkedRepo
  } = useAgentStore();
  
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const unsub = getAgentConversationsSnapshot(user.id, (convs) => {
      setConversations(convs);
    });
    return () => unsub();
  }, [user?.id, setConversations]);

  const handleCreateNew = async () => {
    if (!user?.id) return;
    try {
      const newConv = await createAgentConversation(user.id, "محادثة برمجية جديدة", linkedRepo);
      setActiveConversationId(newConv.id);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الإنشاء", description: "تعذر بدء محادثة جديدة." });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await deleteAgentConversation(user.id, id);
      if (activeConversationId === id) setActiveConversationId(null);
      toast({ title: "تم الحذف", description: "تم مسح المحادثة من الأرشيف." });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحذف" });
    }
  };

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-72 h-full flex flex-col bg-slate-950/40 border-r border-white/5 animate-in slide-in-from-right duration-500">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <History className="size-5" />
            <h3 className="font-bold text-lg text-white">الأرشيف العصبي</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCreateNew}
            className="size-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Plus className="size-5" />
          </Button>
        </div>

        <div className="relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="بحث في التاريخ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-3 h-10 text-xs text-white focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 pb-6">
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-4 opacity-20">
              <MessageSquare className="size-12 mx-auto" />
              <p className="text-xs font-bold">لا توجد محادثات سابقة</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div 
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    if (conv.linkedRepo) {
                      setLinkedRepo(conv.linkedRepo);
                    }
                  }}
                  className={cn(
                    "group relative p-4 rounded-2xl cursor-pointer transition-all border",
                    isActive 
                      ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5" 
                      : "bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 text-right pr-2">
                      <p className={cn(
                        "text-sm font-bold truncate transition-colors",
                        isActive ? "text-primary" : "text-slate-200 group-hover:text-white"
                      )}>
                        {conv.title || "بدون عنوان"}
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-slate-500">
                        <span>{conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ar }) : "الآن"}</span>
                        <Clock className="size-3" />
                      </div>
                    </div>
                  </div>

                  {/* Delete Button (Visible on Hover) */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-lg opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
