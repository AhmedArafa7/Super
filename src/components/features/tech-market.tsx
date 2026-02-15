"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, Zap, Cpu, ArrowUpRight, ArrowDownLeft, Tag, 
  CheckCircle2, XCircle, Clock, ChevronRight, Upload, Trash2, 
  Wallet, Loader2, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  getMarketItems, addMarketItem, addOffer, updateOfferStatus, deleteMarketItem,
  MarketItem, MarketOffer, PricingMode, ListingType, updateItemStatus, updateItemQuantity
} from "@/lib/market-store";
import { getWallet, initiateEscrow, releaseEscrow } from "@/lib/wallet-store";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

export function TechMarket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [activeView, setActiveView] = useState<'buy' | 'sell' | 'mine' | 'orders'>('buy');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    listingType: "sell_offer" as ListingType,
    pricingMode: "fixed" as PricingMode,
    price: 0,
    minPrice: 0,
    maxPrice: 0,
    quantity: 1,
    currency: "Credits",
    image: ""
  });

  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [offerMessage, setOfferMessage] = useState("");

  const loadInitialData = async () => {
    setIsLoading(true);
    const { items: initialItems, hasMore: more } = await getMarketItems(0, ITEMS_PER_PAGE - 1);
    setItems(initialItems);
    setHasMore(more);
    setOffset(0);
    setIsLoading(false);
  };

  const loadMore = async () => {
    const nextOffset = offset + ITEMS_PER_PAGE;
    const { items: nextItems, hasMore: more } = await getMarketItems(nextOffset, nextOffset + ITEMS_PER_PAGE - 1);
    setItems(prev => [...prev, ...nextItems]);
    setHasMore(more);
    setOffset(nextOffset);
  };

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const handleBuyNow = async (item: MarketItem) => {
    if (!user?.id || isProcessing) return;

    // INVENTORY SAFETY LOCK
    if (item.quantity < 1) {
      return toast({ variant: "destructive", title: "Out of Stock", description: "This neural asset has already been synchronized elsewhere." });
    }

    if (item.ownerId === user.id) {
      return toast({ variant: "destructive", title: "Self-Sync Error", description: "You cannot acquire your own assets." });
    }
    
    const price = item.pricingMode === 'fixed' ? item.price ?? 0 : 0;
    if (price <= 0) return;

    setIsProcessing(true);
    try {
      const currentWallet = await getWallet(user.id);
      if (currentWallet.balance < price) {
        setIsProcessing(false);
        return toast({ variant: "destructive", title: "Credit Shortage", description: "Insufficient funds for acquisition." });
      }

      const res = await initiateEscrow(user.id, item.ownerId, price, item.id);
      if (res.success) {
        await updateItemStatus(item.id, 'reserved', user.id);
        await updateItemQuantity(item.id, item.quantity - 1);
        toast({ title: "Acquisition Initialized", description: "Credits reserved in Secure Escrow." });
        loadInitialData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to initialize acquisition link." });
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
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight">TechMarket P2P</h2>
          <p className="text-muted-foreground mt-1 text-lg">Optimized neural acquisitions.</p>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="buy" className="rounded-lg px-6 data-[state=active]:bg-primary">Buy</TabsTrigger>
              <TabsTrigger value="sell" className="rounded-lg px-6 data-[state=active]:bg-primary">Sell</TabsTrigger>
              <TabsTrigger value="mine" className="rounded-lg px-6 data-[state=active]:bg-primary">My Hub</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg px-6 data-[state=active]:bg-primary">Orders</TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary rounded-xl px-6 h-12 shadow-lg">
                <Plus className="mr-2 size-5" /> Create Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 rounded-3xl">
              <DialogHeader>
                <DialogTitle>New Neural Listing</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input placeholder="Title" value={newListing.title} onChange={e => setNewListing({...newListing, title: e.target.value})} className="bg-white/5" />
                <Textarea placeholder="Description" value={newListing.description} onChange={e => setNewListing({...newListing, description: e.target.value})} className="bg-white/5" />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Price" value={newListing.price} onChange={e => setNewListing({...newListing, price: Number(e.target.value)})} className="bg-white/5" />
                  <Input type="number" placeholder="Quantity" value={newListing.quantity} onChange={e => setNewListing({...newListing, quantity: Number(e.target.value)})} className="bg-white/5" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={async () => { await addMarketItem({ ...newListing, ownerId: user!.id, ownerName: user!.name }); setIsAddModalOpen(false); loadInitialData(); }} className="w-full bg-primary h-12">Publish Listing</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
            {filteredItems.map((item) => (
              <ProductCard key={item.id} item={item} onBuy={handleBuyNow} onOffer={() => { setSelectedItem(item); setIsOfferModalOpen(true); }} isProcessing={isProcessing} isMine={item.ownerId === user?.id} />
            ))}
          </div>
        )}
        
        {hasMore && !isLoading && (
          <div className="flex justify-center pb-12">
            <Button onClick={loadMore} variant="outline" className="rounded-xl border-white/10 px-12 h-12 hover:bg-white/5">
              Load More Results
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ProductCard({ item, onBuy, onOffer, isProcessing, isMine }: { item: MarketItem, onBuy: (i: MarketItem) => void, onOffer: () => void, isProcessing: boolean, isMine: boolean }) {
  return (
    <Card className={cn(
      "group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-primary/40 transition-all duration-500",
      item.status === 'sold' && "opacity-60 grayscale"
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
          data-ai-hint="tech asset"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={cn("backdrop-blur-md", item.listingType === 'sell_offer' ? "bg-indigo-600/60" : "bg-amber-600/60")}>
            {item.listingType === 'sell_offer' ? 'SALE' : 'WANTED'}
          </Badge>
          {item.quantity < 5 && item.quantity > 0 && <Badge className="bg-orange-600/60">LOW STOCK</Badge>}
          {item.quantity === 0 && <Badge className="bg-red-600">OUT OF STOCK</Badge>}
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 italic">"{item.description}"</p>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Pricing</p>
            <p className="text-xl font-bold text-white">{item.price} {item.currency}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Inventory</p>
            <p className="text-sm font-bold text-indigo-400">{item.quantity} units</p>
          </div>
        </div>

        {!isMine && (
          <div className="flex gap-2">
            {item.pricingMode === 'fixed' && (
              <Button 
                disabled={item.status !== 'active' || isProcessing || item.quantity === 0}
                className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl h-11"
                onClick={() => onBuy(item)}
              >
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : 'Buy Now'}
              </Button>
            )}
            <Button 
              disabled={item.status !== 'active' || isProcessing}
              variant="outline"
              className="flex-1 border-white/10 rounded-xl h-11"
              onClick={onOffer}
            >
              Offer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
