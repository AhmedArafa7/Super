
"use client";

import React from "react";
import { Package, History, ShoppingBag, Clock as ClockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function OrdersHistory({ orders, isLoading }: any) {
  return (
    <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end">
          سجل الاستحواذ
          <History className="size-5 text-indigo-400" />
        </CardTitle>
        <CardDescription>سجل موثق لجميع عمليات المزامنة في المتجر.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="لا توجد عمليات استحواذ" description="لم تقم بإجراء أي عمليات شراء أو تبادل في المتجر بعد." className="py-20" />
          ) : (
            <div className="divide-y divide-white/5">
              {orders.map((order: any) => (
                <div key={order.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group flex-row-reverse">
                  <div className="text-right">
                    <p className="font-bold text-lg text-white">
                      {Math.abs(order.amount ?? 0).toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase">Credits</span>
                    </p>
                    <Badge variant="outline" className={cn(
                      "text-[9px] h-4 border-white/10",
                      order.type === 'purchase_hold' ? "text-amber-400" : "text-green-400"
                    )}>
                      {order.type === 'purchase_hold' ? 'إيداع تأمين' : 'مكتمل'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="text-right">
                      <p dir="auto" className="font-bold text-white text-sm">{order.description}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        {formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-white/5">
                      {order.type === 'purchase_hold' ? <ClockIcon className="size-4 text-amber-400" /> : <Package className="size-4 text-green-400" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
