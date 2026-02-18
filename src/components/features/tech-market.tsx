"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, Filter, Wallet, Loader2, Plus, ShoppingBag, 
  Repeat, Tag, Cpu, Globe, Layers, BookOpen, 
  Terminal, ShieldCheck, Zap, ChevronRight, LayoutGrid,
  Laptop, Boxes, Briefcase, GraduationCap, Download, Play, MonitorSmartphone,
  FileCode, CheckCircle2, Upload, Info, MessageCircle, Edit3, ArrowLeft, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  getMarketItems, addMarketItem, updateMarketItem, MarketItem, 
  MainCategory, SUB_CATEGORIES, AppVersionStatus, uploadMarketImage
} from "@/lib/market-store";
import { EmptyState } from "@/components/ui/empty-state";
import { MakeOfferModal } from "./make-offer-modal";
import { uploadLearningFile } from "@/lib/learning-store";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

const MAIN_CATEGORIES = [
  { id: 'all', label: 'All Clusters', icon: LayoutGrid },
  { id: 'electronics', label: 'Electronics', icon: Laptop },
  { id: 'digital_assets', label: 'Digital Assets', icon: Boxes },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'tools', label: 'AI Tools', icon: Terminal },
  { id: 'education', label: 'Knowledge', icon: GraduationCap },
  { id: 'software', label: 'Apps & Nodes', icon: MonitorSmartphone },
];

