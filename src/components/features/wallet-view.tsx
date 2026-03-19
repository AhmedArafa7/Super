
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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { useWalletStore, selectTotalPendingDebt, PendingTransaction, selectTotalRealBalance, selectTotalFakeBalance } from '@/lib/wallet-store';
import {
  CURRENCIES, REAL_CURRENCIES, CurrencyCode,
  getCurrencyDef, getUserUnfreezeRules, UserUnfreezeRule
} from '@/lib/currency-store';
import { toast } from '@/hooks/use-toast';

import { WalletCurrencyCard } from './wallet/wallet-currency-card';
import { WalletTransactionLog } from './wallet/wallet-transaction-log';
import { WalletPendingSync } from './wallet/wallet-pending-sync';

/**
 * [STABILITY_ANCHOR: WALLET_VIEW_V3.0]
 * عرض المحفظة المتعددة العملات — تم تقسيمه لمكونات فرعية.
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
  const [showFake, setShowFake] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [unfreezeRules, setUnfreezeRules] = useState<UserUnfreezeRule[]>([]);

  // Conversion state
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [convertFrom, setConvertFrom] = useState<CurrencyCode>('EGC_FAKE');
  const [convertTo, setConvertTo] = useState<CurrencyCode>('EGC');
  const [convertAmount, setConvertAmount] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    await Promise.all([
      fetchWallet(user.id),
      fetchTransactions(user.id)
    ]);
    const rules = await getUserUnfreezeRules(user.id);
    setUnfreezeRules(rules);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
      <div className="h-full flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalReal = selectTotalRealBalance(wallet);
  const totalFake = selectTotalFakeBalance(wallet);
  const displayCurrencies = showFake ? CURRENCIES : REAL_CURRENCIES;
  const failedAcquisitions = pendingTransactions.filter(t => t.status === 'failed_needs_action');
  const activeSyncing = pendingTransactions.filter(t => t.status === 'pending_sync');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3 justify-end">
            المحفظة الذكية
            <WalletIcon className="text-primary" />
          </h2>
          <p className="text-muted-foreground mt-1">إدارة عملاتك الرقمية والتحويلات بين المحافظ.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingDebt > 0 && (
            <Badge variant="destructive" className="h-10 px-4 rounded-xl gap-2 animate-pulse">
              <AlertCircle className="size-4" />
              -{(pendingDebt ?? 0).toLocaleString()} [Sync Pending]
            </Badge>
          )}
          <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 gap-2" onClick={() => setShowFake(!showFake)}>
            {showFake ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showFake ? 'إخفاء الداخلية' : 'عرض الداخلية'}
          </Button>
          <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5" onClick={loadData}>
            <RefreshCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Total Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-40 bg-primary/10 blur-[60px] -mr-20 -mt-20" />
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2 justify-end">
            إجمالي العملات الحقيقية <Zap className="size-3" />
          </p>
          <span className="text-4xl font-bold text-white tracking-tighter">{(totalReal ?? 0).toLocaleString()}</span>
        </Card>
        <Card className="glass border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-40 bg-indigo-500/10 blur-[60px] -mr-20 -mt-20" />
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2 justify-end">
            إجمالي العملات الداخلية <Coins className="size-3" />
          </p>
          <span className="text-4xl font-bold text-indigo-400 tracking-tighter">{(totalFake ?? 0).toLocaleString()}</span>
        </Card>
        <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex items-center justify-center">
          <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-l from-primary to-indigo-600 rounded-2xl h-16 px-10 font-bold text-lg shadow-xl shadow-primary/20 gap-3">
                <ArrowRightLeft className="size-5" />
                تحويل عملات
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white text-right">تحويل عملات</DialogTitle>
                <DialogDescription className="text-muted-foreground text-right text-sm">
                  حوّل بين العملات المتاحة. التحويل من الداخلية للحقيقية يخضع لشروط فك التجميد.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid gap-2">
                  <Label className="text-right text-xs font-bold">من عملة</Label>
                  <Select value={convertFrom} onValueChange={(v: any) => setConvertFrom(v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.icon} {c.nameAr} — رصيد: {wallet?.balances?.[c.code]?.toLocaleString() || 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <ChevronDown className="size-5 text-primary" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right text-xs font-bold">إلى عملة</Label>
                  <Select value={convertTo} onValueChange={(v: any) => setConvertTo(v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {CURRENCIES.filter(c => c.code !== convertFrom).map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.icon} {c.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right text-xs font-bold">الكمية</Label>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-center h-14 rounded-xl text-2xl font-bold text-white"
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
                  className="w-full h-14 bg-primary rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
                >
                  {isConverting ? <Loader2 className="size-5 animate-spin" /> : <><ArrowRightLeft className="size-5 mr-2" /> تأكيد التحويل</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* Currency Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

      {/* Transaction Log */}
      <WalletTransactionLog
        transactions={transactions}
        filterCurrency={filterCurrency}
        onFilterChange={setFilterCurrency}
      />

      {/* Pending Sync */}
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
