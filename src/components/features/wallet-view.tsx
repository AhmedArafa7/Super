
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
  XCircle,
  RotateCw,
  Repeat,
  ArrowRightLeft,
  Coins,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { useWalletStore, selectTotalPendingDebt, PendingTransaction, selectTotalRealBalance, selectTotalFakeBalance } from '@/lib/wallet-store';
import {
  CURRENCIES, REAL_CURRENCIES, FAKE_CURRENCIES, CurrencyCode, CurrencyDefinition,
  getCurrencyDef, getUserUnfreezeRules, UserUnfreezeRule, FakeCurrencyCode
} from '@/lib/currency-store';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

/**
 * [STABILITY_ANCHOR: WALLET_VIEW_V2.0]
 * عرض المحفظة المتعددة العملات مع لوحة التحويل وحالة التجميد.
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="size-4 text-green-400" />;
      case 'purchase_hold': return <Lock className="size-4 text-amber-400" />;
      case 'purchase_release': return <ShieldCheck className="size-4 text-indigo-400" />;
      case 'purchase_refund': return <ArrowDownCircle className="size-4 text-red-400" />;
      case 'conversion': return <ArrowRightLeft className="size-4 text-blue-400" />;
      default: return <RefreshCcw className="size-4 text-muted-foreground" />;
    }
  };

  const CURRENCY_COLORS: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
  };

  const CURRENCY_TEXT_COLORS: Record<string, string> = {
    emerald: 'text-emerald-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
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
  const filteredTransactions = filterCurrency === 'all'
    ? transactions
    : transactions.filter(tx => tx.currency === filterCurrency);

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
              -{pendingDebt.toLocaleString()} [Sync Pending]
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
          <span className="text-4xl font-bold text-white tracking-tighter">{totalReal.toLocaleString()}</span>
        </Card>
        <Card className="glass border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-40 bg-indigo-500/10 blur-[60px] -mr-20 -mt-20" />
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2 justify-end">
            إجمالي العملات الداخلية <Coins className="size-3" />
          </p>
          <span className="text-4xl font-bold text-indigo-400 tracking-tighter">{totalFake.toLocaleString()}</span>
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
        {displayCurrencies.map(currency => {
          const balance = wallet?.balances?.[currency.code] || 0;
          const frozen = wallet?.frozenBalances?.[currency.code] || 0;
          const colorClass = CURRENCY_COLORS[currency.color] || CURRENCY_COLORS.emerald;
          const textColor = CURRENCY_TEXT_COLORS[currency.color] || CURRENCY_TEXT_COLORS.emerald;

          // Get pending unfreeze conditions for fake currencies
          const pendingRules = currency.isFake
            ? unfreezeRules.filter(r => r.currencyCode === currency.code && r.status === 'pending')
            : [];

          return (
            <Card key={currency.code} className={cn(
              "glass border rounded-[2rem] overflow-hidden transition-all duration-300 hover:scale-[1.02] group relative",
              colorClass.replace('from-', 'border-').split(' ')[0]
            )}>
              <div className={cn("absolute inset-0 bg-gradient-to-b opacity-30", colorClass.split('border')[0])} />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between flex-row-reverse mb-4">
                  <span className="text-2xl">{currency.icon}</span>
                  {currency.isFake && (
                    <Badge className="bg-white/10 text-[8px] border-none text-white/60">داخلي</Badge>
                  )}
                </div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 text-right", textColor)}>
                  {currency.nameAr}
                </p>
                <p className="text-3xl font-bold text-white tracking-tighter text-right mb-1">
                  {balance.toLocaleString()}
                </p>
                {frozen > 0 && (
                  <div className="flex items-center gap-1 justify-end mt-2">
                    <Lock className="size-3 text-amber-400" />
                    <span className="text-[10px] text-amber-400 font-bold">{frozen.toLocaleString()} مجمّد</span>
                  </div>
                )}
                {pendingRules.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-3 flex items-center gap-1 justify-end cursor-help">
                          <AlertCircle className="size-3 text-red-400" />
                          <span className="text-[9px] text-red-400 font-bold">{pendingRules.length} شرط معلق للتحويل</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-white/10 max-w-[250px] text-right p-4">
                        <p className="text-xs font-bold mb-2">شروط فك التجميد المعلقة:</p>
                        {pendingRules.map(r => (
                          <p key={r.id} className="text-[10px] text-muted-foreground">• {r.conditionLabel}</p>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Transaction Log */}
      <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between flex-row-reverse">
          <CardTitle className="text-xl font-bold flex items-center gap-3 flex-row-reverse">
            <History className="text-indigo-400" />
            سجل المعاملات
          </CardTitle>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 rounded-xl h-9 text-xs">
              <SelectValue placeholder="فلترة بالعملة" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="all">كل العملات</SelectItem>
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.icon} {c.nameAr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <History className="size-12 mb-4" />
                  <p>لا توجد معاملات مسجلة.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const currDef = getCurrencyDef(tx.currency);
                  return (
                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group flex-row-reverse">
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className="size-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-sm">{tx.description}</p>
                          <div className="flex items-center gap-2 justify-end mt-0.5">
                            <Badge variant="outline" className="text-[8px] border-white/10 h-4 py-0">
                              {currDef?.icon} {tx.currency}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {tx.type.replace('_', ' ')} • {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
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
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pending Sync Dialog */}
      {pendingDebt > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <div className="fixed bottom-8 left-8 z-50">
              <Badge variant="destructive" className="h-12 px-6 rounded-2xl gap-2 animate-bounce cursor-pointer text-sm font-bold shadow-xl">
                <AlertCircle className="size-5" />
                {pendingDebt.toLocaleString()} معاملة معلقة
              </Badge>
            </div>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem] sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-row-reverse">
                <Clock className="text-red-400" />
                معاملات معلقة
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[500px] mt-4 pr-4">
              <div className="space-y-6">
                {failedAcquisitions.map((tx) => (
                  <div key={tx.id} className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="text-right">
                        <p className="font-bold text-sm text-white">{tx.title}</p>
                        <p className="text-[10px] text-red-400 font-bold uppercase">{tx.errorReason || 'فشل المعاملة'}</p>
                      </div>
                      <p className="font-bold text-red-400">-{tx.price.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 flex-row-reverse">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] rounded-lg border-white/10" onClick={() => user && retryTransaction(user.id, tx.id)}>
                        <RotateCw className="size-3 mr-1" /> إعادة
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] rounded-lg border-white/10" onClick={() => handlePayLater(tx)}>
                        <Repeat className="size-3 mr-1" /> تأجيل
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-[10px] rounded-lg text-red-400" onClick={() => removePendingTransaction(tx.id)}>
                        <XCircle className="size-3 mr-1" /> إلغاء
                      </Button>
                    </div>
                  </div>
                ))}
                {activeSyncing.map((tx) => (
                  <div key={tx.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between flex-row-reverse opacity-70">
                    <div className="text-right">
                      <p className="font-bold text-sm">{tx.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</p>
                    </div>
                    <p className="font-bold text-white/60">-{tx.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
