
"use client";

import React from "react";
import Image from "next/image";
import { Edit3, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketItem, SUB_CATEGORIES } from "@/lib/market-store";
import { MakeOfferModal } from "../make-offer-modal";
import { cn } from "@/lib/utils";

interface MarketItemCardProps {
  item: MarketItem;
  userId?: string;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

export function MarketItemCard({ item, userId, onClick, onEdit }: MarketItemCardProps) {
  const subCatLabel = SUB_CATEGORIES.find(s => s.id === item.subCategory)?.label || item.subCategory;
  const isOwner = item.sellerId === userId;

  return (
    <Card 
      onClick={onClick} 
      className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-indigo-500/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl relative cursor-pointer"
    >
      <div className="absolute top-0 left-0 p-4 z-10 flex flex-col gap-2">
        <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[8px] uppercase tracking-tighter">
          {subCatLabel}
        </Badge>
        {item.mainCategory === 'software' && (
          <Badge className={cn(
            "backdrop-blur-md border-white/10 text-[8px] uppercase tracking-tighter font-black",
            item.versionStatus === 'beta' ? "bg-amber-500/80 text-white" : "bg-green-500/80 text-white"
          )}>
            {item.versionStatus === 'beta' ? 'BETA' : 'FINAL'}
          </Badge>
        )}
      </div>
      
      <div className="relative aspect-square overflow-hidden bg-slate-900">
        <Image 
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/600`} 
          alt={item.title} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
      </div>

      <CardContent className="p-7">
        <h3 dir="auto" className="text-xl font-bold text-white line-clamp-1 text-right mb-2">{item.title}</h3>
        <p dir="auto" className="text-xs text-muted-foreground line-clamp-2 mb-6 text-right leading-relaxed h-8">
          {item.description}
        </p>
        <div className="flex items-baseline justify-end gap-2 mb-6 flex-row-reverse">
          <span className="text-3xl font-black text-white tracking-tighter">{item.price?.toLocaleString()}</span>
          <span className="text-primary font-bold text-xs uppercase">رصيد</span>
        </div>
        
        <div className="flex flex-col gap-3 border-t border-white/5 pt-6 mt-2">
          {!isOwner ? (
            <div className="flex gap-2">
              <MakeOfferModal 
                item={item} 
                trigger={
                  <Button variant="outline" onClick={(e) => e.stopPropagation()} className="flex-1 rounded-xl h-12 border-white/10 hover:bg-white/5 font-bold gap-2">
                    <MessageCircle className="size-4" /> تواصل
                  </Button>
                }
              />
              <Button className="flex-1 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20">
                تفاصيل
              </Button>
            </div>
          ) : (
            <Button 
              onClick={onEdit}
              variant="ghost" 
              className="w-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl h-10 font-bold gap-2 border border-indigo-500/20"
            >
              <Edit3 className="size-4" /> تعديل العقدة
            </Button>
          )}
          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center">
            متوفر {item.stockQuantity} نسخة
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
