
"use client";

import React from "react";
import { Trash2 } from "lucide-react";
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

  const handleUnsubscribe = async (subId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في إلغاء الاشتراك وفك الارتباط؟")) return;
    try {
      await deleteSubscription(userId, subId);
      toast({ title: "تم إلغاء الاشتراك بنجاح" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل في العملية" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md outline-none">
        <DialogHeader>
          <DialogTitle className="text-right">إدارة القنوات المشترك بها</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] mt-4">
          <div className="space-y-3 pr-2">
            {subscriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-10 italic">لا توجد اشتراكات حالية.</p>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse overflow-hidden">
                    <div className="size-10 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-900 shadow-inner">
                      <img src={sub.avatarUrl || `https://picsum.photos/seed/${sub.id}/40/40`} className="size-full object-cover" />
                    </div>
                    <div className="text-right overflow-hidden">
                      <h4 dir="auto" className="font-bold text-white truncate max-w-[150px]">{sub.channelName}</h4>
                      <p className="text-[8px] text-muted-foreground uppercase font-mono mt-0.5">ID: {sub.channelId?.substring(0, 10)}...</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:bg-red-500/10 rounded-xl size-10"
                    onClick={() => handleUnsubscribe(sub.id)}
                  >
                    <Trash2 className="size-4" />
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
