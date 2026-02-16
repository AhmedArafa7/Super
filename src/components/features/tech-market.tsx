
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Wallet, Loader2, Plus, ShoppingBag, Repeat, Tag } from "lucide-react";
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
import { getMarketItems, addMarketItem, MarketItem, MarketCategory } from "@/lib/market-store";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [activeView, setActiveView] = useState<'buy' | 'mine'>('buy');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MarketCategory>("all");

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    price: 0,
    category: "digital_assets" as MarketCategory,
    imageUrl: "",
    stockQuantity: 1
  });

  const loadData = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setOffset(0);
    }
    const currentOffset = isLoadMore ? offset + ITEMS_PER_PAGE : 0;
    const { items: fetchedItems, hasMore: more } = await getMarketItems(currentOffset, currentOffset + ITEMS_PER_PAGE - 1, search, category);
    setItems(prev => isLoadMore ? [...prev, ...fetchedItems] : fetchedItems);
    setHasMore(more);
    setOffset(currentOffset);
    setIsLoading(false);
  }, [search, category, offset]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(false), 500);
    return () => clearTimeout(timer);
  }, [search, category]);

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

  const filteredItems = items.filter(item => {
    if (activeView === 'mine') return item.sellerId === user?.id;
    return item.sellerId !== user?.id && item.status === 'active';
  });

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight">TechMarket</h2>
          <p className="text-muted-foreground mt-1 text-lg">Decentralized exchange for institutional neural assets.</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="buy" className="rounded-lg px-6 data-[state=active]:bg-primary">Acquire</TabsTrigger>
              <TabsTrigger value="mine" className="rounded-lg px-6 data-[state=active]:bg-primary">My Assets</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary rounded-xl px-6 h-12 shadow-lg shadow-primary/20"><Plus className="mr-2 size-5" /> New Listing</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 rounded-3xl p-8">
              <DialogHeader><DialogTitle>Transmit New Listing</DialogTitle></DialogHeader>
              <div className="grid gap-5 py-6">
                <div className="grid gap-2">
                   <Label>Asset Title</Label>
                   <Input dir="auto" placeholder="Technical name..." value={newListing.title} onChange={e => setNewListing({...newListing, title: e.target.value})} className="bg-white/5 border-white/10" />
                </div>
                <div className="grid gap-2">
                   <Label>Valuation (Credits)</Label>
                   <Input type="number" value={newListing.price} onChange={e => setNewListing({...newListing, price: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                </div>
                <div className="grid gap-2">
                   <Label>Category</Label>
                   <Select value={newListing.category} onValueChange={(v: any) => setNewListing({...newListing, category: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {CATEGORIES.filter(c => c.value !== 'all').map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddListing} className="w-full bg-primary h-12 rounded-xl font-bold">Authorize Publication</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input dir="auto" placeholder="Search neural assets..." className="w-full h-14 bg-white/5 border-white/10 rounded-2xl pl-12" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={(v: any) => setCategory(v)}>
          <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl">
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="size-12 animate-spin text-primary" /></div>
        ) : filteredItems.length === 0 ? (
          <EmptyState icon={Search} title="No Results Detected" description="Try adjusting your global scan parameters." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-indigo-500/40 transition-all">
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  <Image src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/600`} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <CardContent className="p-7">
                  <h3 dir="auto" className="text-xl font-bold text-white mb-2 line-clamp-1 text-right">{item.title}</h3>
                  <p className="text-2xl font-bold text-primary tracking-tighter text-right">{item.price?.toLocaleString()} Credits</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mt-4 text-right">{item.stockQuantity} Nodes Available</p>
                  {item.sellerId !== user?.id && <Button className="w-full mt-6 bg-primary rounded-xl h-12 font-bold">Acquire Asset</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
