
"use client";

import React from "react";
import { ShieldCheck, MessageCircle, MoreVertical, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function NodeCard({ user }: { user: any }) {
  const { toast } = useToast();

  return (
    <Card className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-emerald-500/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Badge className={cn(
          "bg-black/60 backdrop-blur-md border-white/10 px-3 py-1 rounded-full text-[8px] font-bold uppercase",
          user.role === 'admin' ? "text-indigo-400" : "text-emerald-400"
        )}>
          {user.role}
        </Badge>
      </div>
      
      <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <div className="size-24 rounded-[2.2rem] bg-emerald-500/10 border-2 border-dashed border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden shadow-inner">
            <img 
              src={user.avatarUrl || `https://picsum.photos/seed/${user.username}/100/100`} 
              className="size-full object-cover" 
              alt={user.name} 
            />
          </div>
          <div className="absolute -bottom-2 -right-2 size-8 bg-black border-2 border-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="size-4 text-emerald-400" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 dir="auto" className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{user.name}</h3>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">@{user.username}</p>
        </div>

        <div className="flex gap-2 w-full pt-4 border-t border-white/5">
          <Badge variant="outline" className="flex-1 justify-center rounded-lg border-white/10 text-[9px] uppercase font-bold py-1.5 bg-white/5">
            {user.classification || 'Unclassified'}
          </Badge>
          {user.canManageCredits && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20 h-7 text-[8px] font-black">BANKER</Badge>
          )}
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button 
            onClick={() => toast({ title: "Request Transmitted", description: `Waiting for @${user.username} to accept link.` })}
            variant="outline" 
            className="flex-1 rounded-xl h-11 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all text-xs font-bold gap-2"
          >
            <MessageCircle className="size-4" /> تواصل
          </Button>
          <Button variant="ghost" size="icon" className="size-11 rounded-xl border border-white/10 hover:bg-white/5"><MoreVertical className="size-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
