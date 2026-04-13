"use client";

import React, { useState } from "react";
import { Megaphone, Plus, Trash2, Loader2, Zap, Globe, BarChart3 } from "lucide-react";
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
import { addAd, deleteAd, Ad } from "@/lib/ads-store";
import { cn } from "@/lib/utils";
import { AdStatsPanel, AdCampaignCard } from "./ad-dashboard-components";

interface AdsManagementProps {
  ads: Ad[];
  onRefresh: () => void;
}

const PRE_DEFINED_CATEGORIES = [
  "تقنية", "ذكاء اصطناعي", "قرآن", "أخبار", "تعليم", "ترفيه", "برمجيات", "عمل حر"
];

const AD_TYPES = [
  { id: 'sidebar', label: 'قائمة جانبية (Sidebar)' },
  { id: 'banner', label: 'بانر عريض (Banner)' },
  { id: 'feed', label: 'خلاصة (Feed)' },
  { id: 'page', label: 'صفحة (Full Page)' }
];

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
    type: "sidebar" as any,
    targetCategories: [] as string[],
    customCategory: ""
  });
  const [activeTab, setActiveTab] = useState("active");

  const toggleCategory = (cat: string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      targetCategories: prev.targetCategories.includes(cat) 
        ? prev.targetCategories.filter((c: string) => c !== cat)
        : [...prev.targetCategories, cat]
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl) {
        toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال العنوان ورابط الصورة." });
        return;
    }
    setIsSubmitting(true);
    try {
      const finalCategories = [...formData.targetCategories];
      if (formData.customCategory.trim()) {
        finalCategories.push(formData.customCategory.trim());
      }

      await addAd({
        title: formData.title,
        description: formData.description,
        linkUrl: formData.linkUrl,
        rewardAmount: formData.rewardAmount,
        category: finalCategories[0] || "general",
        type: formData.type,
        targetCategories: finalCategories,
        imageUrls: [formData.imageUrl],
        authorId: "admin",
        authorName: "System Admin"
      }, true);

      toast({ title: "تم إطلاق الحملة", description: "تم نشر الإعلان المستهدف بنجاح." });
      setIsAddModalOpen(false);
      setFormData({ title: "", description: "", imageUrl: "", linkUrl: "", rewardAmount: 0, type: "sidebar", targetCategories: [], customCategory: "" });
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل الإطلاق" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeAds = Array.isArray(ads) ? ads : [];
  const activeAds = safeAds.filter(a => a.status === 'active');
  const totalImpressions = activeAds.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalClicks = activeAds.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div className="space-y-8 text-right">
      <AdStatsPanel totalImpressions={totalImpressions} totalClicks={totalClicks} avgCTR={avgCTR} />

      <div className="flex justify-between items-center flex-row-reverse">
        <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
          <Megaphone className="text-amber-400" /> إدارة السيادة الإعلانية
        </h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-500 rounded-2xl px-8 font-bold h-12 shadow-lg shadow-amber-600/20">
                <Plus className="mr-2 size-5" /> 
                إنشاء حملة مستهدفة
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-10 text-right max-w-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <DialogHeader><DialogTitle className="text-right text-2xl font-black">إطلاق حملة ذكاء اصطناعي</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                  <Label className="text-white/60 text-[10px] font-bold uppercase mr-2">العنوان والوصف</Label>
                  <Input dir="auto" className="bg-white/5 border-white/10 text-right h-12 rounded-xl" placeholder="عنوان الإعلان (مثلاً: خصم 50% على اشتراك برو)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  <Textarea dir="auto" className="bg-white/5 border-white/10 text-right rounded-xl" placeholder="وصف الإعلان الجذاب..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                      <Label className="text-white/60 text-[10px] font-bold uppercase mr-2">نوع الإعلان</Label>
                      <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12 text-right flex-row-reverse">
                              <SelectValue placeholder="اختر مكان الظهور" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                              {AD_TYPES.map(t => (
                                  <SelectItem key={t.id} value={t.id} className="text-right flex-row-reverse">{t.label}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2 text-right">
                      <Label className="text-white/60 text-[10px] font-bold uppercase mr-2">مكافأة المشاهدة (اختياري)</Label>
                      <Input type="number" className="bg-white/5 border-white/10 text-right h-12 rounded-xl" placeholder="0.00" value={formData.rewardAmount} onChange={e => setFormData({...formData, rewardAmount: Number(e.target.value)})} />
                  </div>
              </div>

              <div className="space-y-2">
                  <Label className="text-white/60 text-[10px] font-bold uppercase mr-2">استهداف الفئات (Hybrid Selection)</Label>
                  <div className="flex flex-wrap gap-2 justify-end">
                      {PRE_DEFINED_CATEGORIES.map(cat => (
                          <Badge 
                            key={cat} 
                            onClick={() => toggleCategory(cat)}
                            className={cn(
                                "cursor-pointer py-1.5 px-4 rounded-lg border transition-all",
                                formData.targetCategories.includes(cat) 
                                    ? "bg-indigo-600 border-indigo-400 text-white" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                            )}
                          >
                              {cat}
                          </Badge>
                      ))}
                  </div>
                  <Input dir="auto" className="bg-white/5 border-white/10 text-right h-10 rounded-xl mt-3 text-xs" placeholder="أو أضف فئة مخصصة يدوياً..." value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value})} />
              </div>

              <div className="space-y-2">
                  <Label className="text-white/60 text-[10px] font-bold uppercase mr-2">الوسائط والروابط</Label>
                  <Input className="bg-white/5 border-white/10 text-right h-12 rounded-xl" placeholder="رابط صورة الإعلان (Unsplash/Direct link)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                  <Input className="bg-white/5 border-white/10 text-right h-12 rounded-xl" placeholder="رابط التوجيه عند النقر" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} />
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button onClick={handleSave} disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 font-black shadow-xl shadow-indigo-600/30">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "إطلاق الحملة فوراً"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-white/5 border-white/10 p-1 flex-row-reverse mb-6 rounded-2xl">
          <TabsTrigger value="active" className="rounded-xl px-8 font-bold">الحملات النشطة</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl px-8 font-bold">بانتظار المراجعة</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeAds.length === 0 ? (
             <div className="col-span-full py-24 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[2.5rem]">لا توجد حملات نشطة حالياً</div>
          ) : activeAds.map(ad => (
              <AdCampaignCard key={ad.id} ad={ad} onDelete={deleteAd} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
