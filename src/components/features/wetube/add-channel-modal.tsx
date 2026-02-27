
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
      
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        const title = titleMatch[1].replace(' - YouTube', '').trim();
        setNewSubName(title);
      }

      const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) || 
                           html.match(/meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]+)"/) ||
                           html.match(/browse_id":"(UC[a-zA-Z0-9_-]+)"/);
      
      if (channelIdMatch) {
        setNewSubId(channelIdMatch[1]);
      }

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
    if (!userId || !newSubId) return;
    
    try {
      await addSubscription(userId, newSubUrl, newSubName || "قناة غير مسمى", newSubId, newSubAvatar);
      toast({ title: "تم الحفظ", description: "تمت إضافة القناة بنجاح." });
      setNewSubUrl("");
      setNewSubName("");
      setNewSubId("");
      setNewSubAvatar("");
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحفظ" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right outline-none">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-end gap-2 text-white text-2xl font-bold">
            إضافة قناة جديدة
            <Youtube className="text-red-500 size-6" />
          </DialogTitle>
          <DialogDescription className="text-right">أدخل رابط القناة وسنقوم بجلب بياناتها تلقائياً.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground pr-1">رابط القناة</Label>
            <Input 
              placeholder="https://youtube.com/@username" 
              className="bg-white/5 border-white/10 h-12 text-right"
              value={newSubUrl}
              onChange={e => {
                setNewSubUrl(e.target.value);
                if (e.target.value.length > 15) fetchMetadata(e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground pr-1">اسم القناة</Label>
            <div className="relative">
              <Input 
                dir="auto"
                placeholder={isFetching ? "جاري البحث..." : "اسم القناة يظهر هنا"}
                className="bg-white/5 border-white/10 h-12 text-right"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
              />
              {isFetching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />}
            </div>
          </div>

          {newSubAvatar && (
            <div className="flex items-center gap-4 justify-end p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-right">
                <p className="text-xs font-bold text-white">تم التعرف على القناة</p>
                <p className="text-[10px] text-muted-foreground font-mono">{newSubId.substring(0, 15)}...</p>
              </div>
              <div className="size-14 rounded-full overflow-hidden border-2 border-primary shadow-lg">
                <img src={newSubAvatar} className="size-full object-cover" alt="Avatar" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={!newSubId || isFetching} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 h-14 rounded-2xl font-bold text-lg"
          >
            تأكيد الحفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
