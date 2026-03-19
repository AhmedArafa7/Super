
"use client";

import React from "react";
import { Wallet, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FinancialLedgerProps {
  transactions: any[];
}

export function FinancialLedger({ transactions }: FinancialLedgerProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem] text-center w-full">
        <Wallet className="size-12 mb-4" />
        <p className="text-lg font-bold">لا توجد حركات مالية مسجلة</p>
      </div>
    );
  }

  return (
    <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between flex-row-reverse">
        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">سجل العمليات الكلي</h3>
        <Badge variant="outline" className="border-white/10 text-muted-foreground">{transactions.length} Transaction</Badge>
      </div>
      <ScrollArea className="h-[600px]">
        <div className="divide-y divide-white/5">
          {transactions.map(tx => (
            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse group">
              <div className="text-right">
                <p className="font-bold text-white text-sm group-hover:text-primary transition-colors">{tx.description}</p>
                <div className="flex items-center gap-2 justify-end mt-1 opacity-60">
                  {tx.currency && <Badge variant="outline" className="text-[8px] border-white/5 py-0 h-4">{tx.currency}</Badge>}
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">المستخدم: {tx.userId?.substring(0, 8) || "System"}</p>
                  <div className="size-1 rounded-full bg-white/20" />
                  <p className="text-[9px] text-muted-foreground flex items-center gap-1"><Clock className="size-2" /> {new Date(tx.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-left flex flex-col items-start gap-1">
                <p className={cn("font-black text-xl tracking-tighter", tx.amount > 0 ? "text-green-400" : "text-red-400")}>
                  {tx.amount > 0 ? '+' : ''}{(tx.amount ?? 0).toLocaleString()}
                </p>
                <Badge variant="outline" className="text-[8px] border-white/10 font-bold tracking-widest uppercase py-0">{tx.type}</Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
