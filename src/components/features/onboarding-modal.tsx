
"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { MessageSquare, Wallet, ShoppingBag, Sparkles, ShieldCheck, Zap, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);

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
      <DialogContent className=" bg-slate-950 border-white/10 rounded-[3rem] p-0 overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)] outline-none">
        <DialogHeader className="sr-only">
          <DialogTitle>NexusAI Onboarding</DialogTitle>
          <DialogDescription>
            Synchronize with the Nexus ecosystem and configure your neural node for optimal intelligence.
          </DialogDescription>
        </DialogHeader>

        {/* Cinematic Header Visual */}
        <div className="relative h-56 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-950 to-slate-950" />
          <div className="absolute inset-0 opacity-30 bg-[url('https://picsum.photos/seed/nexus-pattern/800/400')] bg-cover mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
               <div className="size-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                 <Zap className="size-8 text-primary animate-pulse" />
               </div>
               <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
               <div className="size-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                 <ShieldCheck className="size-8 text-indigo-400" />
               </div>
            </div>
            <div className="flex items-center gap-2 mt-2 px-4 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="size-1.5 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">Neural Link Establishing</span>
            </div>
          </div>
        </div>

        <div className="px-10 pb-10 pt-6">
          <Carousel className="w-full">
            <CarouselContent>
              {steps.map((step, index) => (
                <CarouselItem key={index}>
                  <div className="flex flex-col items-center text-center space-y-6 px-2">
                    <div className={cn(
                      "size-20 rounded-[2rem] flex items-center justify-center border shadow-2xl transition-all duration-500", 
                      step.bg,
                      step.accent
                    )}>
                      <step.icon className={cn("size-10", step.color)} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-headline font-bold text-white tracking-tight">{step.title}</h3>
                      <p className="text-muted-foreground text-base leading-relaxed max-w-[320px] mx-auto">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="flex items-center justify-center gap-6 mt-10">
              <CarouselPrevious className="static translate-y-0 size-10 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-2xl transition-all" />
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div key={i} className="size-1.5 rounded-full bg-white/10" />
                ))}
              </div>
              <CarouselNext className="static translate-y-0 size-10 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-2xl transition-all" />
            </div>
          </Carousel>

          <div className="mt-10">
            <Button 
              onClick={handleComplete}
              className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
            >
              <Layers className="mr-2 size-5" />
              Acknowledge & Sync
            </Button>
            <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest mt-4 font-medium">
              Protocol v4.2 • Secured by Nexus Core
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