export function TechMarket({ onLaunchApp }: { onLaunchApp?: (url: string, title: string) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [items, setItems] = useState<MarketItem[]>([]);
  const [activeView, setActiveView] = useState<'buy' | 'mine'>('buy');
  const [viewingItem, setViewingItem] = useState<MarketItem | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [mainCat, setMainCat] = useState<MainCategory>("all");
  const [subCat, setSubCat] = useState<string>("all_subs");

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    price: 0,
    mainCategory: "digital_assets" as MainCategory,
    subCategory: "ai_models",
    imageUrl: "",
    imageFile: null as File | null,
    stockQuantity: 1,
    isLaunchable: false,
    launchUrl: "",
    downloadUrl: "",
    buildFile: null as File | null,
    versionStatus: "final" as AppVersionStatus
  });

  const handleOpenAddModal = () => {
    setNewListing({
      title: "",
      description: "",
      price: 0,
      mainCategory: mainCat !== 'all' ? mainCat : 'digital_assets',
      subCategory: SUB_CATEGORIES.find(s => s.parent === (mainCat !== 'all' ? mainCat : 'digital_assets'))?.id || "ai_models",
      imageUrl: "",
      imageFile: null,
      stockQuantity: 1,
      isLaunchable: false,
      launchUrl: "",
      downloadUrl: "",
      buildFile: null,
      versionStatus: "final"
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: MarketItem) => {
    setEditingItem(item);
    setNewListing({
      title: item.title,
      description: item.description,
      price: item.price,
      mainCategory: item.mainCategory,
      subCategory: item.subCategory,
      imageUrl: item.imageUrl || "",
      imageFile: null,
      stockQuantity: item.stockQuantity,
      isLaunchable: item.isLaunchable || false,
      launchUrl: item.launchUrl || "",
      downloadUrl: item.downloadUrl || "",
      buildFile: null,
      versionStatus: item.versionStatus || "final"
    });
    setIsEditModalOpen(true);
  };

  const availableSubs = useMemo(() => 
    SUB_CATEGORIES.filter(s => s.parent === newListing.mainCategory),
  [newListing.mainCategory]);

  const loadData = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setOffset(0);
    }
    const currentOffset = isLoadMore ? offset + ITEMS_PER_PAGE : 0;
    const { items: fetchedItems, hasMore: more } = await getMarketItems(
      currentOffset, 
      ITEMS_PER_PAGE, 
      search, 
      mainCat, 
      subCat
    );
    setItems(prev => isLoadMore ? [...prev, ...fetchedItems] : fetchedItems);
    setHasMore(more);
    setOffset(currentOffset);
    setIsLoading(false);
  }, [search, mainCat, subCat, offset]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(false), 300);
    return () => clearTimeout(timer);
  }, [search, mainCat, subCat, loadData]);

  const handleAddListing = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let finalImageUrl = newListing.imageUrl;
      let finalDownloadUrl = newListing.downloadUrl;

      if (newListing.imageFile) {
        toast({ title: "Uploading Image", description: "Transmitting asset visual to Vault..." });
        finalImageUrl = await uploadMarketImage(newListing.imageFile, (pct) => setUploadProgress(pct * 0.5));
      }

      if (newListing.mainCategory === 'software' && newListing.buildFile) {
        toast({ title: "Uploading Build", description: "Transmitting binary to Nexus Vault..." });
        finalDownloadUrl = await uploadLearningFile(newListing.buildFile, (pct) => setUploadProgress(50 + pct * 0.5));
      }

      await addMarketItem({ 
        ...newListing, 
        sellerId: user.id,
        imageUrl: finalImageUrl,
        downloadUrl: finalDownloadUrl 
      });

      setIsAddModalOpen(false);
      setActiveView('mine');
      loadData(false);
      toast({ title: "Listing Authorized", description: "Your asset is now live on the network." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Authorization Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateListing = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let finalImageUrl = newListing.imageUrl;
      let finalDownloadUrl = newListing.downloadUrl;

      if (newListing.imageFile) {
        finalImageUrl = await uploadMarketImage(newListing.imageFile, (pct) => setUploadProgress(pct * 0.5));
      }

      if (newListing.mainCategory === 'software' && newListing.buildFile) {
        finalDownloadUrl = await uploadLearningFile(newListing.buildFile, (pct) => setUploadProgress(50 + pct * 0.5));
      }

      await updateMarketItem(editingItem.id, {
        title: newListing.title,
        description: newListing.description,
        price: newListing.price,
        mainCategory: newListing.mainCategory,
        subCategory: newListing.subCategory,
        imageUrl: finalImageUrl,
        stockQuantity: newListing.stockQuantity,
        versionStatus: newListing.versionStatus,
        launchUrl: newListing.launchUrl,
        downloadUrl: finalDownloadUrl,
        isLaunchable: !!newListing.launchUrl
      });

      setIsEditModalOpen(false);
      loadData(false);
      if (viewingItem?.id === editingItem.id) {
        const { items: updated } = await getMarketItems(0, 1, editingItem.title);
        if (updated.length > 0) setViewingItem(updated[0]);
      }
      toast({ title: "Sync Complete", description: "Asset properties updated across the network." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = (url: string, title: string) => {
    if (!url) return;
    toast({ title: "Neural Download Initiated", description: `Fetching binary for ${title}...` });
    window.open(url, '_blank');
  };

  const filteredItems = items.filter(item => {
    if (activeView === 'mine') return item.sellerId === user?.id;
    return item.sellerId !== user?.id && item.status === 'active';
  });

  if (viewingItem) {
    const isOwner = viewingItem.sellerId === user?.id;
    return (
      <div className="flex-1 flex flex-col bg-slate-950/50 animate-in fade-in duration-500">
        <header className="p-6 border-b border-white/5 bg-slate-900/20 backdrop-blur-xl flex items-center justify-between flex-row-reverse">
          <Button variant="ghost" className="rounded-xl gap-2 text-white" onClick={() => setViewingItem(null)}>
            <ArrowLeft className="size-4 rotate-180" /> العودة للسجل
          </Button>
          <div className="text-right">
            <h2 dir="auto" className="text-xl font-bold text-white">{viewingItem.title}</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">معاينة تفاصيل العقدة</p>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group">
                <Image 
                  src={viewingItem.imageUrl || `https://picsum.photos/seed/${viewingItem.id}/800/800`} 
                  alt={viewingItem.title} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/10 px-4 py-1.5 text-xs font-bold uppercase">
                    {SUB_CATEGORIES.find(s => s.id === viewingItem.subCategory)?.label || viewingItem.subCategory}
                  </Badge>
                  {viewingItem.mainCategory === 'software' && (
                    <Badge className={cn(
                      "backdrop-blur-md border-white/10 px-4 py-1.5 text-xs font-black uppercase",
                      viewingItem.versionStatus === 'beta' ? "bg-amber-500/80" : "bg-green-500/80"
                    )}>
                      {viewingItem.versionStatus === 'beta' ? 'BETA' : 'FINAL'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-8 text-right">
              <div className="space-y-4">
                <h1 dir="auto" className="text-5xl font-black text-white tracking-tighter leading-tight">{viewingItem.title}</h1>
                <div className="flex items-center justify-end gap-4">
                   <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl">
                      <span className="text-3xl font-black text-indigo-400">{viewingItem.price?.toLocaleString()}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Credits</span>
                   </div>
                   <Badge variant="outline" className="h-10 px-4 rounded-xl border-white/10 text-muted-foreground">
                      STOCK: {viewingItem.stockQuantity}
                   </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em]">Neural Description</h3>
                <p dir="auto" className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap italic">
                  "{viewingItem.description}"
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-white/5">
                {!isOwner ? (
                  <>
                    <MakeOfferModal 
                      item={viewingItem} 
                      trigger={
                        <Button variant="outline" className="h-16 rounded-2xl border-white/10 hover:bg-white/5 font-bold text-lg gap-3">
                          <MessageCircle className="size-6 text-indigo-400" /> تقديم عرض
                        </Button>
                      }
                    />
                    <Button className="h-16 bg-primary rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20">
                      استحواذ الآن
                    </Button>
                  </>
                ) : (
                  <>
                    {viewingItem.isLaunchable && viewingItem.launchUrl && (
                      <Button 
                        onClick={() => onLaunchApp?.(viewingItem.launchUrl!, viewingItem.title)}
                        className="h-16 bg-green-600 hover:bg-green-500 rounded-2xl font-bold text-lg gap-3"
                      >
                        <Play className="size-6" /> تشغيل العقدة
                      </Button>
                    )}
                    {viewingItem.downloadUrl && (
                      <Button 
                        onClick={() => handleDownload(viewingItem.downloadUrl!, viewingItem.title)}
                        variant="outline" 
                        className="h-16 border-white/10 rounded-2xl font-bold text-lg gap-3"
                      >
                        <Download className="size-6 text-indigo-400" /> تحميل المصدر
                      </Button>
                    )}
                    <Button 
                      onClick={() => handleOpenEditModal(viewingItem)}
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
                    <img src={`https://picsum.photos/seed/${viewingItem.sellerId}/60/60`} className="size-full object-cover" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">المالك / المطور</p>
                    <p className="font-bold text-white">@{viewingItem.sellerId.substring(0, 8)}</p>
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

  return (
    <div className="flex h-full bg-slate-950/50">
      <aside className="w-64 border-r border-white/5 bg-slate-900/20 backdrop-blur-xl flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 text-right">نطاقات المتجر</h2>
          <nav className="space-y-1">
            {MAIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setMainCat(cat.id as MainCategory); setSubCat('all_subs'); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group flex-row-reverse",
                  mainCat === cat.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <cat.icon className={cn("size-4 transition-colors", mainCat === cat.id ? "text-white" : "text-indigo-400 group-hover:text-primary")} />
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-8 border-b border-white/5 bg-slate-900/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 flex-row-reverse">
            <div className="text-right">
              <h1 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3 justify-end">
                TechMarket
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase">v4.5</Badge>
              </h1>
              <p className="text-muted-foreground mt-1">سوق الأصول البرمجية والحلول الذكية اللامركزي.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto flex-row-reverse">
              <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1 flex-1 md:flex-none">
                <TabsList className="bg-transparent h-10 w-full grid grid-cols-2">
                  <TabsTrigger value="buy" className="rounded-lg data-[state=active]:bg-primary">استحواذ</TabsTrigger>
                  <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-primary">أصولي</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button onClick={handleOpenAddModal} className="bg-primary rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex-1 md:flex-none font-bold">
                <Plus className="mr-2 size-5" /> إضافة منتج
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 flex-row-reverse">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input 
                dir="auto" 
                placeholder="البحث في السجل العصبي العالمي..." 
                className="w-full h-14 bg-white/5 border-white/10 rounded-2xl pr-12 text-right text-lg focus-visible:ring-primary shadow-inner text-white" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            {availableSubs.length > 0 && (
              <ScrollArea className="w-full md:w-auto h-14" orientation="horizontal">
                <div className="flex gap-2 p-1 flex-row-reverse">
                  <Badge 
                    variant={subCat === 'all_subs' ? 'default' : 'outline'}
                    className={cn("h-10 px-6 rounded-xl cursor-pointer transition-all", subCat === 'all_subs' ? "bg-indigo-600" : "border-white/10 hover:bg-white/5")}
                    onClick={() => setSubCat('all_subs')}
                  >
                    كل الفئات
                  </Badge>
                  {availableSubs.map(s => (
                    <Badge 
                      key={s.id}
                      variant={subCat === s.id ? 'default' : 'outline'}
                      className={cn("h-10 px-6 rounded-xl cursor-pointer whitespace-nowrap transition-all", subCat === s.id ? "bg-indigo-600" : "border-white/10 hover:bg-white/5")}
                      onClick={() => setSubCat(s.id)}
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-8">
            {isLoading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse font-bold tracking-widest text-xs uppercase">جاري مزامنة العقد...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState 
                icon={Search} 
                title="نتائج البحث فارغة" 
                description={activeView === 'buy' ? "لم يتم العثور على أصول للبيع تناسب معاييرك." : "لم تقم برفع أي أصول في هذا القسم بعد."} 
                className="py-24"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-20">
                {filteredItems.map((item) => (
                  <Card key={item.id} onClick={() => setViewingItem(item)} className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-indigo-500/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl relative cursor-pointer">
                    <div className="absolute top-0 left-0 p-4 z-10 flex flex-col gap-2">
                      <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[8px] uppercase tracking-tighter">
                        {SUB_CATEGORIES.find(s => s.id === item.subCategory)?.label || item.subCategory}
                      </Badge>
                      {item.mainCategory === 'software' && (
                        <Badge className={cn(
                          "backdrop-blur-md border-white/10 text-[8px] uppercase tracking-tighter font-black",
                          item.versionStatus === 'beta' ? "bg-amber-500/80 text-white" : "bg-green-500/80 text-white"
                        )}>
                          {item.versionStatus === 'beta' ? 'BETA' : 'FINAL'}
                        </Badge>
                      )}
                    </div>
                    <div className="relative aspect-square overflow-hidden bg-slate-900">
                      <Image 
                        src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/600`} 
                        alt={item.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    </div>
                    <CardContent className="p-7">
                      <h3 dir="auto" className="text-xl font-bold text-white line-clamp-1 text-right mb-2">{item.title}</h3>
                      <p dir="auto" className="text-xs text-muted-foreground line-clamp-2 mb-6 text-right leading-relaxed h-8">
                        {item.description}
                      </p>
                      <div className="flex items-baseline justify-end gap-2 mb-6 flex-row-reverse">
                        <span className="text-3xl font-black text-white tracking-tighter">{item.price?.toLocaleString()}</span>
                        <span className="text-primary font-bold text-xs uppercase">رصيد</span>
                      </div>
                      
                      <div className="flex flex-col gap-3 border-t border-white/5 pt-6 mt-2">
                        {item.sellerId !== user?.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <MakeOfferModal 
                                item={item} 
                                trigger={
                                  <Button variant="outline" onClick={(e) => e.stopPropagation()} className="flex-1 rounded-xl h-12 border-white/10 hover:bg-white/5 font-bold gap-2">
                                    <MessageCircle className="size-4" /> تواصل
                                  </Button>
                                }
                              />
                              <Button className="flex-1 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20">
                                تفاصيل
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Button 
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(item); }}
                              variant="ghost" 
                              className="w-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl h-10 font-bold gap-2 border border-indigo-500/20"
                            >
                              <Edit3 className="size-4" /> تعديل العقدة
                            </Button>
                          </div>
                        )}
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center">
                          متوفر {item.stockQuantity} نسخة
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if (!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); } }}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 sm:max-w-[650px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right text-white">
              {isEditModalOpen ? "تحديث بيانات الأصل" : "إطلاق عقدة منتج جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-4 md:col-span-2">
              <div className="grid gap-2">
                <Label className="text-right">عنوان المنتج</Label>
                <Input dir="auto" placeholder="الاسم التقني..." value={newListing.title} onChange={e => setNewListing({...newListing, title: e.target.value})} className="bg-white/5 border-white/10 text-right" />
              </div>
              <div className="grid gap-2">
                <Label className="text-right">الوصف العصبي</Label>
                <Textarea dir="auto" placeholder="اشرح قدرات هذا المنتج..." value={newListing.description} onChange={e => setNewListing({...newListing, description: e.target.value})} className="bg-white/5 border-white/10 text-right min-h-[100px]" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <Label className="text-right block">صورة المنتج المخصصة</Label>
              <div className="relative h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={e => setNewListing({...newListing, imageFile: e.target.files?.[0] || null})}
                  accept="image/*"
                />
                {newListing.imageFile ? (
                  <div className="flex items-center gap-3 text-green-400 font-bold">
                    <CheckCircle2 className="size-6" />
                    <span className="text-sm truncate max-w-[250px]">{newListing.imageFile.name}</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="size-8 text-muted-foreground group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs text-muted-foreground">اضغط لرفع صورة العقدة</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label className="text-right">القطاع</Label>
              <Select value={newListing.mainCategory} onValueChange={(v: any) => setNewListing({...newListing, mainCategory: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {MAIN_CATEGORIES.filter(c => c.id !== 'all').map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-right">البروتوكول الفرعي</Label>
              <Select value={newListing.subCategory} onValueChange={(v: any) => setNewListing({...newListing, subCategory: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {SUB_CATEGORIES.filter(s => s.parent === newListing.mainCategory).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {newListing.mainCategory === 'software' && (
              <div className="md:col-span-2 space-y-6 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between flex-row-reverse">
                  <Label className="text-primary font-bold block text-right">إرسال حزمة البرمجيات</Label>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">الحالة:</Label>
                    <Select value={newListing.versionStatus} onValueChange={(v: any) => setNewListing({...newListing, versionStatus: v})}>
                      <SelectTrigger className="h-8 w-28 bg-white/5 border-white/10 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="final">نسخة نهائية</SelectItem>
                        <SelectItem value="beta">إصدار Beta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs text-right">رابط المعاينة الحية (Internal)</Label>
                    <Input placeholder="https://..." value={newListing.launchUrl} onChange={e => setNewListing({...newListing, launchUrl: e.target.value, isLaunchable: !!e.target.value})} className="bg-white/5 border-white/10 text-right" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-right">رابط تحميل خارجي (اختياري)</Label>
                    <Input placeholder="https://storage.link/..." value={newListing.downloadUrl} onChange={e => setNewListing({...newListing, downloadUrl: e.target.value})} className="bg-white/5 border-white/10 text-right" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-right block">أو ارفع ملف بناء جديد (ZIP, APK, EXE)</Label>
                  <div className="relative h-24 bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-500/10 transition-all group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={e => setNewListing({...newListing, buildFile: e.target.files?.[0] || null})}
                      accept=".apk,.exe,.zip,.rar,.ipa"
                    />
                    {newListing.buildFile ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="size-5" />
                        <span className="text-sm font-bold truncate max-w-[200px]">{newListing.buildFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="size-6 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                        <p className="text-[10px] text-muted-foreground">اضغط لرفع ملف البناء المباشر</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-right">التقييم (Credits)</Label>
              <Input type="number" value={newListing.price} onChange={e => setNewListing({...newListing, price: Number(e.target.value)})} className="bg-white/5 border-white/10 text-right" />
            </div>

            <div className="grid gap-2">
              <Label className="text-right">الكمية المتوفرة</Label>
              <Input type="number" value={newListing.stockQuantity} onChange={e => setNewListing({...newListing, stockQuantity: Number(e.target.value)})} className="bg-white/5 border-white/10 text-right" />
            </div>
          </div>

          {isSubmitting && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[10px] uppercase font-bold text-indigo-400">
                <span>جاري مزامنة البيانات</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1 bg-white/5" />
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={isEditModalOpen ? handleUpdateListing : handleAddListing} 
              disabled={isSubmitting || !newListing.title}
              className="w-full bg-primary h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="size-5 animate-spin mr-2" /> : <Zap className="size-5 mr-2" />}
              {isEditModalOpen ? "حفظ التغييرات العصبية" : "تأكيد الإطلاق"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
