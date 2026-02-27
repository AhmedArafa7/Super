
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
        setNewSubName(titleMatch[1].replace(' - YouTube', '').trim());
      }

      const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) || 
                           html.match(/meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]+)"/);
      
      if (channelIdMatch) setNewSubId(channelIdMatch[1]);

      const avatarMatch = html.match(/"avatar":{"thumbnails":\[{"url":"(https:\/\/yt3\.ggpht\.com\/.*?)"/);
      if (avatarMatch) setNewSubAvatar(avatarMatch[1]);

    } catch (e) {
      console.warn("Meta Fetch Error", e);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !newSubId) return;
    try {
      await addSubscription(userId, newSubUrl, newSubName || "قناة يوتيوب", newSubId, newSubAvatar);
      toast({ title: "تم الاشتراك بنجاح" });
      setNewSubUrl("");
      setNewSubName("");
      setNewSubId("");
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحفظ" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right outline-none">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-end gap-3 text-white">
            إضافة قناة متابعة
            <Youtube className="text-red-500" />
          </DialogTitle>
          <DialogDescription className="text-right">انسخ رابط القناة ليتم جلب الفيديوهات الأصلية.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground pr-1">رابط القناة</Label>
            <Input 
              placeholder="https://youtube.com/@channel" 
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
                className="bg-white/5 border-white/10 h-12 text-right"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
              />
              {isFetching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!newSubId || isFetching} className="w-full bg-indigo-600 hover:bg-indigo-500 h-12 rounded-xl font-bold">
            تأكيد الحفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
