'use client';

import React, { useState } from 'react';
import { Youtube, Send, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

/**
 * [COMPONENT: ChannelSuggestionForm]
 * مكوّن LEGO يسمح للمستخدم باقتراح قناة يوتيوب كاملة.
 * يمكن استخدامه في أي قسم داخل التطبيق.
 */
export function ChannelSuggestionForm() {
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // محاكاة إرسال البيانات لقاعدة البيانات
    const newSuggestion = {
      id: Date.now(),
      url,
      reason,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('Si-Neuro-channel-suggestions') || '[]');
    localStorage.setItem('Si-Neuro-channel-suggestions', JSON.stringify([...existing, newSuggestion]));

    setIsSubmitted(true);
    toast({ title: "تم إرسال اقتراحك", description: "سيقوم فريق الإدارة بمراجعة القناة قريباً." });
  };

  if (isSubmitted) {
    return (
      <Card className="bg-emerald-500/10 border-emerald-500/20 text-center p-8 rounded-[2rem] animate-in fade-in zoom-in duration-500">
        <div className="size-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="text-xl font-black text-emerald-400 mb-2">شكراً لمساهمتك!</h3>
        <p className="text-sm text-emerald-300/60 mb-6">اقتراحك قيد المراجعة الآن من قبل الأدمن.</p>
        <Button onClick={() => setIsSubmitted(false)} variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">إرسال اقتراح آخر</Button>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/40 border-white/5 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
      <CardHeader className="text-right pb-2">
        <div className="flex items-center justify-end gap-3 mb-2">
           <h2 className="text-xl font-black text-white">اقتراح قناة تعليمية</h2>
           <div className="size-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500"><Youtube className="size-5" /></div>
        </div>
        <CardDescription className="text-xs">هل تعرف قناة يوتيوب تقدم محتوى استثنائياً؟ شاركها معنا لإضافتها للمكتبة.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-right text-primary uppercase tracking-widest px-1">رابط القناة (YouTube URL)</p>
            <div className="relative">
              <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/@channelname" 
                className="bg-white/5 border-white/10 text-right h-12 pr-12 rounded-xl focus:ring-primary/20"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-right text-primary uppercase tracking-widest px-1">لماذا تقترح هذه القناة؟</p>
            <Textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="وصف مختصر لمحتوى القناة وفائدتها..." 
              className="bg-white/5 border-white/10 text-right min-h-[100px] rounded-xl focus:ring-primary/20"
            />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95">
             إرسال للاقتراح <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
