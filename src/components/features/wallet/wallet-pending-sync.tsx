'use client';

import React from 'react';
import {
  AlertCircle, Clock, RotateCw, Repeat, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PendingTransaction } from '@/lib/wallet-store';
import { formatDistanceToNow } from 'date-fns';

interface WalletPendingSyncProps {
  pendingDebt: number;
  failedAcquisitions: PendingTransaction[];
  activeSyncing: PendingTransaction[];
  onRetry: (txId: string) => void;
  onPayLater: (tx: PendingTransaction) => void;
  onRemove: (txId: string) => void;
}

export function WalletPendingSync({
  pendingDebt, failedAcquisitions, activeSyncing,
  onRetry, onPayLater, onRemove
}: WalletPendingSyncProps) {
  if (pendingDebt <= 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="fixed bottom-8 left-8 z-50">
          <Badge variant="destructive" className="h-12 px-6 rounded-2xl gap-2 animate-bounce cursor-pointer text-sm font-bold shadow-xl">
            <AlertCircle className="size-5" />
            {(pendingDebt ?? 0).toLocaleString()} معاملة معلقة
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
                  <p className="font-bold text-red-400">-{(tx.price ?? 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 flex-row-reverse">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] rounded-lg border-white/10" onClick={() => onRetry(tx.id)}>
                    <RotateCw className="size-3 mr-1" /> إعادة
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] rounded-lg border-white/10" onClick={() => onPayLater(tx)}>
                    <Repeat className="size-3 mr-1" /> تأجيل
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-[10px] rounded-lg text-red-400" onClick={() => onRemove(tx.id)}>
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
                <p className="font-bold text-white/60">-{(tx.price ?? 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
