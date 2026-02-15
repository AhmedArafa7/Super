
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
import { MessageSquare, Wallet, ShoppingBag, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
      bg: "bg-indigo-500/10"
    },
    {
      icon: Wallet,
      title: "Manage Your Credits",
      description: "Your Neural Wallet handles all institutional credits. Use them to acquire high-fidelity assets or tip AI nodes.",
      color: "text-green-400",
      bg: "bg-green-500/10"
    },
    {
      icon: ShoppingBag,
      title: "The TechMarket",
      description: "Discover and trade decentralized AI tools, hardware, and services through our secure escrow protocol.",
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      icon: MessageSquare,
      title: "Nexus Realtime Chat",
      description: "Communicate directly with our global AI nodes. Upload files, record audio, and get context-aware responses.",
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <div className="relative h-48 bg-primary/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
          <div className="relative z-10 flex gap-4">
             <Zap className="size-12 text-primary animate-pulse" />
             <div className="h-12 w-px bg-white/10" />
             <ShieldCheck className="size-12 text-indigo-400" />
          </div>
        </div>

        <div className="p-8">
          <Carousel className="w-full">
            <CarouselContent>
              {steps.map((step, index) => (
                <CarouselItem key={index}>
                  <div className="flex flex-col items-center text-center space-y-4 px-4">
                    <div className={cn("size-16 rounded-3xl flex items-center justify-center border border-white/5 shadow-xl", step.bg)}>
                      <step.icon className={cn("size-8", step.color)} />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                      {step.description}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-8">
              <CarouselPrevious className="static translate-y-0 bg-white/5 border-white/10 hover:bg-white/10" />
              <CarouselNext className="static translate-y-0 bg-white/5 border-white/10 hover:bg-white/10" />
            </div>
          </Carousel>
        </div>

        <DialogFooter className="p-8 pt-0">
          <Button 
            onClick={handleComplete}
            className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            Acknowledge & Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
