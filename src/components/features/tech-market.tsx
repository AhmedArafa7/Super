
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ShoppingCart, Zap, Cpu, Tag, 
  Search, Filter, 
  Wallet, Loader2, Plus, ShoppingBag, Repeat
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
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  getMarketItems, addMarketItem, MarketItem, PricingMode, ListingType, updateItemStatus, updateItemQuantity, MarketCategory
} from "@/lib/market-store";
import { useWalletStore, initiateEscrow } from "@/lib/wallet-store";
import { EmptyState } from "@/components/ui/empty-state";
import { MakeOfferModal } from "./make-offer-modal";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

const CATEGORIES = [
  { value: "all", label: "All Sectors" },
  { value: "ai_tools", label: "AI Tools" },
  { value: "hardware", label: "Hardware" },
  { value: "services", label: "Services" },
  { value: "digital_assets", label: "Digital Assets" },
];

export function TechMarket() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [items, setItems] = useState<MarketItem[]>([]);
  const [activeView, setActiveView] = useState<'buy' | 'sell' | 'mine' | 'orders'>('buy');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MarketCategory>("all");

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    listingType: "sell_offer" as ListingType,
    pricingMode: "fixed" as PricingMode,
    price: 0,
    minPrice: 0,
    maxPrice: 0,
    quantity: 1,
    category: "digital_assets" as MarketCategory,
    currency: "Credits",
    image: ""
  });

  const loadData = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setOffset(0);
    }
    
    const currentOffset = isLoadMore ? offset + ITEMS_PER_PAGE : 0;
    
    const { items: fetchedItems, hasMore: more } = await getMarketItems(
      currentOffset, 
      currentOffset + ITEMS_PER_PAGE - 1,
      search,
      category
    );

    setItems(prev => isLoadMore ? [...prev, ...fetchedItems] : fetchedItems);
    setHasMore(more);
    setOffset(currentOffset);
    setIsLoading(false);
  }, [search, category, offset]);

  // Handle filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(false);
    }, 500); 
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleBuyNow = async (item: MarketItem) => {
    if (!user?.id || isProcessing) return;
    
    if (navigator.onLine && item.quantity < 1) {
      return toast({ variant: "destructive", title: "Asset Depleted", description: "This neural resource is currently out of stock." });
    }
    
    const price = item.price ?? 0;
    setIsProcessing(true);
    try {
      if (navigator.onLine) {
        const currentWallet = useWalletStore.getState().wallet;
        if (currentWallet && currentWallet.balance < price) {
          setIsProcessing(false);
          return toast({ variant: "destructive", title: "Insufficient Credits", description: "Your wallet balance is below the required acquisition threshold." });
        }
      }

      const res = await initiateEscrow(user.id, item.id, item.title, price);
      if (res.success) {
        if (navigator.onLine) {
          await updateItemStatus(item.id, 'reserved', user.id);
          await updateItemQuantity(item.id, item.quantity - 1);
        }
        // Refresh visible data
        loadData(false);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Transmission Sync Failed", description: "Failed to verify credit transaction with the network." });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeView === 'mine') return item.ownerId === user?.id;
    if (activeView === 'orders') return item.buyerId === user?.id;
    if (activeView === 'buy') return item.listingType === 'sell_offer' && item.ownerId !== user?.id && item.status === 'active';
    if (activeView === 'sell') return item.listingType === 'buy_request' && item.ownerId !== user?.id && item.status === 'active';
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight">TechMarket</h2>
          <p className="text-muted-foreground mt-1 text-lg">Decentralized exchange for institutional neural assets.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="buy" className="rounded-lg px-6 data-[state=active]:bg-primary">Acquire</TabsTrigger>
              <TabsTrigger value="sell" className="rounded-lg px-6 data-[state=active]:bg-primary">Fulfill</TabsTrigger>
              <TabsTrigger value="mine" className="rounded-lg px-6 data-[state=active]:bg-primary">Managed</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg px-6 data-[state=active]:bg-primary">Ledger</TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary rounded-xl px-6 h-12 shadow-lg shadow-primary/20 shrink-0">
                <Plus className="mr-2 size-5" /> New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 rounded-3xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Transmit New Listing</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-6">
                <div className="grid gap-2">
                   <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Asset Title</Label>
                   <Input placeholder="Enter technical name..." value={newListing.title} onChange={e => setNewListing({...newListing, title: e.target.value})} className="bg-white/5 border-white/10 h-11 rounded-xl" />
                </div>
                <div className="grid gap-2">
                   <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Specifications</Label>
                   <Textarea placeholder="Provide functional details..." value={newListing.description} onChange={e => setNewListing({...newListing, description: e.target.value})} className="bg-white/5 border-white/10 min-h-[100px] rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Category</Label>
                    <Select value={newListing.category} onValueChange={(v: any) => setNewListing({...newListing, category: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Valuation (Credits)</Label>
                    <Input type="number" value={newListing.price} onChange={e => setNewListing({...newListing, price: Number(e.target.value)})} className="bg-white/5 border-white/10 h-11 rounded-xl" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={async () => { await addMarketItem({ ...newListing, ownerId: user!.id, ownerName: user!.name }); setIsAddModalOpen(false); loadData(false); }} className="w-full bg-primary h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Authorize Publication</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input 
            placeholder="Search for neural assets..." 
            className="w-full h-14 bg-white/5 border-white/10 rounded-2xl pl-12 text-lg focus-visible:ring-indigo-500 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Select value={category} onValueChange={(v: any) => setCategory(v)}>
            <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl pl-10 focus-visible:ring-indigo-500 shadow-inner">
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="size-12 animate-spin text-primary" /></div>
        ) : filteredItems.length === 0 ? (
          <EmptyState 
            icon={Search}
            title="No Results Detected"
            description="Our scan failed to find any assets matching your neural parameters in this sector."
            action={
              <Button variant="outline" className="rounded-xl border-white/10" onClick={() => { setSearch(""); setCategory("all"); }}>
                Reset Global Scan
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
              {filteredItems.map((item) => (
                <ProductCard 
                  key={item.id} 
                  item={item} 
                  onBuy={handleBuyNow} 
                  isProcessing={isProcessing} 
                  isMine={item.ownerId === user?.id} 
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center pb-16">
                <Button 
                  onClick={() => loadData(true)} 
                  variant="outline" 
                  className="rounded-xl border-white/10 px-12 h-14 hover:bg-white/5 transition-all min-w-[240px] font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Synchronizing...
                    </>
                  ) : (
                    'Fetch More Payloads'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ item, onBuy, isProcessing, isMine }: { item: MarketItem, onBuy: (i: MarketItem) => void, isProcessing: boolean, isMine: boolean }) {
  return (
    <Card className={cn(
      "group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-indigo-500/40 transition-all duration-500 flex flex-col h-full shadow-xl",
      item.status === 'sold' && "opacity-60 grayscale scale-[0.98]"
    )}>
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <Image 
          src={item.image || `https://picsum.photos/seed/${item.id}/600/600`} 
          alt={item.title} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8AKp249y6AAAAABJRU5ErkJggg=="
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          data-ai-hint="tech"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Badge className={cn("backdrop-blur-md border-white/10 shadow-lg py-1 px-3", item.listingType === 'sell_offer' ? "bg-indigo-600/70" : "bg-amber-600/70")}>
            {item.listingType === 'sell_offer' ? 'SALE' : 'WANTED'}
          </Badge>
          <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[9px] uppercase font-bold py-1 px-3">
            {item.category.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <CardContent className="p-7 flex flex-col flex-1">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">{item.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic opacity-80">"{item.description}"</p>
        </div>
        
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Valuation</p>
            <p className="text-2xl font-bold text-white tracking-tighter">{item.price?.toLocaleString()} <span className="text-xs text-muted-foreground uppercase font-normal ml-1">Credits</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Nodes</p>
            <p className="text-sm font-bold text-indigo-400">{item.quantity} available</p>
          </div>
        </div>

        {!isMine && (
          <div className="flex gap-3">
            <Button 
              disabled={item.status !== 'active' || isProcessing || item.quantity === 0}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
              onClick={() => onBuy(item)}
            >
              {isProcessing ? <Loader2 className="size-4 animate-spin" /> : 'Acquire'}
            </Button>
            <MakeOfferModal item={item} trigger={
              <Button variant="outline" className="flex-1 rounded-xl h-12 border-white/10 hover:bg-white/5 font-bold transition-all active:scale-95">
                <Repeat className="size-4 mr-2" /> Negotiate
              </Button>
            } />
          </div>
        )}
        
        {isMine && (
          <div className="w-full h-12 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-[11px] text-muted-foreground uppercase font-bold bg-white/5">
            Institutional Asset Owned
          </div>
        )}
      </CardContent>
    </Card>
  );
}
