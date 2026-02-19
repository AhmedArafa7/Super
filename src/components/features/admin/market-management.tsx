
"use client";

import React from "react";
import { ShoppingBag, Tag, Repeat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MarketManagementProps {
  offers: any[];
}

export function MarketManagement({ offers }: MarketManagementProps) {
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem] text-center w-full">
        <Tag className="size-12 mb-4" />
        <p className="text-lg font-bold">لا توجد مفاوضات تجارية نشطة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map(o => (
        <Card key={o.id} className="p-8 glass border-white/10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-500/30 transition-all shadow-xl">
          <div className="text-right space-y-2 flex-1">
            <h4 className="font-bold text-white text-lg">{o.itemTitle}</h4>
            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
              من: <span className="text-indigo-400">@{o.buyerName}</span> &rarr; إلى المالك: <span className="text-indigo-400">@{o.sellerId.substring(0,8)}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <Badge className={cn(
                "px-4 py-1.5 rounded-xl font-black",
                o.type === 'price' ? "bg-indigo-600" : "bg-amber-600"
              )}>
                {o.type === 'price' ? (
                  <span className="flex items-center gap-2"><Tag className="size-3" /> {o.value} Credits</span>
                ) : (
                  <span className="flex items-center gap-2"><Repeat className="size-3" /> Neural Swap</span>
                )}
              </Badge>
              <Badge variant="outline" className="border-white/10 uppercase text-[8px] font-bold tracking-widest">{o.status}</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
