
"use client";

import React, { useState } from "react";
import { Loader2, Youtube, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addSubscription } from "@/lib/subscription-store";

interface AddChannelModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

/**
 * [STABILITY_ANCHOR: ADD_CHANNEL_MODAL_V2.0]
 * واجهة إضافة القنوات - تحسين دقة استخراج المعرفات والصور لضمان تجربة برودكشن.
 */
export function AddChannelModal({ isOpen, onOpenChange, userId }: AddChannelModalProps) {
  const { toast } = useToast();
  const [newSubUrl, setNewSubUrl] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubId, setNewSubId] = useState("");
  const [newSubAvatar, setNewSubAvatar] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const fetchMetadata = async (url: string) => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
    setIsFetching(true);
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      const html = await response.text();
      
      // 1. استخراج العنوان من التاجات الرسمية
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        const title = titleMatch[1].replace(' - YouTube', '').trim();
        setNewSubName(title);
      }

      // 2. استخراج معرف القناة بدقة عالية (UC...)
      const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) || 
                           html.match(/meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]+)"/) ||
                           html.match(/browse_id":"(UC[a-zA-Z0-9_-]+)"/);
      
      if (channelIdMatch) {
        setNewSubId(channelIdMatch[1]);
      } else {
        // محاولة استخراج المعرف من روابط الـ RSS في الهيدر
        const rssMatch = html.match(/href="https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]+)"/);
        if (rssMatch) setNewSubId(rssMatch[1]);
      }

      // 3. استخراج الصورة الحقيقية للبروفايل
      const avatarMatch = html.match(/"avatar":{"thumbnails":\[{"url":"(https:\/\/yt3\.ggpht\.com\/.*?)"/) ||
                         html.match(/<meta property="og:image" content="(.*?)"/);
      if (avatarMatch) setNewSubAvatar(avatarMatch[1]);

    } catch (e) {
      console.warn("خطأ في جلب بيانات القناة", e);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !newSubId) {
      toast({ variant: "destructive", title: "بيانات القناة غير مكتملة" });
      return;
    }
    
    try {
      await addSubscription(userId, newSubUrl, newSubName || "قناة غير مسمى", newSubId, newSubAvatar);
      toast({ title: "تم الاشتراك بنجاح", description: `تمت إضافة ${newSubName} لقائمتك.` });
      setNewSubUrl("");
      setNewSubName("");
      setNewSubId("");
      setNewSubAvatar("");
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل حفظ الاشتراك" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right outline-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-end gap-3 text-white text-2xl font-bold">
            إضافة قناة متابعة
            <Youtube className="text-red-500 size-7" />
          </DialogTitle>
          <DialogDescription className="text-right">انسخ رابط القناة هنا وسيقوم النظام بربط الفيديوهات الأصلية.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground pr-1">رابط القناة (URL)</Label>
            <Input 
              placeholder="https://youtube.com/@channel_name" 
              className="bg-white/5 border-white/10 h-12 text-right focus-visible:ring-indigo-500"
              value={newSubUrl}
              onChange={e => {
                setNewSubUrl(e.target.value);
                if (e.target.value.length > 15) fetchMetadata(e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground pr-1">الاسم المستخرج</Label>
            <div className="relative">
              <Input 
                dir="auto"
                placeholder={isFetching ? "جاري البحث في خوادم يوتيوب..." : "سيظهر اسم القناة تلقائياً"}
                className="bg-white/5 border-white/10 h-12 text-right"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
              />
              {isFetching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />}
            </div>
          </div>

          {newSubAvatar && (
            <div className="flex items-center gap-4 justify-end p-5 bg-white/5 rounded-[1.5rem] border border-white/5 animate-in zoom-in-95">
              <div className="text-right">
                <p className="text-sm font-bold text-white">قناة موثقة</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">ID: {newSubId.substring(0, 12)}...</p>
              </div>
              <div className="size-16 rounded-full overflow-hidden border-2 border-primary shadow-2xl">
                <img src={newSubAvatar} className="size-full object-cover" alt="Channel Avatar" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={!newSubId || isFetching} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20"
          >
            تأكيد الاشتراك
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
