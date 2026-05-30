'use client';

import React, { useState, useEffect } from 'react';
import { Youtube, Check, X, ExternalLink, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: number;
  url: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

/**
 * [COMPONENT: AdminChannelReview]
 * لوحة تحكم خاصة للأدمن لمراجعة الاقتراحات.
 * مصممة لتكون موديلار تماماً وجاهزة للعرض في أي قسم إداري.
 */
export function AdminChannelReview() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('Si-Neuro-channel-suggestions');
    if (saved) setSuggestions(JSON.parse(saved));
  }, []);

  const handleAction = (id: number, action: 'approved' | 'rejected' | 'delete') => {
    let updated;
    if (action === 'delete') {
      updated = suggestions.filter(s => s.id !== id);
      toast({ title: "تم الحذف نهائياً", variant: "destructive" });
    } else {
      updated = suggestions.map(s => s.id === id ? { ...s, status: action } : s);
      toast({ title: action === 'approved' ? "تم قبول القناة" : "تم رفض الاقتراح" });
    }
    
    setSuggestions(updated);
    localStorage.setItem('Si-Neuro-channel-suggestions', JSON.stringify(updated));
  };

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="flex flex-col h-full bg-[#0d0f12]/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden animate-in fade-in duration-700">
      <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between flex-row-reverse bg-white/[0.02]">
         <div className="flex items-center gap-4 flex-row-reverse">
            <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
               <ShieldAlert className="size-5" />
            </div>
            <div className="text-right">
               <h2 className="text-lg font-black text-white">مراجعة اقتراحات القنوات</h2>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">لديك {pendingCount} طلبات معلقة</p>
            </div>
         </div>
         <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/10 px-4 h-7 rounded-full font-black text-[10px]">ADMIN CONTROL</Badge>
      </header>

      <ScrollArea className="flex-1">
         <div className="p-8 space-y-4">
            {suggestions.length === 0 ? (
               <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                  <Youtube className="size-16" />
                  <p className="font-bold">لا توجد اقتراحات حالياً</p>
               </div>
            ) : (
               suggestions.slice().reverse().map((item) => (
                  <Card key={item.id} className={cn(
                    "bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden transition-all hover:border-white/10 group",
                    item.status === 'approved' && "border-emerald-500/20 bg-emerald-500/5",
                    item.status === 'rejected' && "border-red-500/20 bg-red-500/5 opacity-60"
                  )}>
                    <CardContent className="p-6 flex items-start justify-between flex-row-reverse gap-6">
                       <div className="flex-1 text-right space-y-2">
                          <div className="flex items-center justify-end gap-3 flex-row-reverse">
                             <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-sm font-black text-indigo-400 hover:text-indigo-300 underline underline-offset-4 flex items-center gap-2"
                             >
                               {item.url} <ExternalLink className="size-3" />
                             </a>
                             <Badge className={cn(
                               "text-[8px] font-black uppercase tracking-tighter px-2 h-5 rounded-md",
                               item.status === 'pending' && "bg-amber-500/20 text-amber-500",
                               item.status === 'approved' && "bg-emerald-500/20 text-emerald-500",
                               item.status === 'rejected' && "bg-red-500/20 text-red-500",
                             )}>
                               {item.status}
                             </Badge>
                          </div>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed">{item.reason || 'لا يوجد وصف متاح.'}</p>
                          <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground pt-2">
                             <span>{new Date(item.timestamp).toLocaleDateString('ar-EG')}</span>
                             <Clock className="size-3" />
                          </div>
                       </div>

                       <div className="flex flex-col gap-2 shrink-0">
                          {item.status === 'pending' ? (
                             <>
                                <Button 
                                  onClick={() => handleAction(item.id, 'approved')}
                                  className="size-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                >
                                   <Check className="size-5" />
                                </Button>
                                <Button 
                                  onClick={() => handleAction(item.id, 'rejected')}
                                  variant="ghost"
                                  className="size-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white"
                                >
                                   <X className="size-5" />
                                </Button>
                             </>
                          ) : (
                             <Button 
                              onClick={() => handleAction(item.id, 'delete')}
                              variant="ghost"
                              className="size-10 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                             >
                                <Trash2 className="size-5" />
                             </Button>
                          )}
                       </div>
                    </CardContent>
                  </Card>
               ))
            )}
         </div>
      </ScrollArea>
    </div>
  );
}
