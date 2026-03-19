'use client';

import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CurrencyDefinition, UserUnfreezeRule } from '@/lib/currency-store';
import { cn } from '@/lib/utils';

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

interface WalletCurrencyCardProps {
  currency: CurrencyDefinition;
  balance: number;
  frozen: number;
  unfreezeRules: UserUnfreezeRule[];
}

export function WalletCurrencyCard({ currency, balance, frozen, unfreezeRules }: WalletCurrencyCardProps) {
  const colorClass = CURRENCY_COLORS[currency.color] || CURRENCY_COLORS.emerald;
  const textColor = CURRENCY_TEXT_COLORS[currency.color] || CURRENCY_TEXT_COLORS.emerald;
  const pendingRules = currency.isFake
    ? unfreezeRules.filter(r => r.currencyCode === currency.code && r.status === 'pending')
    : [];

  return (
    <Card className={cn(
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
          {(balance ?? 0).toLocaleString()}
        </p>
        {frozen > 0 && (
          <div className="flex items-center gap-1 justify-end mt-2">
            <Lock className="size-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-bold">{(frozen ?? 0).toLocaleString()} مجمّد</span>
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
}
