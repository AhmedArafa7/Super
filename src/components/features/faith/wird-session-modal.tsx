"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWirdStore, WirdType } from "@/lib/wird-store";
import { useQuranStore } from "@/lib/quran-store";
import { 
  Loader2, BookOpen, Headphones, Edit3, CheckCircle2, 
  ChevronLeft, Save, Pause, Play, RotateCcw, RotateCw 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const cleanText = (text: string) => {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "") // Diacritics and Kashida
    .replace(/[\u0671أإآآٱى]/g, "ا") // Alefs (including Alef Wasla and Maksura)
    .replace(/[يئ]/g, "ي") // Yeh and Hamza on Yeh
    .replace(/ؤ/g, "و") // Hamza on Waw
    .replace(/ة/g, "ه") // Marbuta
    .replace(/[﴾﴿0-9\u0660-\u0669]/g, "") // Verse marks and all numerals
    .replace(/\s+/g, " ") // Spaces
    .trim();
};

const normalizeForComparison = (word: string) => {
  // Ultra-normalize for comparison only (remove Alefs to handle Uthmani vs Modern script)
  return word.replace(/ا/g, "");
};

interface DiffResult {
  word: string;
  type: 'correct' | 'wrong' | 'added';
  expected?: string;
}

const calculateDiff = (original: string, user: string): { results: DiffResult[], accuracy: number } => {
  const origClean = cleanText(original);
  const userClean = cleanText(user);
  
  const origWords = origClean.split(/\s+/).filter(Boolean);
  const userWords = userClean.split(/\s+/).filter(Boolean);
  
  const results: DiffResult[] = [];
  let correctCount = 0;
  let oIdx = 0;
  let uIdx = 0;

  while (oIdx < origWords.length || uIdx < userWords.length) {
    const o = origWords[oIdx];
    const u = userWords[uIdx];

    const isMatch = o === u || (o && u && normalizeForComparison(o) === normalizeForComparison(u));

    if (isMatch && o !== undefined) {
      results.push({ word: u, type: 'correct' });
      correctCount++;
      oIdx++;
      uIdx++;
    } else if (u === undefined) {
      // User finished early, remaining words are wrong
      results.push({ word: o, type: 'wrong', expected: o });
      oIdx++;
    } else if (o === undefined) {
      // User added extra words
      results.push({ word: u, type: 'added' });
      uIdx++;
    } else {
      // Mismatch - look ahead to see if user skipped a word or added one
      const nextO = origWords[oIdx + 1];
      const nextU = userWords[uIdx + 1];

      if (u === nextO) {
        // User skipped a word (o)
        results.push({ word: o, type: 'wrong', expected: o });
        oIdx++;
      } else if (o === nextU) {
        // User added a word (u)
        results.push({ word: u, type: 'added' });
        uIdx++;
      } else {
        // Just a wrong word
        results.push({ word: u, type: 'wrong', expected: o });
        oIdx++;
        uIdx++;
      }
    }
  }
  
  const accuracy = origWords.length > 0 ? Math.round((correctCount / origWords.length) * 100) : 0;
  
  return { results, accuracy };
};

interface WirdSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG = {
  read: { label: "قراءة", icon: <BookOpen className="size-5" /> },
  listen: { label: "استماع", icon: <Headphones className="size-5" /> },
  write: { label: "كتابة (حفظ)", icon: <Edit3 className="size-5" /> },
};

