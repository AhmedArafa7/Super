
"use client";

import React, { useState } from "react";
import { Trash2, Settings, Loader2, XCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSubscription, toggleFavoriteSubscription, YouTubeSubscription } from "@/lib/subscription-store";
import { cn } from "@/lib/utils";

interface ManageChannelsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: YouTubeSubscription[];
  userId: string;
}

export function ManageChannelsModal({ isOpen, onOpenChange, subscriptions, userId }: ManageChannelsModalProps) {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUnsubscribe = async (subId: string) => {
    if (!userId || !subId) return;
    const confirmed = window.confirm("هل أنت متأكد من إلغاء متابعة هذه القناة؟");
    if (!confirmed) return;

    setProcessingId(subId);
    try {
      await deleteSubscription(userId, subId);
      toast({ title: "تمت إزالة القناة" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحذف" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFavorite = async (sub: YouTubeSubscription) => {
    setProcessingId(sub.id);
    try {
      await toggleFavoriteSubscription(userId, sub.id, sub.isFavorite);
      toast({ 
        title: sub.isFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة",
        description: !sub.isFavorite ? "سيتم تحميل فيديوهات هذه القناة تلقائياً فور نزولها." : "تم إيقاف التحميل التلقائي لهذه القناة."
      });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التحديث" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md outline-none">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold flex items-center justify-end gap-3 text-white">
            إدارة اشتراكاتي
            <Settings className="size-5 text-indigo-400" />
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] mt-6">
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="py-10 text-center opacity-30 flex flex-col items-center gap-3">
                <XCircle className="size-10" />
                <p className="text-sm font-bold">لا توجد قنوات متابعة حالياً</p>
              </div>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl flex-row-reverse hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 flex-row-reverse text-right">
                    <div className="size-10 rounded-full overflow-hidden border border-white/10 shadow-inner shrink-0">
                      <img src={sub.avatarUrl || `https://picsum.photos/seed/${sub.channelId}/40/40`} className="size-full object-cover" alt="avatar" />
                    </div>
                    <div className="min-w-0">
                      <h4 dir="auto" className="font-bold text-white text-sm truncate max-w-[120px]">{sub.channelName}</h4>
                      <div className="flex items-center gap-1 justify-end">
                        {sub.isFavorite && <span className="text-[7px] text-amber-400 font-bold uppercase">قناة مفضلة</span>}
                        <p className="text-[8px] text-muted-foreground uppercase font-mono">YouTube</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={processingId === sub.id}
                      className={cn("rounded-xl transition-all", sub.isFavorite ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground")}
                      onClick={() => handleToggleFavorite(sub)}
                    >
                      <Star className={cn("size-4", sub.isFavorite && "fill-current")} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={processingId === sub.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                      onClick={() => handleUnsubscribe(sub.id)}
                    >
                      {processingId === sub.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
