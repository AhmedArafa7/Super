'use client';

import React from 'react';
import { Youtube, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { ChannelSuggestionForm } from './suggestion-form';
import { AdminChannelReview } from './admin-review';
import { useAuth } from "@/components/auth/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * [FEATURE: ContentCuration]
 * المكون الرئيسي لميزة تنسيق المحتوى الجماعي.
 * يجمع بين واجهة المستخدم وواجهة الإدارة بشكل موديلار.
 */
export function ContentCuration() {
  const { user } = useAuth();
  const isAdmin = ['founder', 'cofounder', 'admin', 'management'].includes(user?.role || '');

  return (
    <div className="h-full flex flex-col bg-slate-950/40 animate-in fade-in duration-700 overflow-hidden">
      {/* Header Area */}
      <header className="px-8 py-10 shrink-0 flex flex-col items-end relative overflow-hidden">
         <div className="absolute top-0 right-0 size-96 bg-primary/10 blur-[120px] -translate-y-1/2 translate-x-1/2" />
         
         <div className="relative z-10 flex items-center gap-6 flex-row-reverse mb-4">
            <div className="size-16 bg-gradient-to-br from-red-500 to-rose-700 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-red-500/20">
               <Youtube className="size-8" />
            </div>
            <div className="text-right">
               <h1 className="text-3xl font-black text-white tracking-tight mb-1">مركز إثراء المحتوى</h1>
               <div className="flex items-center gap-2 justify-end opacity-60">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em]">Community Curation Hub</span>
                  <div className="size-1 rounded-full bg-rose-500" />
               </div>
            </div>
         </div>
         <p className="text-sm text-muted-foreground text-right max-w-xl leading-relaxed relative z-10">
            ساهم في بناء أكبر مكتبة تعليمية وتقنية في الوطن العربي من خلال اقتراح قنواتك المفضلة ليتم مراجعتها وإضافتها للجميع.
         </p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden px-8 pb-12">
        {isAdmin ? (
          <Tabs defaultValue="suggest" dir="rtl" className="h-full flex flex-col">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl w-fit mx-auto mb-8">
              <TabsTrigger value="suggest" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary">اقتراح قناة</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-xl px-8 font-bold data-[state=active]:bg-indigo-600 gap-2">
                <ShieldCheck className="size-4" /> مراجعة الأدمن
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="suggest" className="h-full mt-0 focus-visible:outline-none">
                <div className="max-w-2xl mx-auto h-full">
                  <ChannelSuggestionForm />
                </div>
              </TabsContent>
              <TabsContent value="admin" className="h-full mt-0 focus-visible:outline-none">
                <div className="max-w-4xl mx-auto h-full">
                   <AdminChannelReview />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="max-w-2xl mx-auto pt-4">
             <div className="flex items-center gap-3 justify-center mb-8 text-amber-400 animate-pulse">
                <Sparkles className="size-5" />
                <span className="text-xs font-black uppercase tracking-widest">شاركنا شغفك الآن</span>
                <Heart className="size-5 fill-current" />
             </div>
             <ChannelSuggestionForm />
          </div>
        )}
      </main>
    </div>
  );
}
