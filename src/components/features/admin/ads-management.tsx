
"use client";

import React, { useState } from "react";
import { Megaphone, Plus, Trash2, Edit3, Loader2, Zap, Globe, CheckCircle2, XCircle, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { addAd, updateAdStatus, deleteAd, Ad } from "@/lib/ads-store";
import { cn } from "@/lib/utils";

interface AdsManagementProps {
  ads: Ad[];
  onRefresh: () => void;
}

/**
 * [STABILITY_ANCHOR: ADS_MANAGEMENT_NODE_V1.1]
 * تحصين مكون الإعلانات ضد أخطاء المصفوفات الفارغة.
 */
export function AdsManagement({ ads = [], onRefresh }: AdsManagementProps) {
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
      await addAd({
        title: formData.title,
        description: formData.description,
        linkUrl: formData.linkUrl,
        rewardAmount: formData.rewardAmount,
        category: formData.category,
        imageUrls: formData.imageUrl ? [formData.imageUrl] : [],
        authorId: "admin",
        authorName: "System Admin"
      }, true);
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

  const handleStatusUpdate = async (id: string, status: any) => {
    await updateAdStatus(id, status);
    toast({ title: status === 'active' ? "تم التفعيل" : "تم الرفض" });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من مسح هذه اللوحة؟")) return;
    await deleteAd(id);
    toast({ title: "تم المسح نهائياً" });
    onRefresh();
  };

  // ضمان أن ads هي مصفوفة دائماً قبل إجراء الفلترة
  const safeAds = Array.isArray(ads) ? ads : [];
  const pendingAds = safeAds.filter(a => a.status === 'pending_review');
  const activeAds = safeAds.filter(a => a.status === 'active');

  return (
    <div className="space-y-8 text-right">
      <div className="flex justify-between items-center flex-row-reverse">
        <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
          <Megaphone className="text-amber-400" /> إدارة النظام الإعلاني
        </h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 rounded-xl px-6 font-bold h-11"><Plus className="mr-2 size-4" /> إعلان إداري مباشر</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
            <DialogHeader><DialogTitle className="text-right">إطلاق لوحة إعلانية سيادية</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="العنوان" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <Textarea dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="الوصف" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <Input className="bg-white/5 border-white/10 text-right" placeholder="رابط الصورة" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              <Input className="bg-white/5 border-white/10 text-right" placeholder="رابط التوجيه" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} />
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isSubmitting} className="w-full bg-amber-600">تأكيد النشر</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-white/5 border-white/10 p-1 flex-row-reverse mb-6">
          <TabsTrigger value="pending" className="rounded-lg gap-2 flex-row-reverse">
            الطلبات المعلقة 
            {pendingAds.length > 0 && <Badge className="bg-red-500 text-[10px] h-4 w-4 p-0 flex items-center justify-center">{pendingAds.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">اللوحات النشطة</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingAds.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-3xl">لا توجد طلبات جديدة</div>
          ) : (
            pendingAds.map(ad => (
              <Card key={ad.id} className="p-6 glass border-amber-500/20 rounded-3xl space-y-4">
                <div className="flex justify-between items-start flex-row-reverse">
                  <div className="text-right">
                    <h4 className="font-bold text-white">{ad.title}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase">بواسطة: @{ad.authorName}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-400 border-amber-400/20"><Clock className="size-3 mr-1" /> قيد المراجعة</Badge>
                </div>
                <p className="text-xs text-slate-400 text-right line-clamp-2 italic">"{ad.description}"</p>
                <div className="flex gap-2 pt-4 border-t border-white/5 flex-row-reverse">
                  <Button className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl h-10 font-bold text-xs" onClick={() => handleStatusUpdate(ad.id, 'active')}>
                    <CheckCircle2 className="size-4 mr-2" /> اعتماد النشر
                  </Button>
                  <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl h-10 px-4" onClick={() => handleStatusUpdate(ad.id, 'rejected')}>
                    <XCircle className="size-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeAds.map(ad => (
            <Card key={ad.id} className="p-6 glass border-white/5 rounded-3xl group relative overflow-hidden">
              <div className="flex justify-between items-start flex-row-reverse mb-4">
                <div className="text-right">
                  <h4 className="font-bold text-white text-lg">{ad.title}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase">الناشر: @{ad.authorName}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(ad.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <div className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-muted-foreground uppercase font-black">النقرات</p>
                  <p className="text-sm font-black text-indigo-400">{ad.clicks}</p>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-muted-foreground uppercase font-black">المكافأة</p>
                  <p className="text-sm font-black text-amber-400">{ad.rewardAmount}</p>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-muted-foreground uppercase font-black">الحالة</p>
                  <p className="text-[10px] font-bold text-green-400">ACTIVE</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
