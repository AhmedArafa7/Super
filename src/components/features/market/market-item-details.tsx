
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Play, Download, Edit3, MessageCircle, Info, Loader2, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarketItem, SUB_CATEGORIES, updateStock } from "@/lib/market-store";
import { MakeOfferModal } from "../make-offer-modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface MarketItemDetailsProps {
  item: MarketItem;
  userId?: string;
  isAdmin?: boolean;
  userBalance?: number;
  onBack: () => void;
  onLaunch?: (url: string, title: string) => void;
  onEdit: (item: MarketItem) => void;
  onAcquire: (item: MarketItem) => Promise<void>;
}

/**
 * [STABILITY_ANCHOR: MARKET_DETAILS_V2.5]
 * واجهة تفاصيل المنتج - تم تحسين استجابة زر الاستحواذ وتفعيل مؤشرات التحميل.
 */
export function MarketItemDetails({ item, userId, isAdmin, userBalance = 0, onBack, onLaunch, onEdit, onAcquire }: MarketItemDetailsProps) {
  const { toast } = useToast();
  const [localItem, setLocalItem] = useState<MarketItem>(item);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [newStock, setNewStock] = useState(localItem.stockQuantity.toString());
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const isOwner = localItem.sellerId === userId;
  const subCatLabel = SUB_CATEGORIES.find(s => s.id === localItem.subCategory)?.label || localItem.subCategory;

  const handleUpdateStock = async () => {
    setIsUpdatingStock(true);
    try {
      const stockVal = parseInt(newStock);
      await updateStock(localItem.id, stockVal);
      toast({ title: "تم تحديث المخزون", description: "تمت مزامنة الكمية الجديدة بنجاح." });
      setLocalItem(prev => ({ ...prev, stockQuantity: stockVal }));
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التحديث", description: "عذراً، حدث خطأ أثناء تحديث المخزون." });
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleDownload = () => {
    if (!localItem.downloadUrl) return;
    toast({ title: "بدأ التحميل العصبي", description: `جاري جلب ملفات ${localItem.title}...` });
    window.open(localItem.downloadUrl, '_blank');
  };

  const handleAcquireClick = async () => {
    if (userBalance < localItem.price) {
      toast({ 
        variant: "destructive", 
        title: "رصيد غير كافٍ", 
        description: `تحتاج إلى ${localItem.price - userBalance} Credits إضافية لإتمام المزامنة.` 
      });
      return;
    }

    const warning = "\n\n⚠️ تنبيه هام: لا يمكن إرجاع البرمجيات بعد الاستحواذ إلا في حال وجود عطل تقني مثبت من قبل المطور.";
    const confirmed = window.confirm(`هل أنت متأكد من رغبتك في استحواذ "${localItem.title}" مقابل ${localItem.price} Credits؟${warning}`);
    
    if (!confirmed) return;

    setIsAcquiring(true);
    try {
      await onAcquire(localItem);
    } catch (e: any) {
      console.error("Acquisition Error:", e);
      toast({ 
        variant: "destructive", 
        title: "فشل في المعالجة", 
        description: e.message || "حدث خطأ غير متوقع أثناء المزامنة." 
      });
    } finally {
      setIsAcquiring(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950/50 animate-in fade-in duration-500">
      <header className="p-6 border-b border-white/5 bg-slate-900/20 backdrop-blur-xl flex items-center justify-between flex-row-reverse">
        <Button variant="ghost" className="rounded-xl gap-2 text-white" onClick={onBack}>
          <ArrowLeft className="size-4 rotate-180" /> العودة للسجل
        </Button>
        <div className="text-right">
          <h2 dir="auto" className="text-xl font-bold text-white">{localItem.title}</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">معاينة تفاصيل العقدة</p>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group">
              <Image 
                src={localItem.imageUrl || `https://picsum.photos/seed/${localItem.id}/800/800`} 
                alt={localItem.title} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-3">
                <Badge className="bg-black/60 backdrop-blur-md border-white/10 px-4 py-1.5 text-xs font-bold uppercase">
                  {subCatLabel}
                </Badge>
                {localItem.mainCategory === 'software' && (
                  <Badge className={cn(
                    "backdrop-blur-md border-white/10 px-4 py-1.5 text-xs font-black uppercase",
                    localItem.versionStatus === 'beta' ? "bg-amber-500/80" : "bg-green-500/80"
                  )}>
                    {localItem.versionStatus === 'beta' ? 'BETA' : 'FINAL'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] flex items-start gap-4 flex-row-reverse shadow-inner">
              <AlertTriangle className="size-6 text-amber-500 shrink-0 mt-1" />
              <div className="text-right space-y-1">
                <p className="text-xs font-bold text-white">سياسة الاستحواذ الرقمي</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  لا يمكن إرجاع البرمجيات بعد الاستحواذ إلا في حال وجود عطل تقني مثبت من قبل مطور العقدة.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-8 text-right">
            <div className="space-y-4">
              <h1 dir="auto" className="text-5xl font-black text-white tracking-tighter leading-tight">{localItem.title}</h1>
              <div className="flex items-center justify-end gap-4">
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl">
                    {localItem.price === 0 ? (
                      <span className="text-3xl font-black text-green-400">مجاناً</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-indigo-400">{localItem.price?.toLocaleString()}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase">Credits</span>
                      </>
                    )}
                </div>
                 <Badge variant="outline" className="h-10 px-4 rounded-xl border-white/10 text-muted-foreground">
                    STOCK: {localItem.stockQuantity}
                 </Badge>
                  {isAdmin && (
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                      <Input 
                        type="number" 
                        value={newStock} 
                        onChange={(e) => setNewStock(e.target.value)} 
                        className="w-20 h-8 bg-transparent border-none text-center font-bold"
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleUpdateStock} 
                        disabled={isUpdatingStock}
                        className="h-8 rounded-xl bg-primary/20 hover:bg-primary/40 text-[10px] font-bold"
                      >
                        {isUpdatingStock ? <Loader2 className="size-3 animate-spin" /> : "تعديل المخزون"}
                      </Button>
                    </div>
                  )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em]">الوصف العصبي</h3>
              <p dir="auto" className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap italic">
                "{localItem.description}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-white/5">
              {!isOwner ? (
                <>
                  <MakeOfferModal 
                    item={localItem} 
                    trigger={
                      <Button variant="outline" disabled={isAcquiring} className="h-16 rounded-2xl border-white/10 hover:bg-white/5 font-bold text-lg gap-3">
                        <MessageCircle className="size-6 text-indigo-400" /> تقديم عرض
                      </Button>
                    }
                  />
                  <Button 
                    onClick={handleAcquireClick}
                    disabled={isAcquiring || localItem.stockQuantity <= 0}
                    className="h-16 bg-primary rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20 relative"
                  >
                    {isAcquiring ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin size-6" />
                        <span>جاري المزامنة...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Zap className="size-6" />
                        <span>{localItem.stockQuantity <= 0 ? "نفذت الكمية" : "استحواذ الآن"}</span>
                      </div>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {localItem.isLaunchable && localItem.launchUrl && (
                    <Button 
                      onClick={() => onLaunch?.(localItem.launchUrl!, localItem.title)}
                      className="h-16 bg-green-600 hover:bg-green-500 rounded-2xl font-bold text-lg gap-3"
                    >
                      <Play className="size-6" /> تشغيل العقدة
                    </Button>
                  )}
                  {localItem.downloadUrl && (
                    <Button 
                      onClick={handleDownload}
                      variant="outline" 
                      className="h-16 border-white/10 rounded-2xl font-bold text-lg gap-3"
                    >
                      <Download className="size-6 text-indigo-400" /> تحميل المصدر
                    </Button>
                  )}
                  <Button 
                    onClick={() => onEdit(localItem)}
                    variant="ghost" 
                    className="col-span-full h-14 bg-white/5 hover:bg-white/10 rounded-2xl font-bold gap-3 border border-white/5"
                  >
                    <Edit3 className="size-5" /> تعديل بيانات العقدة
                  </Button>
                </>
              )}
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className="size-12 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${localItem.sellerId}/60/60`} className="size-full object-cover" alt="owner" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">المالك / المطور</p>
                  <p className="font-bold text-white">@{localItem.sellerId.substring(0, 8)}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-indigo-500/20 text-indigo-400">VERIFIED NODE</Badge>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
