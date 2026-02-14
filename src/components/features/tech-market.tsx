
"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, Star, Zap, Cpu, ArrowRight, ShieldCheck, Heart, 
  Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Tag, 
  DollarSign, CheckCircle2, XCircle, Clock, MessageSquare,
  ChevronRight, Upload, Trash2, Package, History, Wallet, Lock,
  Loader2
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  getMarketItems, addMarketItem, addOffer, updateOfferStatus, deleteMarketItem,
  MarketItem, MarketOffer, PricingMode, ListingType, updateItemStatus
} from "@/lib/market-store";
import { getWallet, initiateEscrow, releaseEscrow } from "@/lib/wallet-store";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { cn } from "@/lib/utils";

const CURRENCIES = ["Credits", "EGP", "USD", "Nexus Points"];

export function TechMarket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [activeView, setActiveView] = useState<'buy' | 'sell' | 'mine' | 'orders'>('buy');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Listing Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    listingType: "sell_offer" as ListingType,
    pricingMode: "fixed" as PricingMode,
    price: 0,
    minPrice: 0,
    maxPrice: 0,
    currency: "Credits",
    image: ""
  });

  // Offer State
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [offerMessage, setOfferMessage] = useState("");

  const loadData = async () => {
    try {
      setItems(getMarketItems() ?? []);
      if (user?.id) {
        const wallet = await getWallet(user.id);
        setUserBalance(wallet?.balance ?? 0);
      }
    } catch (e) {
      console.error('Market data load failure:', e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('market-update', loadData);
    return () => window.removeEventListener('market-update', loadData);
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      return toast({ variant: "destructive", title: "Payload Overload", description: "Image exceeds 1.5MB limit." });
    }
    const reader = new FileReader();
    reader.onloadend = () => setNewListing(prev => ({ ...prev, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleCreateListing = () => {
    if (!user?.id) return;
    try {
      addMarketItem({
        ...newListing,
        ownerId: user.id,
        ownerName: user.name,
        image: newListing.image || PlaceHolderImages[Math.floor(Math.random() * (PlaceHolderImages?.length ?? 1))].imageUrl
      });
      toast({ title: "Neural Listing Active", description: "Your asset is now visible on the network." });
      setIsAddModalOpen(false);
      resetWizard();
    } catch (e) {
      toast({ variant: "destructive", title: "Listing Failure", description: "Could not synchronize asset with marketplace." });
    }
  };

  const handleBuyNow = async (item: MarketItem) => {
    if (!user?.id || isProcessing) return;
    if (item?.ownerId === user?.id) {
      return toast({ variant: "destructive", title: "Self-Sync Error", description: "You cannot acquire your own assets." });
    }
    
    const price = item?.pricingMode === 'fixed' ? item?.price ?? 0 : 0;
    if (price <= 0) return;

    setIsProcessing(true);
    try {
      // Hardening: Pre-flight liquidity check
      const currentWallet = await getWallet(user.id);
      const balance = currentWallet?.balance ?? 0;
      
      if (balance < price) {
        setIsProcessing(false);
        return toast({ variant: "destructive", title: "Credit Shortage", description: `Required: ${price}, Available: ${balance}` });
      }

      const res = await initiateEscrow(user.id, item.ownerId, price, item.id);
      if (res.success) {
        updateItemStatus(item.id, 'reserved', user.id);
        toast({ title: "Acquisition Initialized", description: "Credits reserved in Escrow. Link open." });
        loadData();
      } else {
        toast({ variant: "destructive", title: "Escrow Error", description: res.error ?? "Failed to reserve funds." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Neural Link Error", description: "Synchronous failure during fund reservation." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceipt = async (item: MarketItem) => {
    if (!user?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      const price = item?.price ?? 0;
      const success = await releaseEscrow(user.id, item.ownerId, price, item.id);
      if (success) {
        updateItemStatus(item.id, 'sold');
        toast({ title: "Acquisition Complete", description: "Credits released. Secure link closed." });
        loadData();
      } else {
        toast({ variant: "destructive", title: "Release Failure", description: "Could not finalize credit transfer." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to finalize escrow release." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeOffer = () => {
    if (!user?.id || !selectedItem) return;
    try {
      addOffer(selectedItem.id, {
        userId: user.id,
        userName: user.name,
        offerAmount,
        message: offerMessage
      });
      toast({ title: "Offer Transmitted", description: "Seller has been notified of your proposal." });
      setIsOfferModalOpen(false);
      setOfferAmount(0);
      setOfferMessage("");
    } catch (e) {
      toast({ variant: "destructive", title: "Transmission Failed", description: "Could not send offer." });
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setNewListing({
      title: "", description: "", listingType: "sell_offer", pricingMode: "fixed",
      price: 0, minPrice: 0, maxPrice: 0, currency: "Credits", image: ""
    });
  };

  const filteredItems = (items ?? []).filter(item => {
    if (activeView === 'mine') return item.ownerId === user?.id;
    if (activeView === 'orders') return item.buyerId === user?.id;
    if (activeView === 'buy') return item.listingType === 'sell_offer' && item.ownerId !== user?.id && item.status === 'active';
    if (activeView === 'sell') return item.listingType === 'buy_request' && item.ownerId !== user?.id && item.status === 'active';
    return true;
  });

  const renderPricing = (item: MarketItem) => {
    switch (item?.pricingMode) {
      case 'fixed': return `${item?.price ?? 0} ${item?.currency ?? 'Credits'}`;
      case 'range': return `${item?.minPrice ?? 0} - ${item?.maxPrice ?? 0} ${item?.currency ?? 'Credits'}`;
      case 'negotiable': return `Best Offer`;
      default: return 'Contact Seller';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight">TechMarket P2P</h2>
          <p className="text-muted-foreground mt-1 text-lg">Secure Escrow acquisitions and neural asset negotiation.</p>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="buy" className="rounded-lg px-6 data-[state=active]:bg-primary">Marketplace</TabsTrigger>
              <TabsTrigger value="sell" className="rounded-lg px-6 data-[state=active]:bg-primary">Wanted</TabsTrigger>
              <TabsTrigger value="mine" className="rounded-lg px-6 data-[state=active]:bg-primary">My Hub</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg px-6 data-[state=active]:bg-primary">My Orders</TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetWizard} className="bg-primary text-white hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20">
                <Plus className="mr-2 size-5" />
                Create Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 rounded-3xl overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Tag className="text-primary" />
                  Listing Wizard: Step {wizardStep}/3
                </DialogTitle>
                <DialogDescription>Configure your neural asset for the marketplace.</DialogDescription>
              </DialogHeader>

              <div className="py-6 min-h-[300px]">
                {wizardStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Label className="text-lg">What is your objective?</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant={newListing.listingType === 'sell_offer' ? 'default' : 'outline'}
                        className="h-24 rounded-2xl flex flex-col gap-2"
                        onClick={() => setNewListing({...newListing, listingType: 'sell_offer'})}
                      >
                        <ArrowUpRight className="size-6" />
                        <span>I want to SELL</span>
                      </Button>
                      <Button 
                        variant={newListing.listingType === 'buy_request' ? 'default' : 'outline'}
                        className="h-24 rounded-2xl flex flex-col gap-2"
                        onClick={() => setNewListing({...newListing, listingType: 'buy_request'})}
                      >
                        <ArrowDownLeft className="size-6" />
                        <span>I want to BUY</span>
                      </Button>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid gap-2">
                      <Label>Title</Label>
                      <Input 
                        placeholder="e.g. Quantum Processor v2" 
                        value={newListing.title}
                        onChange={e => setNewListing({...newListing, title: e.target.value})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Describe specs, etc." 
                        value={newListing.description}
                        onChange={e => setNewListing({...newListing, description: e.target.value})}
                        className="bg-white/5 border-white/10 h-32"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Asset Preview (Optional)</Label>
                      <div className="relative h-20 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                        {newListing.image ? (
                           <img src={newListing.image} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Upload className="size-4" />
                            Upload Base64 Payload
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid gap-2">
                      <Label>Currency</Label>
                      <Select value={newListing.currency} onValueChange={v => setNewListing({...newListing, currency: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900">
                          {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Pricing Mode</Label>
                      <Select value={newListing.pricingMode} onValueChange={(v: any) => setNewListing({...newListing, pricingMode: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-900">
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="range">Price Range</SelectItem>
                          <SelectItem value="negotiable">Negotiable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newListing.pricingMode === 'fixed' && (
                      <div className="grid gap-2">
                        <Label>Exact Price</Label>
                        <Input 
                          type="number" 
                          value={newListing.price}
                          onChange={e => setNewListing({...newListing, price: Number(e.target.value)})}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="bg-white/5 p-4 border-t border-white/5">
                {wizardStep > 1 && <Button variant="ghost" onClick={() => setWizardStep(prev => prev - 1)}>Back</Button>}
                {wizardStep < 3 ? (
                  <Button className="ml-auto bg-primary" onClick={() => setWizardStep(prev => prev + 1)}>
                    Continue <ChevronRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <Button className="ml-auto bg-green-600 hover:bg-green-500" onClick={handleCreateListing}>Authorize Listing</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
          {filteredItems.map((item) => (
            <Card key={item?.id ?? Math.random()} className={cn(
              "group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-primary/40 transition-all duration-500 flex flex-col relative shadow-2xl",
              item?.status === 'sold' && "opacity-60 grayscale",
              item?.status === 'reserved' && "border-amber-500/30 bg-amber-500/5"
            )}>
              <div className="relative aspect-square overflow-hidden bg-white/5">
                <Image src={item?.image || ""} alt={item?.title || "Asset"} fill className="object-contain p-8 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={cn(
                    "backdrop-blur-md border-white/10",
                    item?.listingType === 'sell_offer' ? "bg-indigo-600/60" : "bg-amber-600/60"
                  )}>
                    {item?.listingType === 'sell_offer' ? 'SALE' : 'WANTED'}
                  </Badge>
                  {item?.status === 'sold' && <Badge className="bg-red-600">SOLD</Badge>}
                  {item?.status === 'reserved' && <Badge className="bg-amber-600">IN ESCROW</Badge>}
                </div>
              </div>

              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{item?.ownerName ?? 'Unknown'}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{item?.title ?? 'Untitled Asset'}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1 italic">"{item?.description ?? 'No description.'}"</p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Pricing</p>
                      <p className="text-xl font-bold text-white tracking-tight">{renderPricing(item)}</p>
                    </div>
                    <div className="size-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                      <Zap className="size-5 text-primary" />
                    </div>
                  </div>

                  {activeView === 'mine' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-primary mb-2">
                        <span>Offers Received</span>
                        <Badge variant="outline">{(item?.offers ?? []).length}</Badge>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl h-11 text-xs">
                             Manage Listing & Offers
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-white/10 rounded-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Neural Negotiations</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[400px] pr-4 mt-6">
                            <div className="space-y-4">
                              {(item?.offers ?? []).length === 0 ? (
                                <div className="p-12 text-center glass rounded-2xl opacity-50">
                                  <Clock className="size-12 mx-auto mb-4" />
                                  <p>No offers transmitted.</p>
                                </div>
                              ) : (
                                (item?.offers ?? []).map((offer) => (
                                  <div key={offer?.id} className="p-4 glass border border-white/5 rounded-2xl flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-sm">{offer?.userName}</p>
                                      <p className="text-xl font-bold text-white">{offer?.offerAmount} {item?.currency}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      {offer?.status === 'pending' && (
                                        <>
                                          <Button size="icon" variant="ghost" className="text-red-400" onClick={() => updateOfferStatus(item!.id, offer.id, 'rejected')}><XCircle className="size-4" /></Button>
                                          <Button size="icon" className="bg-green-600" onClick={() => updateOfferStatus(item!.id, offer.id, 'accepted')}><CheckCircle2 className="size-4" /></Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                          <DialogFooter className="mt-6 border-t border-white/5 pt-4">
                            <Button variant="ghost" className="text-red-400" onClick={() => deleteMarketItem(item!.id)}>Delete Listing</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : activeView === 'orders' ? (
                    <div className="space-y-2">
                       {item?.status === 'reserved' ? (
                         <Button 
                           disabled={isProcessing}
                           className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11"
                           onClick={() => handleConfirmReceipt(item!)}
                         >
                            {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4 mr-2" />}
                            Confirm Receipt
                         </Button>
                       ) : (
                         <Button disabled className="w-full bg-white/5 text-muted-foreground rounded-xl h-11">
                            {(item?.status ?? 'N/A').toUpperCase()}
                         </Button>
                       )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {item?.pricingMode === 'fixed' && (
                        <Button 
                          disabled={item?.status !== 'active' || isProcessing}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl h-11"
                          onClick={() => handleBuyNow(item!)}
                        >
                          {isProcessing ? <Loader2 className="size-4 animate-spin" /> : 'Buy Now'}
                        </Button>
                      )}
                      <Button 
                        disabled={item?.status !== 'active' || isProcessing}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl h-11"
                        onClick={() => { setSelectedItem(item); setIsOfferModalOpen(true); }}
                      >
                        {item?.listingType === 'sell_offer' ? 'Offer' : 'Quote'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Transmit Offer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Offer Amount ({selectedItem?.currency ?? 'Credits'})</Label>
              <Input type="number" className="bg-white/5 h-12 rounded-xl" value={offerAmount} onChange={e => setOfferAmount(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label>Note</Label>
              <Textarea placeholder="Message..." className="bg-white/5 h-24 rounded-xl" value={offerMessage} onChange={e => setOfferMessage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-primary h-12 rounded-xl" onClick={handleMakeOffer}>Send Proposal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
