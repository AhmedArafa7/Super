"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, HardDrive, PlaySquare, Wallet, 
  ArrowRight, Sparkles, Layout, Eye, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FeatureHeader } from "@/components/ui/feature-header";
import { cn } from "@/lib/utils";

// V2 Components
import { VaultExplorerV2 } from "@/components/features/v2/vault-explorer-v2";
import { WeTubeV2 } from "@/components/features/v2/wetube-v2";
import { WalletViewV2 } from "@/components/features/v2/wallet-view-v2";

export default function V2PreviewPage() {
  const [activePreview, setActivePreview] = useState<'vault' | 'wetube' | 'wallet' | 'intro'>('intro');

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 md:p-12 overflow-hidden flex flex-col relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.08),transparent_50%)] pointer-events-none" />
      
      <FeatureHeader 
        title="Nexus V2: Staging Area"
        description="هنا يمكنك معاينة النسخ الاحترافية المطورة للمشروع قبل اعتمادها نهائياً."
        Icon={Sparkles}
        iconClassName="text-amber-400"
        action={
          <div className="flex gap-2">
            {activePreview !== 'intro' && (
              <Button variant="ghost" onClick={() => setActivePreview('intro')} className="rounded-xl gap-2 text-white/60 hover:text-white hover:bg-white/5">
                <Layout className="size-4" /> العودة للدليل
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 mt-8 relative z-10">
        {activePreview === 'intro' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <GlassCard variant="hover" className="p-8 space-y-6 flex flex-col h-full cursor-pointer group" onClick={() => setActivePreview('vault')}>
               <div className="size-16 rounded-[1.5rem] bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                  <HardDrive className="size-8 text-indigo-400" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold mb-2">Vault Explorer V2</h3>
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   تم توحيد عرض الملفات، إضافة نظام بحث ذكي يدعم العربية بطلاقة، وتحديث حالات المزامنة السحابية.
                 </p>
               </div>
               <div className="mt-auto pt-6 flex items-center justify-between text-indigo-400 font-bold">
                  <span>معاينة التطوير</span>
                  <ArrowRight className="size-5 group-hover:translate-x-2 transition-transform" />
               </div>
            </GlassCard>

            <GlassCard variant="hover" className="p-8 space-y-6 flex flex-col h-full cursor-pointer group" onClick={() => setActivePreview('wetube')}>
               <div className="size-16 rounded-[1.5rem] bg-red-600/20 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
                  <PlaySquare className="size-8 text-red-400" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold mb-2">WeTube Hub V2</h3>
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   تحسين تجربة المشاهدة، توحيد القوائم الجانبية، وإضافة حركات دخول (Transitions) تجعل الانتقال بين الفيديوهات أكثر سلاسة.
                 </p>
               </div>
               <div className="mt-auto pt-6 flex items-center justify-between text-red-400 font-bold">
                  <span>معاينة التطوير</span>
                  <ArrowRight className="size-5 group-hover:translate-x-2 transition-transform" />
               </div>
            </GlassCard>

            <GlassCard variant="hover" className="p-8 space-y-6 flex flex-col h-full cursor-pointer group" onClick={() => setActivePreview('wallet')}>
               <div className="size-16 rounded-[1.5rem] bg-emerald-600/20 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Wallet className="size-8 text-emerald-400" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold mb-2">Smart Wallet V2</h3>
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   إعادة تصميم واجهة التحويل وبروتوكولات فك التجميد بمظهر مالي احترافي فائق الدقة.
                 </p>
               </div>
               <div className="mt-auto pt-6 flex items-center justify-between text-emerald-400 font-bold">
                  <span>معاينة التطوير</span>
                  <ArrowRight className="size-5 group-hover:translate-x-2 transition-transform" />
               </div>
            </GlassCard>
          </div>
        ) : (
          <div className="w-full h-full min-h-[70vh] glass rounded-[3rem] border border-white/5 overflow-hidden animate-in zoom-in-95 duration-500 relative">
             <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary">
                <Eye className="size-3" /> Live Preview: {activePreview} v2.0
             </div>
             
             <div className="h-full overflow-y-auto custom-scrollbar">
                {activePreview === 'vault' && <VaultExplorerV2 hideSidebar={false} />}
                {activePreview === 'wetube' && <WeTubeV2 />}
                {activePreview === 'wallet' && <WalletViewV2 />}
             </div>
          </div>
        )}
      </div>

      <div className="mt-12 p-8 glass rounded-3xl border border-white/5 flex items-center justify-between flex-row-reverse animate-in fade-in duration-1000 relative overflow-hidden group">
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="text-right flex flex-col gap-1 relative z-10">
            <h4 className="font-bold text-xl flex items-center justify-end gap-2 text-white">
              جاهز للاعتماد؟
              <ShieldCheck className="size-5 text-primary" />
            </h4>
            <p className="text-sm text-muted-foreground">بعد التأكد من سلامة الميزات، يمكننا استبدال النسخ القديمة بالجديدة بضغطة واحدة.</p>
         </div>
         <Button 
           className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-10 font-bold shadow-xl shadow-primary/20 relative z-10 transition-all active:scale-95"
           onClick={() => alert("بعد موافقتك، سأقوم بتبديل الملفات الأصلية بالنسخة V2.")}
         >
           اعتماد التحديثات العالمية
         </Button>
      </div>
    </div>
  );
}
