"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { MessageSquare, Wallet, ShoppingBag, Sparkles, ShieldCheck, Zap, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
  };

  const steps = [
    {
      icon: Sparkles,
      title: "Welcome to NexusAI",
      description: "You've just synchronized with the most advanced neural assistant ecosystem. Let's get your node configured.",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      accent: "border-indigo-500/20"
    },
    {
      icon: Wallet,
      title: "Manage Your Credits",
      description: "Your Neural Wallet handles all institutional credits. Use them to acquire high-fidelity assets or tip AI nodes.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      accent: "border-emerald-500/20"
    },
    {
      icon: ShoppingBag,
      title: "The TechMarket",
      description: "Discover and trade decentralized AI tools, hardware, and services through our secure escrow protocol.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      accent: "border-amber-500/20"
    },
    {
      icon: MessageSquare,
      title: "Nexus Realtime Chat",
      description: "Communicate directly with our global AI nodes. Upload files, record audio, and get context-aware responses.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      accent: "border-blue-500/20"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* التعديل الأساسي هنا:
        1. تحويل النظام إلى flex flex-col لإلغاء الـ grid الافتراضي المسبب للتداخل.
        2. تحديد العرض بدقة w-[95vw] sm:max-w-[500px].
        3. إضافة max-h-[90vh] لضمان عدم خروج النافذة عن الشاشة.
      */}
      <DialogContent className="bg-slate-950 border-white/10 sm:rounded-[3rem] rounded-3xl p-0 shadow-[0_0_50px_rgba(99,102,241,0.2)] outline-none w-[95vw] sm:max-w-[500px] flex flex-col gap-0 overflow-hidden max-h-[90vh]">
        
        <DialogHeader className="sr-only">
          <DialogTitle>NexusAI Onboarding</DialogTitle>
          <DialogDescription>
            Synchronize with the Nexus ecosystem and configure your neural node for optimal intelligence.
          </DialogDescription>
        </DialogHeader>

        {/* Cinematic Header Visual - تم تصغير الارتفاع على الشاشات الصغيرة h-40 */}
        <div className="relative h-40 sm:h-56 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-950 to-slate-950" />
          <div className="absolute inset-0 opacity-30 bg-[url('https://picsum.photos/seed/nexus-pattern/800/400')] bg-cover mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
               <div className="size-14 sm:size-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                 <Zap className="size-6 sm:size-8 text-primary animate-pulse" />
               </div>
               <div className="h-8 sm:h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
               <div className="size-14 sm:size-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                 <ShieldCheck className="size-6 sm:size-8 text-indigo-400" />
               </div>
            </div>
            <div className="flex items-center gap-2 mt-1 sm:mt-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="size-1.5 rounded-full bg-primary animate-ping" />
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] text-primary">Neural Link Establishing</span>
            </div>
          </div>
        </div>

        {/* Main Content Area - مجهزة بـ overflow-y-auto لتمرير المحتوى إذا كانت الشاشة صغيرة */}
        <div className="px-6 sm:px-10 pb-8 pt-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
          <Carousel setApi={setApi} className="w-full flex-1 flex flex-col justify-center">
            <CarouselContent>
              {steps.map((step, index) => (
                <CarouselItem key={index}>
                  <div className="flex flex-col items-center text-center space-y-5 sm:space-y-6 px-1 sm:px-2">
                    <div className={cn(
                      "size-16 sm:size-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center border shadow-2xl transition-all duration-500", 
                      step.bg,
                      step.accent
                    )}>
                      <step.icon className={cn("size-8 sm:size-10", step.color)} />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-headline font-bold text-white tracking-tight">{step.title}</h3>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mx-auto max-w-[320px]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Carousel Controls - تم إجبارها لتكون static لتجنب أي تداخل مطلق */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-10">
              <CarouselPrevious className="static transform-none translate-x-0 translate-y-0 size-10 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-2xl transition-all" />
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === current ? "bg-white w-4" : "bg-white/20 w-1.5"
                    )} 
                  />
                ))}
              </div>
              <CarouselNext className="static transform-none translate-x-0 translate-y-0 size-10 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-2xl transition-all" />
            </div>
          </Carousel>

          <div className="mt-8 sm:mt-10 shrink-0">
            <Button 
              onClick={handleComplete}
              className="w-full h-12 sm:h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
            >
              <Layers className="mr-2 size-5" />
              Acknowledge & Sync
            </Button>
            <p className="text-center text-[9px] sm:text-[10px] text-muted-foreground/40 uppercase tracking-widest mt-4 font-medium">
              Protocol v4.2 • Secured by Nexus Core
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}