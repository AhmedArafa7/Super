"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWirdStore, WirdType } from "@/lib/wird-store";
import { useQuranStore } from "@/lib/quran-store";
import { Loader2, BookOpen, Headphones, Edit3, CheckCircle2, ChevronLeft, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

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
  const { enabledTypes, currentSurahId, todayCompletedTypes, markStepComplete, resetTodayProgress } = useWirdStore();
  const { surahs, fetchSurahText, currentReadingText, isReadingLoading, setCurrentSurah, setIsPlaying } = useQuranStore();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [writeText, setWriteText] = useState("");

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
      
      fetchSurahText(currentSurahId);
    }
  }, [isOpen, currentSurahId]);

  const targetSurah = surahs.find(s => s.id === currentSurahId);
  if (!targetSurah || !enabledTypes.length) return null;

  const handleNextStep = () => {
    const currentType = enabledTypes[currentStepIndex];
    markStepComplete(currentType);
    
    if (currentStepIndex < enabledTypes.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setWriteText(""); // Reset writing pad for next step if any
    } else {
      onClose(); // Finished all steps
    }
  };

  const handleStartListening = () => {
    setCurrentSurah(targetSurah);
    setIsPlaying(true);
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
                       <h3 className="text-2xl font-bold text-white mb-6">اقرأ السورة وتدبرها</h3>
                       <div className="bg-black/40 rounded-2xl p-6 max-h-[250px] overflow-y-auto text-right font-quran text-2xl leading-[2.5] text-white/90">
                         {currentReadingText?.map(a => `${a.text} ﴿${a.numberInSurah}﴾ `).join("")}
                       </div>
                    </div>
                  )}

                  {currentType === 'listen' && (
                    <div className="text-center flex-1 flex flex-col items-center justify-center">
                       <div className="size-24 bg-indigo-500/10 text-indigo-400 rounded-[2.5rem] flex items-center justify-center mb-8 ring-8 ring-indigo-500/5">
                          <Headphones className="size-10" />
                       </div>
                       <h3 className="text-2xl font-bold text-white mb-4">استمع للورد وانصت خاشعاً</h3>
                       <Button onClick={handleStartListening} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-6 text-lg">
                          تشغيل التلاوة
                       </Button>
                    </div>
                  )}

                  {currentType === 'write' && (
                    <div className="text-center flex-1 flex flex-col">
                       <h3 className="text-2xl font-bold text-white mb-4">اختبر حفظك للسورة</h3>
                       <p className="text-sm text-muted-foreground mb-6">اكتب ما تحفظه من السورة، وبعد الانتهاء قاره مع النص الأصلي للتثبيت.</p>
                       <Textarea 
                         dir="auto"
                         placeholder="بسم الله الرحمن الرحيم..."
                         className="flex-1 min-h-[150px] bg-black/40 border-white/10 rounded-2xl text-xl font-quran text-right p-6 focus-visible:ring-indigo-500"
                         value={writeText}
                         onChange={(e) => setWriteText(e.target.value)}
                       />
                       {/* Note: the comparison logic could be added here in a more advanced version */}
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
             <Button onClick={handleNextStep} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 flex items-center gap-2">
               {currentStepIndex === enabledTypes.length - 1 ? "إتمام الورد" : "الخطوة التالية"}
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
