
"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, ShieldCheck, Zap, MessageCircle, MoreVertical, Loader2, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStoredUsers, User } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * [STABILITY_ANCHOR: NODE_DIRECTORY_V2]
 * سجل العقد الحقيقي - يقوم بجلب كافة العقد البشرية النشطة من Firestore مع إمكانية البحث الفوري.
 */
export function NodeDirectory() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // [FUNCTION: LIVE_DATA_SYNC]
  useEffect(() => {
    const loadNodes = async () => {
      setIsLoading(true);
      try {
        const data = await getStoredUsers();
        setUsers(data);
      } catch (err) {
        console.error("Directory Sync Failure:", err);
        toast({ variant: "destructive", title: "Sync Failure", description: "Could not reach the neural directory." });
      } finally {
        setIsLoading(false);
      }
    };
    loadNodes();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Verified Nexus Network</Badge>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            سجل العقد الحية
            <Users className="text-emerald-400 size-10" />
          </h1>
          <p className="text-muted-foreground text-lg">دليل العقد النشطة حالياً في شبكة NexusAI - بيانات حقيقية من النخاع.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 flex-row-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <input 
            dir="auto"
            placeholder="ابحث عن اسم العقدة أو المعرف..." 
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pr-12 pl-6 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xl text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-6 bg-white/5 border border-white/10 rounded-2xl">
          <Database className="size-4 text-emerald-400" />
          <span className="text-xs font-mono text-white">{filteredUsers.length} Active Nodes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <Card key={i} className="h-80 rounded-[2.5rem] bg-white/5 animate-pulse border-white/5" />
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-32 text-center opacity-30 flex flex-col items-center">
            <Search className="size-16 mb-4" />
            <p className="text-xl font-bold">لم يتم العثور على أي عقد مطابقة</p>
          </div>
        ) : filteredUsers.map((u) => (
          <Card key={u.id} className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-emerald-500/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl relative">
            <div className="absolute top-4 left-4 z-10">
              <Badge className={cn(
                "bg-black/60 backdrop-blur-md border-white/10 px-3 py-1 rounded-full text-[8px] font-bold uppercase",
                u.role === 'admin' ? "text-indigo-400 border-indigo-500/20" : "text-emerald-400 border-emerald-500/20"
              )}>
                {u.role}
              </Badge>
            </div>
            
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="size-24 rounded-[2.2rem] bg-emerald-500/10 border-2 border-dashed border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                  <img src={u.avatarUrl || `https://picsum.photos/seed/${u.username}/100/100`} className="size-full object-cover" alt="avatar" />
                </div>
                <div className="absolute -bottom-2 -right-2 size-8 bg-black border-2 border-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheck className="size-4 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 dir="auto" className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{u.name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">@{u.username}</p>
              </div>

              <div className="flex gap-2 w-full pt-4 border-t border-white/5">
                <Badge variant="outline" className="flex-1 justify-center rounded-lg border-white/10 text-[9px] uppercase font-bold py-1.5 bg-white/5">{u.classification || 'No Class'}</Badge>
                {u.canManageCredits && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20 h-7 text-[8px] font-black">BANKER</Badge>
                )}
              </div>

              <div className="flex items-center gap-3 w-full">
                <Button 
                  onClick={() => toast({ title: "Neural Link Requested", description: `Waiting for @${u.username} to accept sync.` })}
                  variant="outline" 
                  className="flex-1 rounded-xl h-11 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all text-xs font-bold gap-2"
                >
                  <MessageCircle className="size-4" /> تواصل
                </Button>
                <Button variant="ghost" size="icon" className="size-11 rounded-xl border border-white/10 hover:bg-white/5 transition-all"><MoreVertical className="size-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
