
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, Filter, Wallet, Loader2, Plus, ShoppingBag, 
  Repeat, Tag, Cpu, Globe, Layers, BookOpen, 
  Terminal, ShieldCheck, Zap, ChevronRight, LayoutGrid,
  Laptop, Boxes, Briefcase, GraduationCap, Download, Play, MonitorSmartphone
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
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  getMarketItems, addMarketItem, MarketItem, 
  MainCategory, SUB_CATEGORIES 
} from "@/lib/market-store";
import { EmptyState } from "@/components/ui/empty-state";
import { MakeOfferModal } from "./make-offer-modal";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    stockQuantity: 1,
    isLaunchable: false,
    launchUrl: "",
    downloadUrl: ""
  });

  const availableSubs = useMemo(() => 
    SUB_CATEGORIES.filter(s => s.parent === mainCat),
  [mainCat]);

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
    try {
      await addMarketItem({ ...newListing, sellerId: user.id });
      setIsAddModalOpen(false);
      loadData(false);
      toast({ title: "Listing Authorized", description: "Your asset is now live on the network." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Authorization Failed", description: err.message });
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

  return (
    <div className="flex h-full bg-slate-950/50">
      <aside className="w-64 border-r border-white/5 bg-slate-900/20 backdrop-blur-xl flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">Market Clusters</h2>
          <nav className="space-y-1">
            {MAIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setMainCat(cat.id as MainCategory); setSubCat('all_subs'); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
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
        
        <div className="p-6">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">Sync Protocols</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Software nodes are verified by <span className="text-primary font-bold text-[8px]">NEXUS-SHIELD</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-8 border-b border-white/5 bg-slate-900/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
                TechMarket
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase">v4.2</Badge>
              </h1>
              <p className="text-muted-foreground mt-1">Decentralized exchange for items and software nodes.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1 flex-1 md:flex-none">
                <TabsList className="bg-transparent h-10 w-full grid grid-cols-2">
                  <TabsTrigger value="buy" className="rounded-lg data-[state=active]:bg-primary">Acquire</TabsTrigger>
                  <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-primary">My Assets</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex-1 md:flex-none">
                    <Plus className="mr-2 size-5" /> New Listing
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10 rounded-[2.5rem] p-8 sm:max-w-[650px] overflow-y-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Transmit Asset Node</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                    <div className="space-y-4 md:col-span-2">
                      <div className="grid gap-2">
                        <Label>Asset Title</Label>
                        <Input dir="auto" placeholder="Technical name..." value={newListing.title} onChange={e => setNewListing({...newListing, title: e.target.value})} className="bg-white/5 border-white/10 text-right" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea dir="auto" placeholder="Neural capabilities and specs..." value={newListing.description} onChange={e => setNewListing({...newListing, description: e.target.value})} className="bg-white/5 border-white/10 text-right min-h-[100px]" />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Cluster</Label>
                      <Select value={newListing.mainCategory} onValueChange={(v: any) => setNewListing({...newListing, mainCategory: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          {MAIN_CATEGORIES.filter(c => c.id !== 'all').map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Sub-Protocol</Label>
                      <Select value={newListing.subCategory} onValueChange={(v: any) => setNewListing({...newListing, subCategory: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          {SUB_CATEGORIES.filter(s => s.parent === newListing.mainCategory).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {newListing.mainCategory === 'software' && (
                      <div className="md:col-span-2 space-y-4 border-t border-white/5 pt-4">
                        <Label className="text-primary font-bold">App Delivery Methods</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-xs">Live Preview URL (Internal Launch)</Label>
                            <Input placeholder="https://..." value={newListing.launchUrl} onChange={e => setNewListing({...newListing, launchUrl: e.target.value, isLaunchable: !!e.target.value})} className="bg-white/5 border-white/10" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs">Download URL (Binary File)</Label>
                            <Input placeholder="https://storage.link/..." value={newListing.downloadUrl} onChange={e => setNewListing({...newListing, downloadUrl: e.target.value})} className="bg-white/5 border-white/10" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label>Valuation (Credits)</Label>
                      <Input type="number" value={newListing.price} onChange={e => setNewListing({...newListing, price: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                    </div>

                    <div className="grid gap-2">
                      <Label>Availability (Nodes)</Label>
                      <Input type="number" value={newListing.stockQuantity} onChange={e => setNewListing({...newListing, stockQuantity: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddListing} className="w-full bg-primary h-12 rounded-xl font-bold shadow-xl shadow-primary/20">
                      Authorize Publication
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input 
                dir="auto" 
                placeholder="Search the global neural registry..." 
                className="w-full h-14 bg-white/5 border-white/10 rounded-2xl pl-12 text-right text-lg focus-visible:ring-primary shadow-inner" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            {availableSubs.length > 0 && (
              <ScrollArea className="w-full md:w-auto h-14" orientation="horizontal">
                <div className="flex gap-2 p-1">
                  <Badge 
                    variant={subCat === 'all_subs' ? 'default' : 'outline'}
                    className={cn("h-10 px-6 rounded-xl cursor-pointer transition-all", subCat === 'all_subs' ? "bg-indigo-600" : "border-white/10 hover:bg-white/5")}
                    onClick={() => setSubCat('all_subs')}
                  >
                    All Sub-Sectors
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
                <p className="text-muted-foreground animate-pulse font-bold tracking-widest text-xs">SYNCHRONIZING DATA NODES...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState 
                icon={Search} 
                title="Global Scan: Zero Results" 
                description="The neural registry returned no matches for your current parameters." 
                className="py-24"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-20">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-indigo-500/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl relative">
                    <div className="absolute top-0 right-0 p-4 z-10">
                      <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[8px] uppercase tracking-tighter">
                        {SUB_CATEGORIES.find(s => s.id === item.subCategory)?.label || item.subCategory}
                      </Badge>
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
                      <div className="flex items-baseline justify-end gap-2 mb-6">
                        <span className="text-3xl font-black text-white tracking-tighter">{item.price?.toLocaleString()}</span>
                        <span className="text-primary font-bold text-xs uppercase">Credits</span>
                      </div>
                      
                      <div className="flex flex-col gap-3 border-t border-white/5 pt-6 mt-2">
                        {item.sellerId !== user?.id ? (
                          <div className="flex gap-2">
                            <MakeOfferModal item={item} />
                            <Button className="flex-1 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20">
                              Acquire
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {item.isLaunchable && item.launchUrl && (
                              <Button 
                                onClick={() => onLaunchApp?.(item.launchUrl!, item.title)}
                                className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl font-bold gap-2"
                              >
                                <Play className="size-4" /> Run Node
                              </Button>
                            )}
                            {item.downloadUrl && (
                              <Button 
                                onClick={() => handleDownload(item.downloadUrl!, item.title)}
                                variant="outline" 
                                className="flex-1 border-white/10 rounded-xl font-bold gap-2"
                              >
                                <Download className="size-4" /> Download
                              </Button>
                            )}
                          </div>
                        )}
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center">
                          {item.stockQuantity} instances available
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
    </div>
  );
}
