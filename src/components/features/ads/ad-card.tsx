
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Zap, MousePointer2, Calendar, PlayCircle, Image as ImageIcon, Globe2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ad, recordAdClick } from "@/lib/ads-store";
import { adjustFunds } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AdCardProps {
  ad: Ad;
  userId?: string;
  onRewardClaimed?: () => void;
}

export function AdCard({ ad, userId, onRewardClaimed }: AdCardProps) {
  const [currentImage, setCurrentImage] = useState<string>("");

  useEffect(() => {
    let selectedImage = "";
    if (ad.imageUrls && ad.imageUrls.length > 0) {
      // Pick a random image from the array to cycle
      selectedImage = ad.imageUrls[Math.floor(Math.random() * ad.imageUrls.length)];
    } else if ((ad as any).imageUrl) {
      // Fallback for older ads
      selectedImage = (ad as any).imageUrl;
    }
    setCurrentImage(selectedImage);
  }, [ad.imageUrls, (ad as any).imageUrl, ad.id]);
  const handleAction = async () => {
    await recordAdClick(ad.id);
    if (ad.rewardAmount > 0 && userId) {
      const success = await adjustFunds(userId, ad.rewardAmount, 'deposit');
      if (success) onRewardClaimed?.();
    }
    if (ad.linkUrl) window.open(ad.linkUrl, '_blank');
  };

  return (
    <Card className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-2xl relative flex flex-col">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-900 group">
        {currentImage ? (
          <Image 
            src={currentImage} 
            alt={ad.title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/50">
            {ad.type === 'video' ? <PlayCircle className="size-16 text-indigo-400 opacity-50 mb-2" /> : 
             ad.type === 'page' ? <Globe2 className="size-16 text-emerald-400 opacity-50 mb-2" /> :
             <ImageIcon className="size-16 text-slate-500 opacity-30 mb-2" />}
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{ad.type || 'ADVERT'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[8px] uppercase font-bold tracking-widest px-3 py-1">
            {ad.category}
          </Badge>
          {ad.type === 'video' && <Badge className="bg-indigo-500/80 backdrop-blur-md text-white text-[8px] uppercase font-bold px-2 py-1"><PlayCircle className="size-3 mr-1" /> VIDEO</Badge>}
        </div>
        {ad.rewardAmount > 0 && (
          <div className="absolute bottom-4 right-4 animate-in fade-in zoom-in">
            <div className="bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Zap className="size-3 text-primary animate-pulse" />
              <span className="text-[10px] font-black text-white">+{ad.rewardAmount} CREDITS</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-8 text-right flex-1 flex flex-col">
        <h3 dir="auto" className="text-xl font-bold text-white mb-2 line-clamp-1">{ad.title}</h3>
        <p dir="auto" className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-2 italic">"{ad.description}"</p>
        
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-3" />
            <span className="text-[9px] uppercase font-bold">{formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true })}</span>
          </div>
          <Button 
            onClick={handleAction}
            className="bg-white/5 hover:bg-primary hover:text-white rounded-xl h-10 px-6 font-bold text-xs gap-2 border border-white/10 transition-all group/btn"
          >
            <MousePointer2 className="size-3 group-hover/btn:scale-110 transition-transform" />
            تفاعل الآن
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
