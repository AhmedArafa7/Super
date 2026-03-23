
'use client';

import React, { useState } from "react";
import { Loader2, Info, X, BookOpen, ZoomIn, ZoomOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Ayah } from "@/lib/quran-store";
import { cn } from "@/lib/utils";

interface SurahReaderProps {
  surahId?: number;
  surahName?: string;
  englishName?: string;
  ayahs: Ayah[] | null;
  isLoading: boolean;
  onClose: () => void;
}

/**
 * [STABILITY_ANCHOR: SURAH_READER_MUSHAF_V5.0]
 * واجهة القارئ بنمط المصحف - تم دمج التفسير الميسر الموثوق.
 */
export function SurahReader({ surahId, surahName, englishName, ayahs, isLoading, onClose }: SurahReaderProps) {
  const [fontSize, setFontSize] = useState(32);
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);

  // البسملة الرسمية في الرسم العثماني (Uthmani Script) كما تظهر في API
  const BISMILLAH_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  const renderAyahs = () => {
    if (!ayahs || ayahs.length === 0) return null;

    return ayahs.map((ayah, index) => {
      let textToDisplay = ayah.text;
      let displayText = textToDisplay; // Initialize displayText

      // بروتوكول عزل البسملة بَصرياً من متن الآية الأولى
      if (surahId !== 1 && surahId !== 9 && index === 0) {
        if (textToDisplay.startsWith(BISMILLAH_UTHMANI)) {
          textToDisplay = textToDisplay.substring(BISMILLAH_UTHMANI.length).trim();
          displayText = textToDisplay;
        }
      }

      return (
        <React.Fragment key={ayah.number}>
          <span 
            onClick={() => setSelectedAyah(ayah)}
            className={cn(
              "inline hover:bg-primary/10 transition-all cursor-pointer rounded-lg px-1",
              selectedAyah?.number === ayah.number && "bg-primary/20 text-primary shadow-sm"
            )}
          >
            {textToDisplay}
          </span>
          <span className="ayah-number">
            {ayah.numberInSurah}
          </span>
        </React.Fragment>
      );
    });
  };

  const shouldShowHeaderBismillah = surahId !== 9;

  return (
    <DialogContent className="max-w-5xl h-[90vh] bg-slate-950 border-white/10 rounded-[3rem] p-0 overflow-hidden flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.7)] outline-none">
      <DialogHeader className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="text-right">
            <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 justify-end">
              {surahName}
              <BookOpen className="size-6 text-primary" />
            </DialogTitle>
            <div className="flex items-center gap-2 justify-end mt-1">
              <Badge variant="outline" className="text-[8px] opacity-60 uppercase">{englishName}</Badge>
              <Badge className="bg-primary/20 text-primary text-[8px]">{ayahs?.length || 0} AYAHS</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <ZoomOut className="size-4 text-muted-foreground" />
              <Slider 
                value={[fontSize]} 
                min={20} 
                max={64} 
                step={2} 
                onValueChange={([val]) => setFontSize(val)}
                className="w-32"
              />
              <ZoomIn className="size-4 text-muted-foreground" />
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white/5 text-white"><X className="size-5" /></Button>
          </div>
        </div>
      </DialogHeader>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* التفسير الجانبي الموثوق */}
        {selectedAyah && (
          <aside className="w-full md:w-80 border-r border-white/5 bg-slate-900/40 p-6 flex flex-col gap-4 animate-in slide-in-from-left-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <h4 className="font-bold text-indigo-400 text-sm flex items-center gap-2 flex-row-reverse">
                <MessageCircle className="size-4" /> التفسير الميسر
              </h4>
              <Badge variant="outline" className="text-[10px]">الآية {selectedAyah.numberInSurah}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <p dir="rtl" className="text-sm text-slate-300 leading-loose text-right italic p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                "{selectedAyah.tafsir}"
              </p>
            </ScrollArea>
            <Button variant="ghost" className="w-full text-[10px] uppercase font-bold" onClick={() => setSelectedAyah(null)}>إغلاق التفسير</Button>
          </aside>
        )}

        <ScrollArea className="flex-1 bg-slate-900/50">
          <div className="min-h-full p-4 md:p-12 flex flex-col items-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="size-16 animate-spin text-primary opacity-20" />
                <p className="text-muted-foreground font-bold tracking-widest uppercase text-[10px] animate-pulse">جاري استدعاء السجل السحابي...</p>
              </div>
            ) : (
              <div className="max-w-4xl w-full mushaf-page rounded-[2rem] p-8 md:p-16 border-8 border-double border-[#b19a6a]/20 shadow-2xl relative">
                <div className="absolute inset-4 border border-[#b19a6a]/10 pointer-events-none rounded-[1.5rem]" />
                
                <div className="relative z-10 text-center">
                  {shouldShowHeaderBismillah && (
                    <div className="mb-16">
                      <p className="text-5xl font-quran text-[#2c2c2c] mb-4 select-none opacity-90 leading-normal">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                      <div className="flex items-center justify-center gap-4 opacity-20">
                        <div className="h-px w-20 bg-[#b19a6a]" />
                        <div className="size-2 rotate-45 border border-[#b19a6a]" />
                        <div className="h-px w-20 bg-[#b19a6a]" />
                      </div>
                    </div>
                  )}

                  <div 
                    style={{ fontSize: `${fontSize}px` }} 
                    className="text-[#2c2c2c] leading-[3.2] text-right font-quran select-text transition-all tracking-normal"
                  >
                    {renderAyahs()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/*<footer className="p-6 border-t border-white/5 bg-black/60 flex items-center justify-between gap-8 shrink-0 px-10 flex-row-reverse">
         <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
           <Info className="size-3" /> وضع المصحف المطور • اضغط على الآية لعرض التفسير الميسر
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Text & Tafsir Integrity Verified</span>
            </div>
         </div>
      </footer>*/}
    </DialogContent>
  );
}
