
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

  const handleUnsubscribe = async (subId: string, name: string) => {
    if (!userId || !subId) return;
    
    if (!confirm(`هل تريد بالتأكيد إلغاء متابعة قناة "${name}"؟`)) return;
    
    setDeletingId(subId);
    try {
      await deleteSubscription(userId, subId);
      toast({ title: "تم إلغاء المتابعة", description: `تمت إزالة ${name} من قائمتك.` });
    } catch (e) {
      console.error("Unsubscribe Error:", e);
      toast({ variant: "destructive", title: "حدث خطأ أثناء الإلغاء" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md outline-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-bold flex items-center justify-end gap-2 text-white">
            إدارة اشتراكاتي
            <Settings className="size-5 text-indigo-400" />
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[450px] mt-6">
          <div className="space-y-3 pr-2">
            {subscriptions.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4">
                <XCircle className="size-12" />
                <p>قائمة الاشتراكات فارغة.</p>
              </div>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex-row-reverse group">
                  <div className="flex items-center gap-4 flex-row-reverse overflow-hidden">
                    <div className="size-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-900">
                      <img 
                        src={sub.avatarUrl || `https://picsum.photos/seed/${sub.channelId}/40/40`} 
                        className="size-full object-cover" 
                        alt={sub.channelName}
                      />
                    </div>
                    <div className="text-right overflow-hidden">
                      <h4 dir="auto" className="font-bold text-white truncate max-w-[150px]">{sub.channelName}</h4>
                      <p className="text-[8px] text-muted-foreground uppercase font-mono mt-0.5 tracking-tighter">قناة مفعلة</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={deletingId === sub.id}
                    className="text-red-400 hover:text-white hover:bg-red-600/20 rounded-xl size-10"
                    onClick={() => handleUnsubscribe(sub.id, sub.channelName)}
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
