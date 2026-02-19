
"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, ShieldCheck, Zap, Globe, MessageCircle, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStoredUsers, User } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: NODE_DIRECTORY_V1]
 * سجل العقد - دليل عام وشامل لكافة العقد البشرية والآلية النشطة في النظام.
 */
export function NodeDirectory() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getStoredUsers();
      setUsers(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">verified nexus network</Badge>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            سجل العقد
            <Users className="text-emerald-400 size-10" />
          </h1>
          <p className="text-muted-foreground text-lg">دليل العقد النشطة في شبكة NexusAI - ابحث عن المطورين والمستثمرين.</p>
        </div>
      </header>

      <div className="relative max-w-2xl ml-auto">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input 
          dir="auto"
          placeholder="ابحث عن عقدة بشرية..." 
          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pr-12 pl-6 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xl text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => <div key={i} className="h-64 rounded-[2.5rem] bg-white/5 animate-pulse" />)
        ) : filteredUsers.map((u) => (
          <Card key={u.id} className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-emerald-500/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl relative">
            <div className="absolute top-4 left-4 z-10">
              <Badge className={cn(
                "bg-black/60 backdrop-blur-md border-white/10 px-3 py-1 rounded-full text-[8px] font-bold uppercase",
                u.role === 'admin' ? "text-indigo-400" : "text-emerald-400"
              )}>
                {u.role}
              </Badge>
            </div>
            
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="size-24 rounded-[2rem] bg-emerald-500/10 border-2 border-dashed border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <img src={u.avatarUrl || `https://picsum.photos/seed/${u.username}/100/100`} className="size-full object-cover rounded-[1.8rem]" />
                </div>
                <div className="absolute -bottom-2 -right-2 size-8 bg-black border-2 border-emerald-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="size-4 text-emerald-400" />
                </div>
              </div>

              <div>
                <h3 dir="auto" className="text-xl font-bold text-white">{u.name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">@{u.username}</p>
              </div>

              <div className="flex gap-2 w-full pt-4 border-t border-white/5">
                <Badge variant="outline" className="flex-1 justify-center rounded-lg border-white/10 text-[9px] uppercase font-bold py-1.5">{u.classification || 'No Class'}</Badge>
                {u.canManageCredits && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20 h-7">BANKER</Badge>}
              </div>

              <div className="flex items-center gap-3 w-full">
                <Button variant="outline" className="flex-1 rounded-xl h-10 border-white/10 hover:bg-white/5 text-[10px] font-bold">
                  <MessageCircle className="size-3 mr-1.5" /> تواصل
                </Button>
                <Button variant="ghost" size="icon" className="size-10 rounded-xl border border-white/10"><MoreVertical className="size-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