export function WirdSessionModal({ isOpen, onClose }: WirdSessionModalProps) {
  const { enabledTypes, currentSurahId, todayCompletedTypes, amountType, verseRange, juzNumber, markStepComplete, resetTodayProgress } = useWirdStore();
  const { 
    surahs, fetchSurahText, fetchJuzText, currentReadingText, currentJuzText, isReadingLoading, 
    setCurrentSurah, setIsPlaying, isPlaying, currentSurah,
    playbackPosition, duration, performSeek
  } = useQuranStore();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [writeText, setWriteText] = useState("");
  const [showWriteResult, setShowWriteResult] = useState(false);
  const [memorizationResult, setMemorizationResult] = useState<{ results: DiffResult[], accuracy: number } | null>(null);

  const todayString = new Date().toISOString().split('T')[0];
  const { lastCompletedDate } = useWirdStore.getState();

  useEffect(() => {
    if (isOpen) {
      resetTodayProgress();
      if (lastCompletedDate === todayString) {
        // Already done today
        setCurrentStepIndex(enabledTypes.length);
      } else {
        // Find first incomplete step
        const nextIncompleteIndex = enabledTypes.findIndex(t => !todayCompletedTypes.includes(t));
        setCurrentStepIndex(nextIncompleteIndex !== -1 ? nextIncompleteIndex : 0);
      }
      
      if (amountType === 'juz') {
        fetchJuzText(juzNumber);
      } else {
        fetchSurahText(currentSurahId);
      }
    }
  }, [isOpen, currentSurahId, juzNumber, amountType]);

  const targetSurah = surahs.find(s => s.id === currentSurahId);
  if (!targetSurah || !enabledTypes.length) return null;

  const handleNextStep = () => {
    const currentType = enabledTypes[currentStepIndex];
    
    // Logic for 'write' step completion
    if (currentType === 'write' && !showWriteResult) {
      const targetText = amountType === 'juz' 
        ? currentJuzText?.map(a => a.text).join(" ") || ""
        : currentReadingText
          ?.filter(a => amountType === 'surah' || (a.numberInSurah >= verseRange.start && a.numberInSurah <= verseRange.end))
          .map(a => a.text).join(" ") || ""
      
      const analysis = calculateDiff(targetText, writeText);
      setMemorizationResult(analysis);
      setShowWriteResult(true);
      return; // Stop here to show results
    }

    markStepComplete(currentType);
    
    // Stop audio if it was playing after a listening session
    if (currentType === 'listen') {
      setIsPlaying(false);
    }

    if (currentStepIndex < enabledTypes.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setWriteText(""); // Reset writing pad for next step
      setShowWriteResult(false);
      setMemorizationResult(null);
    } else {
      onClose(); // Finished all steps
    }
  };

  const handleToggleListening = () => {
    if (isPlaying && currentSurah?.id === targetSurah.id) {
       setIsPlaying(false);
    } else {
       setCurrentSurah(targetSurah);
       setIsPlaying(true);
    }
  };

  const currentType = enabledTypes[currentStepIndex];
  const isFinished = lastCompletedDate === todayString || currentStepIndex === enabledTypes.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-black/80 backdrop-blur-2xl border-white/10 rounded-[2rem] p-0 overflow-hidden font-sans">
        <DialogHeader className="p-8 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between flex-row-reverse mb-4">
            <Badge variant="outline" className="border-indigo-500/20 text-indigo-400">الورد اليومي</Badge>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{Math.round((todayCompletedTypes.length / enabledTypes.length) * 100)}%</span>
              <Progress value={(todayCompletedTypes.length / enabledTypes.length) * 100} className="w-24 h-2 bg-white/5" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold text-white text-right font-quran">
            {targetSurah.name.includes("سورة") ? targetSurah.name : `سورة ${targetSurah.name}`}
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground text-lg">
            أنجز خطوات وردك بالترتيب الذي حددته لتعزيز تفاعلك مع القرآن.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="p-8">
          {/* Timeline / Progress Steps */}
          <div className="flex justify-between items-center mb-8 relative px-4">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/5 -z-10 -translate-y-1/2" />
            
            {enabledTypes.map((type, idx) => {
               const isCompleted = todayCompletedTypes.includes(type) || isFinished;
               const isCurrent = idx === currentStepIndex && !isFinished;
               
               return (
                 <div key={type} className="flex flex-col items-center gap-3">
                   <div className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
                     isCompleted ? "bg-green-500 text-white" : 
                     isCurrent ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20 scale-110" : 
                     "bg-white/5 text-muted-foreground border border-white/10"
                   }`}>
                     {isCompleted ? <CheckCircle2 className="size-6" /> : TYPE_CONFIG[type].icon}
                   </div>
                   <span className={`text-xs font-bold ${isCurrent ? "text-indigo-400" : "text-muted-foreground"}`}>
                     {TYPE_CONFIG[type].label}
                   </span>
                 </div>
               );
             })}
          </div>

          {/* Active Step Content */}
          <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 min-h-[300px] flex flex-col justify-center">
             {isReadingLoading ? (
               <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
                 <Loader2 className="size-10 font-bold animate-spin mb-4" />
                 <p>جاري استحضار الآيات...</p>
               </div>
             ) : isFinished ? (
               <div className="flex flex-col items-center justify-center text-center h-full gap-6 animate-in zoom-in-95">
                 <div className="size-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2 mx-auto ring-8 ring-green-500/5">
                    <CheckCircle2 className="size-12" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-white mb-2">تقبل الله وردك اليوم!</h3>
                    <p className="text-muted-foreground">غداً موعدنا مع السورة التالية إن شاء الله.</p>
                 </div>
               </div>
             ) : (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
                  {currentType === 'read' && (
                    <div className="text-center">
                       <h3 className="text-2xl font-bold text-white mb-6">
                         {amountType === 'verses' ? `اقرأ الآيات (${verseRange.start} - ${verseRange.end})` : 
                          amountType === 'juz' ? `اقرأ الجزء ${juzNumber}` : "اقرأ السورة وتدبرها"}
                       </h3>
                       <div className="bg-black/40 rounded-2xl p-6 max-h-[350px] overflow-y-auto text-right font-quran text-2xl leading-[2.5] text-white/90 custom-scrollbar">
                         {amountType === 'juz' 
                           ? currentJuzText?.map(a => `${a.text} ﴿${a.numberInSurah}﴾ `).join("")
                           : currentReadingText
                             ?.filter(a => amountType === 'surah' || (a.numberInSurah >= verseRange.start && a.numberInSurah <= verseRange.end))
                             .map(a => `${a.text} ﴿${a.numberInSurah}﴾ `).join("")}
                       </div>
                    </div>
                  )}

                  {currentType === 'listen' && (
                    <div className="text-center flex-1 flex flex-col items-center justify-center">
                       <div className={cn(
                         "size-24 rounded-[2.5rem] flex items-center justify-center mb-6 ring-8 transition-all duration-500",
                         isPlaying ? "bg-red-500/10 text-red-500 ring-red-500/5 pulse-subtle" : "bg-indigo-500/10 text-indigo-400 ring-indigo-500/5"
                       )}>
                          {isPlaying ? <Pause className="size-10" /> : <Headphones className="size-10" />}
                       </div>
                       
                       <div className="w-full max-w-md px-6 mb-8">
                         <div className="flex justify-between items-center mb-2 px-1">
                           <span className="text-xs font-mono text-muted-foreground">{formatTime(playbackPosition)}</span>
                           <span className="text-xs font-mono text-muted-foreground">{formatTime(duration)}</span>
                         </div>
                         <Slider
                           value={[playbackPosition]}
                           max={duration || 100}
                           step={1}
                           onValueChange={([val]) => performSeek(val)}
                           className="cursor-pointer"
                         />
                       </div>

                       <div className="flex items-center gap-6">
                         <Button 
                           variant="outline" 
                           onClick={() => performSeek(Math.max(0, playbackPosition - 15))}
                           className="size-12 rounded-xl border-white/10 text-muted-foreground hover:text-white"
                         >
                           <RotateCcw className="size-5" />
                         </Button>

                         <Button 
                           onClick={handleToggleListening} 
                           className={cn(
                             "rounded-2xl h-16 px-10 text-xl font-bold transition-all shadow-2xl",
                             isPlaying ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                           )}
                         >
                            {isPlaying ? "إيقاف مؤقت" : "تشغيل التلاوة"}
                         </Button>

                         <Button 
                           variant="outline" 
                           onClick={() => performSeek(Math.min(duration, playbackPosition + 15))}
                           className="size-12 rounded-xl border-white/10 text-muted-foreground hover:text-white"
                         >
                           <RotateCw className="size-5" />
                         </Button>
                       </div>
                    </div>
                  )}

                  {currentType === 'write' && (
                    <div className="text-center flex-1 flex flex-col h-full">
                       <h3 className="text-2xl font-bold text-white mb-2">
                         {amountType === 'verses' ? `اختبر حفظك للآيات (${verseRange.start} - ${verseRange.end})` : 
                          amountType === 'juz' ? `اختبر حفظك للجزء ${juzNumber}` : "اختبر حفظك للسورة"}
                       </h3>
                       
                       {!showWriteResult ? (
                         <>
                           <p className="text-sm text-muted-foreground mb-6">اكتب الآيات المحددة، وبعد الانتهاء سأقوم بمقارنتها لك وتوضيح الأخطاء.</p>
                           <Textarea 
                             dir="auto"
                             placeholder="بسم الله الرحمن الرحيم..."
                             className="flex-1 min-h-[220px] bg-black/40 border-white/10 rounded-2xl text-xl font-quran text-right p-6 focus-visible:ring-indigo-500 leading-relaxed shadow-inner"
                             value={writeText}
                             onChange={(e) => setWriteText(e.target.value)}
                           />
                         </>
                       ) : (
                         <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-top-4 duration-500">
                           <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                             <div className="text-right">
                               <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">نسبة الحفظ</p>
                               <p className={cn(
                                 "text-3xl font-black",
                                 (memorizationResult?.accuracy || 0) > 90 ? "text-green-500" : 
                                 (memorizationResult?.accuracy || 0) > 60 ? "text-amber-500" : "text-red-500"
                               )}>{memorizationResult?.accuracy}%</p>
                             </div>
                             <div className="flex items-center gap-3">
                               <div className="text-right">
                                 <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">التقييم العصبي</p>
                                 <p className="text-sm font-bold text-white">
                                   {(memorizationResult?.accuracy || 0) === 100 ? "حفظ متقن ماشاء الله" : 
                                    (memorizationResult?.accuracy || 0) > 80 ? "حفظ جيد جداً" : "تحتاج لمزيد من المراجعة"}
                                 </p>
                               </div>
                               <div className="size-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                 <Save className="size-6" />
                               </div>
                             </div>
                           </div>

                           <div className="bg-black/60 rounded-[1.5rem] p-6 flex-1 text-right font-quran text-2xl leading-[2.2] overflow-y-auto custom-scrollbar border border-white/10 shadow-2xl">
                             <div className="flex flex-wrap gap-x-2 gap-y-3 justify-end items-center" dir="rtl">
                               {memorizationResult?.results.map((r, i) => (
                                 <span 
                                   key={i} 
                                   className={cn(
                                     "px-1.5 py-0.5 rounded-lg transition-all",
                                     r.type === 'correct' ? "text-white/90" : 
                                     r.type === 'wrong' ? "bg-red-500/20 text-red-400 border border-red-500/30 line-through decoration-red-500/50" : 
                                     "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                   )}
                                   title={r.expected ? `المتوقع: ${r.expected}` : undefined}
                                 >
                                   {r.word}
                                   {r.type === 'wrong' && r.expected && (
                                     <span className="mr-1 inline-flex items-center justify-center p-1 bg-green-500/20 text-green-400 text-xs rounded font-sans line-through-none no-underline border border-green-500/20 align-top translate-y-[-10px]">
                                       {r.expected}
                                     </span>
                                   )}
                                 </span>
                               ))}
                             </div>
                           </div>
                           
                           <Button 
                             variant="ghost" 
                             onClick={() => setShowWriteResult(false)}
                             className="mt-4 text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] hover:text-white"
                           >
                              إعادة المحاولة <RotateCcw className="size-3 mr-2" />
                           </Button>
                         </div>
                       )}
                    </div>
                  )}
               </div>
             )}
          </div>

          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
           <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 hover:bg-white/10 text-white">
             {isFinished ? "إغلاق" : "العودة لاحقاً"}
           </Button>

           {!isFinished && (
             <Button onClick={handleNextStep} className={cn(
               "rounded-xl px-8 flex items-center gap-2",
               showWriteResult ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-primary hover:bg-primary/90"
             )}>
               {showWriteResult ? "الخطوة التالية واحتساب التقدم" : 
                currentStepIndex === enabledTypes.length - 1 ? "إكمال الخطوة والنتيجة" : "الخطوة التالية"}
               <ChevronLeft className="size-5" />
             </Button>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Ensure Badge is imported (adding at bottom to avoid breaking flow above)
import { Badge } from "@/components/ui/badge";
