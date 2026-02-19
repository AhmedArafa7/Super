
"use client";

import React, { useState } from "react";
import { Megaphone, Plus, Trash2, Edit3, Loader2, Zap, Globe, Link as LinkIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addAd, updateAd, deleteAd, Ad } from "@/lib/ads-store";
import { cn } from "@/lib/utils";

interface AdsManagementProps {
  ads: Ad[];
  onRefresh: () => void;
}

export function AdsManagement({ ads, onRefresh }: AdsManagementProps) {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    rewardAmount: 0,
    category: "promo" as any
  });

  const handleSave = async () => {
    if (!formData.title) return;
    setIsSubmitting(true);
    try {
      await addAd(formData);
      toast({ title: "تم نشر الإعلان", description: "اللوحة العصبية أصبحت نشطة الآن." });
      setIsAddModalOpen(false);
      setFormData({ title: "", description: "", imageUrl: "", linkUrl: "", rewardAmount: 0, category: "promo" });
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل النشر" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من مسح هذه اللوحة؟")) return;
    await deleteAd(id);
    toast({ title: "تم المسح" });
    onRefresh();
  };

  return (
    <div className="space-y-8 text-right">
      <div className="flex justify-between items-center flex-row-reverse">
        <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
          <Megaphone className="text-amber-400" /> إدارة اللوحات الإعلانية
        </h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 rounded-xl px-6 font-bold h-11"><Plus className="mr-2 size-4" /> إعلان جديد</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 sm:max-w-md text-right">
            <DialogHeader><DialogTitle className="text-right">إطلاق لوحة إعلانية</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>عنوان الإعلان</Label>
                <Input dir="auto" className="bg-white/5 border-white/10 text-right" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>الوصف</Label>
                <Textarea dir="auto" className="bg-white/5 border-white/10 text-right" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>رابط الصورة</Label>
                <Input className="bg-white/5 border-white/10 text-right" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>رابط التوجيه</Label>
                <Input className="bg-white/5 border-white/10 text-right" placeholder="https://..." value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>المكافأة (Credits)</Label>
                  <Input type="number" className="bg-white/5 border-white/10 text-center" value={formData.rewardAmount} onChange={e => setFormData({...formData, rewardAmount: Number(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <Label>الفئة</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white">
                      <SelectItem value="promo">ترويجي</SelectItem>
                      <SelectItem value="news">أخبار</SelectItem>
                      <SelectItem value="tutorial">تعليمي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isSubmitting} className="w-full bg-amber-600 rounded-xl">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap className="mr-2 size-4" />} تأكيد النشر
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ads.map((ad) => (
          <Card key={ad.id} className="p-6 glass border-white/5 rounded-3xl group relative overflow-hidden">
            <div className="flex justify-between items-start flex-row-reverse mb-4">
              <div className="text-right">
                <h4 className="font-bold text-white text-lg">{ad.title}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{ad.category}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="size-8 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(ad.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] text-muted-foreground uppercase font-black">التفاعلات</p>
                <p className="text-lg font-black text-indigo-400 flex items-center justify-center gap-1"><BarChart3 className="size-3" /> {ad.clicks}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] text-muted-foreground uppercase font-black">المكافأة</p>
                <p className="text-lg font-black text-amber-400">{ad.rewardAmount}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] text-muted-foreground uppercase font-black">الحالة</p>
                <p className="text-xs font-bold text-green-400 mt-1">{ad.status.toUpperCase()}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
