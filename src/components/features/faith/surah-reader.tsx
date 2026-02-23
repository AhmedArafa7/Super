'use client';

import React from "react";
import { Loader2, Info, Share2, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ayah } from "@/lib/quran-store";

interface SurahReaderProps {
  surahName?: string;
  englishName?: string;
  ayahs: Ayah[] | null;
  isLoading: boolean;
  onClose: () => void;
}

/**
 * [STABILITY_ANCHOR: SURAH_READER_MUSHAF_V2.0]
 * واجهة القارئ بنمط المصحف التقليدي - تم تحسين الخطوط والتنسيق لتماثل المصحف المطبوع.
 */
export function SurahReader({ surahName, englishName, ayahs, isLoading, onClose }: SurahReaderProps) {
  return (
    <DialogContent className="max-w-5xl h-[90vh] bg-slate-950 border-white/10 rounded-[3rem] p-0 overflow-hidden flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.7)]">
      <DialogHeader className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="text-right">
            <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 justify-end">
              {surahName}
              <BookOpen className="size-6 text-primary" />
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">{englishName} • {ayahs?.length || 0} AYAHS</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-xl border-white/10 text-muted-foreground hover:text-white transition-all"><Share2 className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white/5 text-white"><X className="size-5" /></Button>
          </div>
        </div>
      </DialogHeader>
      
      <ScrollArea className="flex-1 bg-slate-900/50">
        <div className="min-h-full p-4 md:p-12 flex flex-col items-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <div className="relative">
                <Loader2 className="size-16 animate-spin text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-2 bg-primary rounded-full animate-ping" />
                </div>
              </div>
              <p className="text-muted-foreground font-bold tracking-widest uppercase text-[10px] animate-pulse">جاري استدعاء السجل السحابي...</p>
            </div>
          ) : (
            <div className="max-w-4xl w-full mushaf-page rounded-[2rem] p-8 md:p-16 border-8 border-double border-[#b19a6a]/20 shadow-2xl relative">
              {/* Decorative Frame */}
              <div className="absolute inset-4 border border-[#b19a6a]/10 pointer-events-none rounded-[1.5rem]" />
              
              <div className="relative z-10 text-center">
                {surahName !== 'الفاتحة' && (
                  <div className="mb-16">
                    <p className="text-5xl font-quran text-[#2c2c2c] mb-4 select-none opacity-90 leading-normal">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <div className="flex items-center justify-center gap-4 opacity-20">
                      <div className="h-px w-20 bg-[#b19a6a]" />
                      <div className="size-2 rotate-45 border border-[#b19a6a]" />
                      <div className="h-px w-20 bg-[#b19a6a]" />
                    </div>
                  </div>
                )}

                <div className="text-[#2c2c2c] leading-[3.2] text-3xl md:text-4xl text-right font-quran select-text transition-all tracking-normal">
                  {ayahs?.map((ayah) => (
                    <React.Fragment key={ayah.number}>
                      <span className="inline hover:text-primary transition-colors cursor-default">
                        {ayah.text}
                      </span>
                      <span className="ayah-number">
                        {ayah.numberInSurah}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-6 border-t border-white/5 bg-black/60 flex items-center justify-between gap-8 shrink-0 px-10 flex-row-reverse">
         <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
           <Info className="size-3" /> وضع المصحف نشط • Amiri Font Engine
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Cloud Sync Secure</span>
            </div>
         </div>
      </footer>
    </DialogContent>
  );
}