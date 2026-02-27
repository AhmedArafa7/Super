
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

/**
 * [STABILITY_ANCHOR: MANAGE_CHANNELS_V2.0]
 * واجهة إدارة الاشتراكات - إصلاح استجابة الحذف الفورية.
 */
export function ManageChannelsModal({ isOpen, onOpenChange, subscriptions, userId }: ManageChannelsModalProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUnsubscribe = async (subId: string, name: string) => {
    if (!userId || !subId) return;
    
    if (!confirm(`هل أنت متأكد من إلغاء المتابعة للقناة: "${name}"؟`)) return;
    
    setDeletingId(subId);
    try {
      await deleteSubscription(userId, subId);
      toast({ title: "تم إلغاء المتابعة", description: "تم تحديث قائمتك بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "حدث خطأ أثناء تنفيذ الطلب" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md outline-none shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-bold flex items-center justify-end gap-3 text-white">
            إدارة الاشتراكات
            <Settings className="size-6 text-indigo-400" />
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[450px] mt-8 pr-2">
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4">
                <XCircle className="size-14" />
                <p className="text-sm">قائمة الاشتراكات فارغة حالياً</p>
              </div>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex-row-reverse group animate-in slide-in-from-right-2">
                  <div className="flex items-center gap-4 flex-row-reverse overflow-hidden">
                    <div className="size-14 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-900 shadow-lg">
                      <img 
                        src={sub.avatarUrl || `https://picsum.photos/seed/${sub.channelId}/60/60`} 
                        className="size-full object-cover" 
                        alt={sub.channelName}
                      />
                    </div>
                    <div className="text-right overflow-hidden">
                      <h4 dir="auto" className="font-bold text-white truncate max-w-[160px]">{sub.channelName}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1 opacity-60">قناة مفعلة</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={deletingId === sub.id}
                    className="text-red-400 hover:text-white hover:bg-red-600/20 rounded-xl size-11 transition-colors"
                    onClick={() => handleUnsubscribe(sub.id, sub.channelName)}
                  >
                    {deletingId === sub.id ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
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
