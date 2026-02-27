
"use client";

import React, { useState } from "react";
import { Trash2, Settings, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSubscription, YouTubeSubscription } from "@/lib/subscription-store";

interface ManageChannelsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: YouTubeSubscription[];
  userId: string;
}

export function ManageChannelsModal({ isOpen, onOpenChange, subscriptions, userId }: ManageChannelsModalProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUnsubscribe = async (subId: string) => {
    if (!userId || !subId) return;
    setDeletingId(subId);
    try {
      await deleteSubscription(userId, subId);
      toast({ title: "تم إلغاء المتابعة بنجاح" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحذف" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md outline-none">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold flex items-center justify-end gap-3 text-white">
            إدارة الاشتراكات
            <Settings className="size-5 text-indigo-400" />
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] mt-6">
          <div className="space-y-2">
            {subscriptions.length === 0 ? (
              <p className="text-center py-10 opacity-30 italic">لا توجد اشتراكات حالية</p>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl flex-row-reverse">
                  <div className="text-right">
                    <h4 dir="auto" className="font-bold text-white text-sm">{sub.channelName}</h4>
                    <p className="text-[8px] text-muted-foreground uppercase font-mono">ID: {sub.channelId?.substring(0, 10)}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={deletingId === sub.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                    onClick={() => handleUnsubscribe(sub.id)}
                  >
                    {deletingId === sub.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
