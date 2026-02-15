
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Lock, 
  Info, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  Loader2,
  RefreshCcw,
  AlertCircle,
  Clock,
  ExternalLink,
  RotateCw,
  XCircle,
  Repeat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { useWalletStore, selectTotalPendingDebt, PendingTransaction } from '@/lib/wallet-store';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export function WalletView() {
  const { user } = useAuth();
  const wallet = useWalletStore(state => state.wallet);
  const transactions = useWalletStore(state => state.transactions);
  const pendingTransactions = useWalletStore(state => state.pendingTransactions);
  const fetchWallet = useWalletStore(state => state.fetchWallet);
  const fetchTransactions = useWalletStore(state => state.fetchTransactions);
  const removePendingTransaction = useWalletStore(state => state.removePendingTransaction);
  const retryTransaction = useWalletStore(state => state.retryTransaction);
  const pendingDebt = useWalletStore(selectTotalPendingDebt);
  
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    await Promise.all([
      fetchWallet(user.id),
      fetchTransactions(user.id)
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePayLater = (tx: PendingTransaction) => {
    // In a real app, this would redirect to TechMarket or open MakeOfferModal
    removePendingTransaction(tx.id);
    toast({
      title: "Negotiation Pivot",
      description: `Acquisition of "${tx.title}" moved to Negotiation protocols.`,
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="size-4 text-green-400" />;
      case 'purchase_hold': return <Lock className="size-4 text-amber-400" />;
      case 'purchase_release': return <ShieldCheck className="size-4 text-indigo-400" />;
      case 'purchase_refund': return <ArrowDownCircle className="size-4 text-red-400" />;
      default: return <RefreshCcw className="size-4 text-muted-foreground" />;
    }
  };

  if (isLoading && !wallet) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const failedAcquisitions = pendingTransactions.filter(t => t.status === 'failed_needs_action');
  const activeSyncing = pendingTransactions.filter(t => t.status === 'pending_sync');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <WalletIcon className="text-primary" />
            Neural Wallet
          </h2>
          <p className="text-muted-foreground mt-1">Manage your digital credits and escrow holdings.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingDebt > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Badge variant="destructive" className="h-10 px-4 rounded-xl gap-2 animate-pulse cursor-pointer hover:bg-red-600 transition-colors">
                  <AlertCircle className="size-4" />
                  -{pendingDebt.toLocaleString()} [Sync Pending]
                </Badge>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem] sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Clock className="text-red-400" />
                    Offline Acquisition Queue
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Neural link drop detected during these transactions.
                  </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[500px] mt-4 pr-4">
                  <div className="space-y-6">
                    {failedAcquisitions.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold text-red-400 tracking-widest px-1">Resolution Required</p>
                        {failedAcquisitions.map((tx) => (
                          <div key={tx.id} className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm text-white">{tx.title}</p>
                                <p className="text-[10px] text-red-400 font-bold uppercase">{tx.errorReason || 'Refused by Node'}</p>
                              </div>
                              <p className="font-bold text-red-400">-{tx.price.toLocaleString()} Credits</p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-8 text-[10px] rounded-lg border-white/10"
                                onClick={() => user && retryTransaction(user.id, tx.id)}
                              >
                                <RotateCw className="size-3 mr-1" /> Retry
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-8 text-[10px] rounded-lg border-white/10"
                                onClick={() => handlePayLater(tx)}
                              >
                                <Repeat className="size-3 mr-1" /> Pay Later
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 text-[10px] rounded-lg text-red-400 hover:bg-red-500/10"
                                onClick={() => removePendingTransaction(tx.id)}
                              >
                                <XCircle className="size-3 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSyncing.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest px-1">Synchronizing</p>
                        {activeSyncing.map((tx) => (
                          <div key={tx.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between opacity-70">
                            <div>
                              <p className="font-bold text-sm">{tx.title}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</p>
                            </div>
                            <p className="font-bold text-white/60">-{tx.price.toLocaleString()} Credits</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5" onClick={loadData}>
            <RefreshCcw className="size-4 mr-2" />
            Sync Node
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 size-40 bg-primary/10 blur-[60px] -mr-20 -mt-20" />
          <CardHeader>
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Zap className="size-4" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white tracking-tighter">
                  {wallet?.balance.toLocaleString() || '0'}
                </span>
                <span className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Credits</span>
              </div>
              {pendingDebt > 0 && (
                <div className="text-red-400 text-sm font-bold flex items-center gap-1">
                  (-{pendingDebt.toLocaleString()} Pending)
                </div>
              )}
            </div>
            <div className="mt-8 flex gap-3">
              <Button className="flex-1 bg-primary text-white rounded-xl h-11">
                <CreditCard className="size-4 mr-2" />
                Add Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 size-40 bg-amber-500/10 blur-[60px] -mr-20 -mt-20" />
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <Lock className="size-4" />
              Frozen Holdings
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
                    <Info className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-white/10 max-w-[200px]">
                  <p className="text-xs">Credits held in Escrow for pending acquisitions. Released upon confirmation of receipt.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-amber-500 tracking-tighter">
                {wallet?.frozenBalance.toLocaleString() || '0'}
              </span>
              <span className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Credits</span>
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Secure Escrow Protocol Active
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <History className="text-indigo-400" />
            Neural Transactions
          </CardTitle>
          <CardDescription>Verified blockchain ledger of all node activity.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-white/5">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <History className="size-12 mb-4" />
                  <p>No transactions logged in the neural stack.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {tx.type.replace('_', ' ')} • {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-lg tracking-tight",
                        tx.amount > 0 ? "text-green-400" : tx.amount < 0 ? "text-red-400" : "text-indigo-400"
                      )}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-[9px] h-4 border-white/10 text-muted-foreground">
                        {tx.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
