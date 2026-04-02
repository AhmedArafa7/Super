'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  ArrowRightLeft,
  Zap,
  Loader2,
  RefreshCcw,
  AlertCircle,
  Coins,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { useWalletStore, selectTotalPendingDebt, PendingTransaction, selectTotalRealBalance, selectTotalsaveBalance } from '@/lib/wallet-store';
import {
  CURRENCIES, REAL_CURRENCIES, CurrencyCode,
  getCurrencyDef, getUserUnfreezeRules, UserUnfreezeRule
} from '@/lib/currency-store';
import { toast } from '@/hooks/use-toast';

import { FeatureHeader } from '@/components/ui/feature-header';
import { GlassCard } from '@/components/ui/glass-card';

import { WalletCurrencyCard } from './wallet/wallet-currency-card';
import { WalletTransactionLog } from './wallet/wallet-transaction-log';
import { WalletPendingSync } from './wallet/wallet-pending-sync';

/**
 * [STABILITY_ANCHOR: WALLET_VIEW_V3.0_MERGED]
 * عرض المحفظة المتعددة العملات المطورة — Nexus V2
 */
export function WalletView() {
  const { user } = useAuth();
  const wallet = useWalletStore(state => state.wallet);
  const transactions = useWalletStore(state => state.transactions);
  const pendingTransactions = useWalletStore(state => state.pendingTransactions);
  const fetchWallet = useWalletStore(state => state.fetchWallet);
  const fetchTransactions = useWalletStore(state => state.fetchTransactions);
  const convertCurrency = useWalletStore(state => state.convertCurrency);
  const removePendingTransaction = useWalletStore(state => state.removePendingTransaction);
  const retryTransaction = useWalletStore(state => state.retryTransaction);
  const pendingDebt = useWalletStore(selectTotalPendingDebt);

  const [isLoading, setIsLoading] = useState(true);
  const [showsave, setShowsave] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [unfreezeRules, setUnfreezeRules] = useState<UserUnfreezeRule[]>([]);

  // Conversion state
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [convertFrom, setConvertFrom] = useState<CurrencyCode>('EGC_save');
  const [convertTo, setConvertTo] = useState<CurrencyCode>('EGC');
  const [convertAmount, setConvertAmount] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await Promise.all([
        fetchWallet(user.id),
        fetchTransactions(user.id)
      ]);
      const rules = await getUserUnfreezeRules(user.id);
      setUnfreezeRules(rules);
    } catch (e) {
      console.error("Wallet Load Error", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchWallet, fetchTransactions]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleConvert = async () => {
    if (!user || !convertAmount || Number(convertAmount) <= 0) return;
    setIsConverting(true);
    const success = await convertCurrency(user.id, convertFrom, convertTo, Number(convertAmount));
    if (success) {
      toast({ title: 'تم التحويل بنجاح', description: `تم تحويل ${convertAmount} من ${getCurrencyDef(convertFrom)?.nameAr} إلى ${getCurrencyDef(convertTo)?.nameAr}.` });
      setIsConvertOpen(false);
      setConvertAmount('');
    }
    setIsConverting(false);
  };

  const handlePayLater = (tx: PendingTransaction) => {
    removePendingTransaction(tx.id);
    toast({ title: "Negotiation Pivot", description: `Acquisition of "${tx.title}" moved to Negotiation protocols.` });
  };

  if (isLoading && !wallet) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-700">
         <div className="size-16 border-4 border-primary/20 rounded-full" />
         <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute" />
         <p className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mt-20">Syncing Multi-Currency Ledger</p>
      </div>
    );
  }

  const totalReal = selectTotalRealBalance(wallet);
  const totalsave = selectTotalsaveBalance(wallet);
  const displayCurrencies = showsave ? CURRENCIES : REAL_CURRENCIES;
  const failedAcquisitions = pendingTransactions.filter(t => t.status === 'failed_needs_action');
  const activeSyncing = pendingTransactions.filter(t => t.status === 'pending_sync');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans text-right">
      <FeatureHeader 
        title="المحفظة الذكية"
        description="إدارة عملاتك الرقمية والتحويلات بين المحافظ."
        Icon={WalletIcon}
        onRefresh={loadData}
        isRefreshing={isLoading}
        action={
          <div className="flex items-center gap-3">
            {pendingDebt > 0 && (
              <Badge variant="destructive" className="h-11 px-4 rounded-xl gap-2 border-red-500/20 bg-red-500/10 text-red-400 animate-pulse">
                <AlertCircle className="size-4" />
                -{(pendingDebt ?? 0).toLocaleString()} [Sync Pending]
              </Badge>
            )}
            <Button 
              variant="outline" 
              className="h-11 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 gap-3 font-bold" 
              onClick={() => setShowsave(!showsave)}
            >
              {showsave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showsave ? 'إخفاء الداخلية' : 'عرض الداخلية'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlassCard variant="default" className="relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative z-10 space-y-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 justify-end mb-4">
              إجمالي العملات الحقيقية <Zap className="size-3" />
            </p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{(totalReal ?? 0).toLocaleString()}</span>
              <span className="text-xs text-primary/60 font-bold">CREDITS</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">NET SETTLED VALUE</p>
          </div>
        </GlassCard>

        <GlassCard variant="default" className="relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 size-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative z-10 space-y-2">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 justify-end mb-4">
              إجمالي العملات الداخلية <Coins className="size-3" />
            </p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tighter">{(totalsave ?? 0).toLocaleString()}</span>
              <span className="text-xs text-indigo-400/60 font-bold">V-UNIT</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">INTERNAL VIRTUAL BALANCE</p>
          </div>
        </GlassCard>

        <GlassCard variant="hover" className="flex items-center justify-center border-primary/20 bg-primary/5">
          <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-l from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 rounded-[1.5rem] h-20 px-12 font-bold text-xl shadow-2xl shadow-primary/30 gap-4 group transition-all active:scale-95">
                <ArrowRightLeft className="size-6 group-hover:rotate-180 transition-transform duration-500" />
                تحويل عملات
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-10 text-right sm:max-w-md shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-white text-right">محول العملات</DialogTitle>
                <DialogDescription className="text-muted-foreground text-right text-sm leading-relaxed mt-2">
                  حوّل بين العملات المتاحة. التحويل من الحسابات الداخلية يخضع لبروتوكولات فك التجميد.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest block">المصدر (من)</Label>
                  <Select value={convertFrom} onValueChange={(v: any) => setConvertFrom(v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-14 rounded-2xl focus:ring-primary/40"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 text-white">
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.icon} {c.nameAr} — رصيد: {wallet?.balances?.[c.code]?.toLocaleString() || 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center -my-3 relative z-10">
                   <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center border-2 border-white/10 text-primary shadow-xl">
                    <ChevronDown className="size-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest block">الهدف (إلى)</Label>
                  <Select value={convertTo} onValueChange={(v: any) => setConvertTo(v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-14 rounded-2xl focus:ring-primary/40"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 text-white">
                      {CURRENCIES.filter(c => c.code !== convertFrom).map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.icon} {c.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest block">الكمية المراد تحويلها</Label>
                  <Input
                    type="number"
                    dir="auto"
                    className="bg-white/5 border-white/10 text-center h-16 rounded-2xl text-3xl font-black text-white focus-visible:ring-primary/40"
                    placeholder="0"
                    value={convertAmount}
                    onChange={e => setConvertAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleConvert}
                  disabled={isConverting || !convertAmount || Number(convertAmount) <= 0}
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 transition-all active:scale-95"
                >
                  {isConverting ? <Loader2 className="size-6 animate-spin" /> : <><ArrowRightLeft className="size-5 mr-3" /> تأكيد التحويل البروتوكولي</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {displayCurrencies.map(currency => (
          <WalletCurrencyCard
            key={currency.code}
            currency={currency}
            balance={wallet?.balances?.[currency.code] || 0}
            frozen={wallet?.frozenBalances?.[currency.code] || 0}
            unfreezeRules={unfreezeRules}
          />
        ))}
      </div>

      <WalletTransactionLog
        transactions={transactions}
        filterCurrency={filterCurrency}
        onFilterChange={setFilterCurrency}
      />

      <WalletPendingSync
        pendingDebt={pendingDebt}
        failedAcquisitions={failedAcquisitions}
        activeSyncing={activeSyncing}
        onRetry={(txId) => user && retryTransaction(user.id, txId)}
        onPayLater={handlePayLater}
        onRemove={removePendingTransaction}
      />
    </div>
  );
}
