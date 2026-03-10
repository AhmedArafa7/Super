'use client';

import React from 'react';
import {
  History, ArrowUpCircle, ArrowDownCircle, Lock,
  ShieldCheck, RefreshCcw, ArrowRightLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES, CurrencyCode, getCurrencyDef } from '@/lib/currency-store';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
}

interface WalletTransactionLogProps {
  transactions: Transaction[];
  filterCurrency: string;
  onFilterChange: (value: string) => void;
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'deposit': return <ArrowUpCircle className="size-4 text-green-400" />;
    case 'purchase_hold': return <Lock className="size-4 text-amber-400" />;
    case 'purchase_release': return <ShieldCheck className="size-4 text-indigo-400" />;
    case 'purchase_refund': return <ArrowDownCircle className="size-4 text-red-400" />;
    case 'conversion': return <ArrowRightLeft className="size-4 text-blue-400" />;
    default: return <RefreshCcw className="size-4 text-muted-foreground" />;
  }
}

export function WalletTransactionLog({ transactions, filterCurrency, onFilterChange }: WalletTransactionLogProps) {
  const filtered = filterCurrency === 'all'
    ? transactions
    : transactions.filter(tx => tx.currency === filterCurrency);

  return (
    <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between flex-row-reverse">
        <CardTitle className="text-xl font-bold flex items-center gap-3 flex-row-reverse">
          <History className="text-indigo-400" />
          سجل المعاملات
        </CardTitle>
        <Select value={filterCurrency} onValueChange={onFilterChange}>
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
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <History className="size-12 mb-4" />
                <p>لا توجد معاملات مسجلة.</p>
              </div>
            ) : (
              filtered.map((tx) => {
                const currDef = getCurrencyDef(tx.currency as CurrencyCode);
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
                        {tx.amount > 0 ? '+' : ''}{(tx.amount ?? 0).toLocaleString()}
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
  );
}
