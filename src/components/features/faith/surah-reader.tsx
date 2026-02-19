
'use client';

import React from "react";
import { Loader2, Info, Share2, X } from "lucide-react";
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
 * [STABILITY_ANCHOR: SURAH_READER_NODE_V1.0]
 * عقدة القراءة المستقلة - ملف مخصص لمعالجة عرض النص القرآني وتفاعلات القارئ.
 */
export function SurahReader({ surahName, englishName, ayahs, isLoading, onClose }: SurahReaderProps) {
  return (
    <DialogContent className="max-w-4xl h-[85vh] bg-slate-950 border-white/10 rounded-[3rem] p-0 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <DialogHeader className="p-8 border-b border-white/5 bg-slate-900/50 shrink-0">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="text-right">
            <DialogTitle className="text-3xl font-black text-white">{surahName}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{englishName} • {ayahs?.length || 0} آية</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl border-white/10 text-muted-foreground hover:text-white"><Share2 className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white/5"><X className="size-5" /></Button>
          </div>
        </div>
      </DialogHeader>
      
      <ScrollArea className="flex-1 p-8 md:p-12">
        <div className="max-w-3xl mx-auto space-y-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">جاري استدعاء النص من السجل السحابي...</p>
            </div>
          ) : (
            <div className="text-center">
              {surahName !== 'الفاتحة' && (
                <p className="text-4xl font-serif text-amber-200/80 mb-16 select-none">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              )}
              <div className="space-y-10">
                {ayahs?.map((ayah) => (
                  <div key={ayah.number} className="relative group">
                    <p className="text-3xl md:text-4xl text-white leading-[2.8] text-right font-serif transition-all group-hover:text-primary/90">
                      {ayah.text}
                      <span className="inline-flex items-center justify-center size-10 rounded-full border border-primary/20 text-xs font-bold text-primary ml-4 align-middle font-sans">
                        {ayah.numberInSurah}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-center gap-8 shrink-0">
         <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
           <Info className="size-3" /> التصفح مدعوم ببروتوكول القراءة السحابي المباشر
         </div>
      </footer>
    </DialogContent>
  );
}
