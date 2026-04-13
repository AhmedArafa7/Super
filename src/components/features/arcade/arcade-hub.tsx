
"use client";

import React, { useState } from "react";
import { Gamepad2, Play, Download, RefreshCw, Info, Maximize2, Monitor, Smartphone, Cpu, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArcadeArena } from "./arcade-arena";
import { SaveBridgeManager } from "./save-bridge-manager";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

/**
 * [STABILITY_ANCHOR: ARCADE_HUB_V1.0]
 * The "Nexus Arcade" entry point. Implements a Hybrid Platform Launcher.
 */

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  genre: string;
  platforms: ("browser" | "android" | "pc")[];
  nativeLink?: string;
  webUrl?: string;
  status: "available" | "coming_soon" | "beta";
}

const GAMES_LIBRARY: Game[] = [
  {
    id: "mindustry",
    title: "Mindustry Classic",
    description: "لعبة بناء مصانع ودفاع عن الأبراج (Tower Defense) عميقة جداً ومفتوحة المصدر. ابنِ شبكات التوريد المعقدة لنقل الموارد إلى أبراجك الدفاعية.",
    thumbnail: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000&auto=format&fit=crop",
    genre: "Strategy",
    platforms: ["browser", "android", "pc"],
    nativeLink: "https://play.google.com/store/apps/details?id=io.anuken.mindustry",
    webUrl: "https://mindustry.pro/classic/", // Stable mirror
    status: "available"
  },
  {
    id: "2048",
    title: "2048 Nexus Edition",
    description: "لعبة الألغاز الكلاسيكية في ثوب نكسوس الأنيق. ادمج الأرقام للوصول إلى المربع 2048.",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop",
    genre: "Puzzle",
    platforms: ["browser"],
    webUrl: "https://play2048.co/",
    status: "available"
  },
  {
    id: "polyfield",
    title: "Polyfield Mobile",
    description: "لعبة تصويب من منظور الشخص الأول بسيطة وجميلة تعتمد على الرسوميات منخفضة المضلعات (Low Poly).",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop",
    genre: "Action",
    platforms: ["android"],
    nativeLink: "https://play.google.com/store/apps/details?id=com.MA.Polyfield",
    status: "available"
  }
];

export function ArcadeHub() {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [viewMode, setViewMode] = useState<"gallery" | "playing">("gallery");

  const handlePlayWeb = (game: Game) => {
    setActiveGame(game);
    setViewMode("playing");
  };

  if (viewMode === "playing" && activeGame) {
    return (
      <ArcadeArena 
        game={activeGame} 
        onBack={() => setViewMode("gallery")} 
      />
    );
  }

  return (
    <div className="min-h-full bg-slate-950 p-6 md:p-10 text-right overflow-y-auto custom-scrollbar">
      {/* Hero Section */}
      <div className="relative mb-12 rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-[400px] object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
        />
        
        <div className="absolute bottom-0 right-0 p-8 md:p-12 z-20 max-w-2xl">
          <Badge className="bg-amber-500 text-black font-black mb-4 px-4 py-1 animate-pulse">
            FEATURED GAME
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">Mindustry Classic</h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            استمتع بأقوى تجربة دفاع عن الأبراج مباشرة من متصفحك، أو قم بتحميل النسخة الكاملة لهاتفك لتكمل تقدمك في أي وقت.
          </p>
          <div className="flex flex-wrap gap-4 justify-end">
            <Button onClick={() => handlePlayWeb(GAMES_LIBRARY[0])} className="bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-indigo-600/20 gap-3 border-t border-white/20">
               العب الآن <Play className="size-5 fill-current" />
            </Button>
            <Button variant="outline" className="rounded-2xl h-14 px-8 font-black text-lg border-white/10 bg-white/5 hover:bg-white/10 gap-3" onClick={() => window.open(GAMES_LIBRARY[0].nativeLink, '_blank')}>
               تحميل للأندرويد <Download className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 flex-row-reverse">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 flex-row-reverse">
            <Gamepad2 className="text-primary" /> مكتبة الألعاب السيادية
          </h2>
          <p className="text-sm text-muted-foreground mr-9">ألعاب مفتوحة المصدر، بدون إعلانات مزعجة، وبسيادة كاملة.</p>
        </div>
        <div className="flex gap-2">
            <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 py-1.5 px-4 rounded-xl font-bold">Strategy</Badge>
            <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 py-1.5 px-4 rounded-xl font-bold">Action</Badge>
            <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 py-1.5 px-4 rounded-xl font-bold">Classic</Badge>
        </div>
      </div>

      {/* Stats/Sync Bridge - Professional Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
             <SaveBridgeManager 
                userId={user?.id || ""} 
                gameId="mindustry"
                className="h-full"
             />
          </div>
          <Card className="p-8 bg-amber-600/5 border-amber-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-6 border-dashed">
              <div className="size-20 bg-amber-600/20 rounded-[2rem] flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="size-10" />
              </div>
              <div className="text-center">
                  <h4 className="font-black text-white text-xl mb-2">بيئة آمنة ونظيفة</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                      جميع الألعاب المختارة هنا هي ألعاب مفتوحة المصدر (FOSS) أو مجانية تماماً، تضمن لك الخصوصية وعدم تتبع البيانات.
                  </p>
              </div>
          </Card>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {GAMES_LIBRARY.map((game) => (
          <div key={game.id} className="group relative">
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
              <img src={game.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 flex flex-col justify-end text-right">
                <div className="flex justify-end gap-1 mb-2">
                   {game.platforms.includes('browser') && <Monitor className="size-3 text-white/40" />}
                   {game.platforms.includes('android') && <Smartphone className="size-3 text-white/40" />}
                </div>
                <h3 className="text-xl font-black text-white mb-1">{game.title}</h3>
                <p className="text-[10px] text-slate-400 mb-4 line-clamp-2">{game.description}</p>
                
                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  {game.webUrl && (
                    <Button size="sm" onClick={() => handlePlayWeb(game)} className="bg-white text-black hover:bg-white/90 rounded-xl font-bold h-9">
                      العب الآن
                    </Button>
                  )}
                  {game.nativeLink && (
                    <Button variant="outline" size="sm" onClick={() => window.open(game.nativeLink, '_blank')} className="border-white/10 text-white rounded-xl font-bold h-9 bg-black/40 backdrop-blur-md">
                      تحميل Native
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {game.status === 'beta' && <Badge className="absolute top-4 left-4 bg-amber-500 text-black">BETA</Badge>}
          </div>
        ))}
        
        {/* Placeholder for future games */}
        <div className="aspect-[4/3] rounded-[2rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center opacity-20">
           <Zap className="size-10 mb-4" />
           <p className="font-bold">قريباً في نكسوس</p>
        </div>
      </div>
    </div>
  );
}
