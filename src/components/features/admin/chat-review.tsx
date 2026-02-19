
"use client";

import React, { useState } from "react";
import { MessageSquare, CheckCircle2, XCircle, Pencil, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { approveMessage, rejectMessage } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

interface ChatReviewProps {
  messages: any[];
  onRefresh: () => void;
}

export function ChatReview({ messages, onRefresh }: ChatReviewProps) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, string>>({});

  const handleApprove = async (m: any) => {
    try {
      await approveMessage(m.id, m.userId, responses[m.id] ?? m.response ?? "");
      toast({ title: "تم الاعتماد", description: "تمت مزامنة الرد بنجاح." });
      onRefresh();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل العملية" });
    }
  };

  const handleReject = async (m: any) => {
    try {
      await rejectMessage(m.id, m.userId);
      toast({ title: "تم الرفض" });
      onRefresh();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل العملية" });
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem] text-center w-full">
        <MessageSquare className="size-12 mb-4" />
        <p className="text-lg font-bold">لا توجد رسائل للمراجعة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((m) => (
        <Card key={m.id} className="glass border-white/10 rounded-[2.5rem] p-8 space-y-6 hover:border-indigo-500/20 transition-all shadow-xl">
          <div className="flex justify-between items-center flex-row-reverse">
            <div className="flex items-center gap-4 flex-row-reverse text-right">
              <div className="size-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/10">{(m.userName || "?").charAt(0)}</div>
              <div>
                <p className="font-bold text-base text-white">@{m.userName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(m.timestamp).toLocaleString()}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn(
              "text-[9px] uppercase tracking-tighter px-3",
              m.status === 'replied' ? "border-green-500/20 text-green-400" : "border-amber-500/20 text-amber-400"
            )}>{m.status}</Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3 text-right">
              <Label className="text-[10px] text-muted-foreground uppercase font-black px-1 tracking-[0.2em]">الرسالة الأصلية</Label>
              <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-sm italic text-slate-300 leading-relaxed shadow-inner">"{m.originalText}"</div>
            </div>
            <div className="space-y-3 text-right">
              <Label className="text-[10px] text-indigo-400 uppercase font-black px-1 tracking-[0.2em]">الرد المقترح عصبياً</Label>
              <Textarea 
                dir="auto" 
                value={responses[m.id] ?? m.response || ""} 
                onChange={(e) => setResponses({...responses, [m.id]: e.target.value})} 
                className="bg-white/5 border-white/10 rounded-2xl text-sm min-h-[120px] text-right focus-visible:ring-indigo-500 leading-relaxed" 
              />
            </div>
          </div>
          
          <div className="flex gap-4 flex-row-reverse pt-4 border-t border-white/5">
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold h-12 shadow-lg shadow-indigo-600/20" onClick={() => handleApprove(m)}>
              <CheckCircle2 className="mr-2 size-4" /> اعتماد الرد
            </Button>
            <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl h-12 px-8" onClick={() => handleReject(m)}>
              <XCircle className="mr-2 size-4" /> رفض
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
