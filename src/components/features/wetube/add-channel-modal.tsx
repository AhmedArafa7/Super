
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

/**
 * [STABILITY_ANCHOR: ADD_CHANNEL_V3.0]
 * نافذة إضافة القنوات - تم إصلاح زر الحفظ وضمان عمله فور استخراج البيانات.
 */
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
      // Append hl=en to try and bypass localized consent pages and get English metadata
      const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'hl=en&gl=US';
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(fetchUrl)}`);
      const html = await response.text();
      
      // Look for the canonical title first
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      let title = titleMatch ? titleMatch[1] : 'قناة غير معروفة';
      title = (title?.replace('- YouTube', '')?.trim() ?? 'قناة غير معروفة');
      const extractedTitle = title;
      
      // If we hit the consent page, the title will be "Before you continue to YouTube" or similar
      if (extractedTitle && !extractedTitle.toLowerCase().includes('before you continue')) {
        setNewSubName(extractedTitle);
      } else {
        // Try to get from meta tags if title is blocked
        const metaTitle = html.match(/<meta name="title" content="(.*?)">/) || 
                          html.match(/property="og:title" content="(.*?)">/);
        if (metaTitle && !metaTitle[1].toLowerCase().includes('before you continue')) {
          setNewSubName(metaTitle[1].replace(' - YouTube', '').trim());
        }
      }

      // Improved Channel ID extraction
      const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) || 
                           html.match(/meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]+)"/) ||
                           html.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
      
      if (channelIdMatch) {
        setNewSubId(channelIdMatch[1]);
      }

      // Improved Avatar extraction
      const avatarMatch = html.match(/"avatar":{"thumbnails":\[{"url":"(https:\/\/yt3\.ggpht\.com\/.*?)"/) ||
                          html.match(/property="og:image" content="(https:\/\/yt3\.ggpht\.com\/.*?)"/) ||
                          html.match(/"owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[{"url":"(https:\/\/yt3\.ggpht\.com\/.*?)"/);
      
      if (avatarMatch) {
        // Cleanup URL escaped characters
        setNewSubAvatar(avatarMatch[1].replace(/\\u0026/g, '&'));
      }

    } catch (e) {
      console.warn("Meta Fetch Error", e);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !newSubId) return;
    try {
      await addSubscription(userId, newSubUrl, newSubName || "قناة جديدة", newSubId, newSubAvatar);
      toast({ title: "تم الحفظ بنجاح", description: `أضيفت قناة ${newSubName} إلى اشتراكاتك.` });
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
          <DialogTitle className="text-right flex items-center justify-end gap-3 text-white">
            إضافة قناة جديدة
            <Youtube className="text-red-500" />
          </DialogTitle>
          <DialogDescription className="text-right">انسخ رابط القناة ليتم جلب بياناتها تلقائياً.</DialogDescription>
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
          
          {newSubAvatar && (
            <div className="flex justify-end pt-2">
              <div className="size-16 rounded-full border-2 border-indigo-500 overflow-hidden shadow-xl">
                <img src={newSubAvatar} className="size-full object-cover" alt="avatar" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={!newSubId || isFetching} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 h-12 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            {isFetching ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 size-4" />}
            تأكيد الحفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
