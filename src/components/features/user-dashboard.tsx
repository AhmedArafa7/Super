
"use client";

import React, { useState, useEffect } from "react";
import { User, Package, Shield, Upload, Loader2, CheckCircle2, ShoppingBag, History, CreditCard, MessageSquare, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/auth-store";
import { getTransactions, Transaction } from "@/lib/wallet-store";
import { getReceivedOffers } from "@/lib/market-store";
import { EmptyState } from "@/components/ui/empty-state";
import { OffersReceived } from "./offers-received";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
      loadOffersCount();
    }
  }, [user?.id]);

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const allTx = await getTransactions(user!.id);
      const purchaseTxs = allTx.filter(tx => 
        tx.type === 'purchase_hold' || tx.type === 'purchase_release' || tx.type === 'purchase_refund'
      );
      setOrders(purchaseTxs);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadOffersCount = async () => {
    if (!user?.id) return;
    try {
      const offers = await getReceivedOffers(user.id);
      setPendingOffersCount(offers.filter(o => o.status === 'pending').length);
    } catch (err) {
      console.error("Failed to load offers count", err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id || !displayName.trim()) return;
    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { name: displayName });
      toast({ title: "Profile Updated", description: "Your neural identity has been synchronized." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <User className="text-primary" />
            Node Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">Manage your neural identity, acquisitions, and business center.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">
            <User className="size-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none relative">
            <Briefcase className="size-4 mr-2" />
            Business Center
            {pendingOffersCount > 0 && (
              <Badge className="ml-2 bg-red-500 h-4 w-4 p-0 flex items-center justify-center text-[8px] rounded-full">
                {pendingOffersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">
            <Package className="size-4 mr-2" />
            My Orders
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">
            <Shield className="size-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="size-32 rounded-[2.5rem] bg-indigo-500/10 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                  <User className="size-12 text-muted-foreground" />
                </div>
              </div>
              <h3 dir="auto" className="text-xl font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">@{user?.username}</p>
              <Badge variant="outline" className="mt-4 border-indigo-500/30 text-indigo-400 capitalize">{user?.role} Node</Badge>
            </Card>

            <Card className="lg:col-span-2 glass border-white/5 rounded-[2.5rem] p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Neural Settings</CardTitle>
                <CardDescription>Update your public node information.</CardDescription>
              </CardHeader>
              <div className="space-y-6 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    dir="auto"
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Neural ID (Username)</Label>
                  <Input 
                    id="username" 
                    value={user?.username} 
                    disabled 
                    className="bg-white/5 border-white/10 h-12 rounded-xl opacity-50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Neural IDs are static and cannot be modified.</p>
                </div>
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating || displayName === user?.name}
                  className="bg-primary rounded-xl h-12 px-8 shadow-lg shadow-primary/20"
                >
                  {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                  Synchronize Profile
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="animate-in fade-in duration-500">
           <OffersReceived />
        </TabsContent>

        <TabsContent value="orders">
          <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5 text-indigo-400" />
                Acquisition Ledger
              </CardTitle>
              <CardDescription>Historical record of Marketplace synchronizations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
                ) : orders.length === 0 ? (
                  <EmptyState 
                    icon={ShoppingBag}
                    title="No Acquisitions Found"
                    description="You haven't initialized any asset acquisitions in the Marketplace yet."
                    className="py-20"
                  />
                ) : (
                  <div className="divide-y divide-white/5">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-white/5">
                            {order.type === 'purchase_hold' ? <Clock className="size-4 text-amber-400" /> : <Package className="size-4 text-green-400" />}
                          </div>
                          <div>
                            <p dir="auto" className="font-bold text-white text-sm text-right">{order.description}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 text-right">
                              {order.type.replace('_', ' ')} • {formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-white">
                            {Math.abs(order.amount).toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase">Credits</span>
                          </p>
                          <Badge variant="outline" className={cn(
                            "text-[9px] h-4 border-white/10",
                            order.type === 'purchase_hold' ? "text-amber-400" : "text-green-400"
                          )}>
                            {order.type === 'purchase_hold' ? 'IN ESCROW' : 'COMPLETED'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="glass border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold text-white mb-6">Security & Node Access</h3>
            <div className="space-y-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Neural Encryption</p>
                  <p className="text-xs text-muted-foreground">E2EE protocol active for all transactions.</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400">SECURE</Badge>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Hardware key verification recommended.</p>
                </div>
                <Button variant="outline" className="rounded-xl border-white/10 text-xs">Enable 2FA</Button>
              </div>
              <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-red-400">Retract Neural Link</p>
                  <p className="text-xs text-muted-foreground">Permanently deactivate this node and clear local cache.</p>
                </div>
                <Button variant="destructive" className="rounded-xl text-xs">Deactivate Node</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
