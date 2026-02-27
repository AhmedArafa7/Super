
"use client";

import React from "react";
import { Trash2, Settings } from "lucide-react";
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
    if (!userId || !subId) return;
    
    if (!confirm("هل تريد بالتأكيد إلغاء متابعة هذه القناة؟")) return;
    
    try {
      await deleteSubscription(userId, subId);
      toast({ title: "تم إلغاء المتابعة", description: "تمت إزالة القناة من قائمة اشتراكاتك." });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل في تنفيذ العملية" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md outline-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-bold flex items-center justify-end gap-2 text-white">
            إدارة الاشتراكات
            <Settings className="size-5 text-indigo-400" />
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] mt-6">
          <div className="space-y-3 pr-2">
            {subscriptions.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4">
                <Trash2 className="size-10" />
                <p>قائمة الاشتراكات فارغة حالياً.</p>
              </div>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex-row-reverse group">
                  <div className="flex items-center gap-4 flex-row-reverse overflow-hidden">
                    <div className="size-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-900 group-hover:border-indigo-500/50 transition-colors">
                      <img 
                        src={sub.avatarUrl || `https://picsum.photos/seed/${sub.channelId}/40/40`} 
                        className="size-full object-cover" 
                        alt={sub.channelName}
                      />
                    </div>
                    <div className="text-right overflow-hidden">
                      <h4 dir="auto" className="font-bold text-white truncate max-w-[150px]">{sub.channelName}</h4>
                      <p className="text-[8px] text-muted-foreground uppercase font-mono mt-0.5 tracking-tighter">ID: {sub.channelId?.substring(0, 12)}...</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:text-white hover:bg-red-600/20 rounded-xl size-10 transition-all"
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
