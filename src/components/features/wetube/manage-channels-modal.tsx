
"use client";

import React, { useState } from "react";
import { Trash2, Settings, Loader2, XCircle, Star, Video, PlayCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { deleteSubscription, updateSubscriptionSettings, YouTubeSubscription, AutoSyncType } from "@/lib/subscription-store";
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

  const handleSyncTypeChange = async (subId: string, type: AutoSyncType) => {
    setProcessingId(subId);
    try {
      await updateSubscriptionSettings(userId, subId, { autoSyncType: type });
      toast({ title: "تم تحديث نمط المزامنة", description: "سيقوم النظام باتباع القواعد الجديدة فوراً." });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل تحديث الإعدادات" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFavorite = async (sub: YouTubeSubscription) => {
    setProcessingId(sub.id);
    try {
      await updateSubscriptionSettings(userId, sub.id, { isFavorite: !sub.isFavorite });
      toast({ 
        title: sub.isFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة",
        description: !sub.isFavorite ? "سيتم تحميل الفيديوهات المختارة تلقائياً." : "تم إيقاف المزامنة التلقائية لهذه القناة."
      });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التحديث" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-xl outline-none">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold flex items-center justify-end gap-3 text-white">
            إدارة قنواتي واشتراكاتي
            <Settings className="size-5 text-indigo-400" />
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[500px] mt-6">
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
                <XCircle className="size-10" />
                <p className="text-sm font-bold">لا توجد قنوات متابعة حالياً</p>
              </div>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="p-5 bg-white/5 border border-white/5 rounded-3xl flex flex-col gap-4 group hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <div className="size-12 rounded-full overflow-hidden border border-white/10 shadow-inner shrink-0">
                        <img src={sub.avatarUrl || `https://picsum.photos/seed/${sub.channelId}/40/40`} className="size-full object-cover" alt="avatar" />
                      </div>
                      <div className="min-w-0">
                        <h4 dir="auto" className="font-bold text-white text-base truncate max-w-[180px]">{sub.channelName}</h4>
                        <div className="flex items-center gap-1 justify-end">
                          <p className="text-[8px] text-muted-foreground uppercase font-mono tracking-widest">YouTube Verified</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={processingId === sub.id}
                        className={cn("rounded-xl transition-all h-10 w-10", sub.isFavorite ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground")}
                        onClick={() => handleToggleFavorite(sub)}
                      >
                        <Star className={cn("size-5", sub.isFavorite && "fill-current")} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={processingId === sub.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-10 w-10"
                        onClick={() => handleUnsubscribe(sub.id)}
                      >
                        {processingId === sub.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-5" />}
                      </Button>
                    </div>
                  </div>

                  {sub.isFavorite && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5 items-center">
                      <div className="text-right">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2 px-1">المزامنة التلقائية لـ</label>
                        <Select 
                          value={sub.autoSyncType || 'all'} 
                          onValueChange={(v: AutoSyncType) => handleSyncTypeChange(sub.id, v)}
                          disabled={processingId === sub.id}
                        >
                          <SelectTrigger className="bg-black/40 border-white/5 h-10 flex-row-reverse rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="all" className="flex-row-reverse gap-2">
                              <Layers className="size-3 inline ml-2" /> كل الفيديوهات
                            </SelectItem>
                            <SelectItem value="long" className="flex-row-reverse gap-2">
                              <Video className="size-3 inline ml-2" /> الفيديوهات الطويلة فقط
                            </SelectItem>
                            <SelectItem value="shorts" className="flex-row-reverse gap-2">
                              <PlayCircle className="size-3 inline ml-2" /> فيديوهات القصيرة (Shorts)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="hidden md:flex flex-col gap-1 text-right">
                        <span className="text-[10px] font-bold text-white">وضع الاستحواذ نشط</span>
                        <p className="text-[9px] text-muted-foreground leading-relaxed">سيتم حفظ الفيديوهات المختارة في الذاكرة المحلية فور توفرها.</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
