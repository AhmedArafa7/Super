
"use client";

import React, { useState } from "react";
import { Plus, Zap, Loader2, ImageIcon, Globe, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addAd } from "@/lib/ads-store";
import { uploadMarketImage } from "@/lib/market/upload";
import Image from "next/image";

interface AdSubmissionFormProps {
  user: any;
  onSuccess: () => void;
}

/**
 * [STABILITY_ANCHOR: AD_SUBMISSION_NODE_V1]
 * مكون مستقل لتقديم طلبات الإعلانات من قبل المستخدمين.
 */
export function AdSubmissionForm({ user, onSuccess }: AdSubmissionFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [thumbnailOptions, setThumbnailOptions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    linkUrl: "",
    category: "promo" as any,
    rewardAmount: 0
  });

  const handleLinkInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, linkUrl: url });
    
    // Check if YouTube URL to extract thumbnails
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(ytRegex);
    if (match && match[1]) {
      const videoId = match[1];
      setThumbnailOptions([
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      ]);
    } else {
      setThumbnailOptions([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadMarketImage(file);
      setImageUrls(prev => [...prev, url]);
      toast({ title: "تم رفع الصورة بنجاح" });
    } catch (err) {
      toast({ variant: "destructive", title: "فشل الرفع", description: "تعذر رفع الصورة، تأكد من اتصالك." });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleImageSelection = (url: string) => {
    setImageUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleSubmit = async () => {
    if (!formData.title || imageUrls.length === 0) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى ملء الحقول الأساسية واختيار صورة واحدة على الأقل." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addAd({
        ...formData,
        imageUrls,
        authorId: user.id,
        authorName: user.name
      }, user.role === 'admin');

      toast({ 
        title: "تم إرسال الطلب العصبي", 
        description: "طلبك قيد المراجعة الآن من قبل مسؤولي النخاع." 
      });
      
      setIsOpen(false);
      setFormData({ title: "", description: "", linkUrl: "", category: "promo", rewardAmount: 0 });
      setImageUrls([]);
      setThumbnailOptions([]);
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل الإرسال", description: "تعذر ربط طلبك بالسجل العالمي." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-500 text-white rounded-2xl px-8 h-14 shadow-xl shadow-amber-600/20 font-bold text-base gap-3">
          <Megaphone className="size-5" /> تقديم طلب إعلاني
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
        <DialogHeader>
          <DialogTitle className="text-3xl font-headline font-bold text-white">إطلاق لوحة إعلانية</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">سيتم مراجعة طلبك من قبل الإدارة قبل ظهوره لبقية العقد في النظام.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-6">
          <div className="grid gap-2">
            <Label>عنوان اللوحة</Label>
            <Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" placeholder="مثال: خدمة برمجة ذكية..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid gap-2">
            <Label>الوصف التفصيلي</Label>
            <Textarea dir="auto" className="bg-white/5 border-white/10 text-right min-h-[100px]" placeholder="اشرح ما تقدمه في هذه اللوحة..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label>رابط التوجيه (أو رابط يوتيوب لاستخراج الصور)</Label>
            <Input className="bg-white/5 border-white/10 text-right h-11" placeholder="https://..." value={formData.linkUrl} onChange={handleLinkInput} />
          </div>

          {(thumbnailOptions.length > 0 || imageUrls.length > 0) && (
            <div className="grid gap-2 border border-white/5 bg-white/5 p-4 rounded-xl">
              <Label className="text-amber-400">الصور المحددة ({imageUrls.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {thumbnailOptions.length > 0 && thumbnailOptions.map((thumb, idx) => (
                  <div 
                    key={`thumb-${idx}`} 
                    onClick={() => toggleImageSelection(thumb)}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${imageUrls.includes(thumb) ? 'border-primary scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <Image src={thumb} alt="YouTube Thumbnail" fill className="object-cover" unoptimized />
                  </div>
                ))}
                {imageUrls.filter(url => !thumbnailOptions.includes(url)).map((url, idx) => (
                  <div 
                    key={`up-${idx}`} 
                    onClick={() => toggleImageSelection(url)}
                    className="relative w-24 h-16 rounded-lg overflow-hidden cursor-pointer border-2 border-primary scale-105 transition-all"
                  >
                    <Image src={url} alt="Uploaded Image" fill className="object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-right">اضغط على الصورة لتحديدها أو إلغاء تحديدها. إذا حددت أكثر من صورة، سيتم التبديل بينها عند عرض الإعلان.</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label>أو رفع صورة من جهازك</Label>
            <div className="flex items-center gap-4 flex-row-reverse">
              <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="bg-white/5 border-white/10 text-right h-11" />
              {isUploading && <Loader2 className="animate-spin text-primary size-5" />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div className="grid gap-2">
              <Label>الفئة التقنية</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="promo">عرض ترويجي</SelectItem>
                  <SelectItem value="news">تحديث تقني</SelectItem>
                  <SelectItem value="tutorial">درس تعليمي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>المكافأة المقترحة (للمشاهد)</Label>
              <Input type="number" className="bg-white/5 border-white/10 text-center h-11" value={formData.rewardAmount} onChange={e => setFormData({...formData, rewardAmount: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-amber-600 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-amber-600/20">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2 size-5" />} 
            إرسال للمراجعة الإدارية
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
