"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Video, 
  Users, 
  PlaySquare, 
  Eye, 
  Heart, 
  MessageCircle,
  PlusCircle,
  TrendingUp,
  LayoutDashboard,
  Facebook,
  Instagram,
  Youtube,
  Link2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";

export function WeTubeStudioView() {
  const { user } = useAuth();
  
  const connectedPlatforms = user?.linkedAccounts || [];
  const isYoutubeConnected = connectedPlatforms.some(acc => acc.platform === 'youtube') || !!user?.linkedYouTubeChannel;

  const [channelStats, setChannelStats] = useState<{
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (isYoutubeConnected && user?.id) {
      setIsLoadingStats(true);
      fetch(`/api/auth/youtube/stats?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setChannelStats(data.data);
          }
        })
        .catch(err => console.error("Failed to fetch stats:", err))
        .finally(() => setIsLoadingStats(false));
    }
  }, [isYoutubeConnected, user?.id]);

  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return numStr;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };
  
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-6 md:p-8 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="size-8 text-indigo-500" />
            WeTube Studio
          </h1>
          <p className="text-slate-400 font-medium">أهلاً بك في مركز التحكم الخاص بك. هنا يمكنك إدارة محتواك ومتابعة أداء قناتك.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl px-6 h-12 gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
            <PlusCircle className="size-5" />
            رفع فيديو جديد
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { 
            label: "إجمالي المشاهدات", 
            value: channelStats ? formatNumber(channelStats.viewCount) : (isLoadingStats ? "..." : "0"), 
            icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" 
          },
          { 
            label: "المشتركون", 
            value: channelStats ? formatNumber(channelStats.subscriberCount) : (isLoadingStats ? "..." : "0"), 
            icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" 
          },
          { 
            label: "عدد الفيديوهات", 
            value: channelStats ? formatNumber(channelStats.videoCount) : (isLoadingStats ? "..." : "0"), 
            icon: Video, color: "text-amber-500", bg: "bg-amber-500/10" 
          },
          { 
            label: "التفاعل", 
            value: "--", 
            icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" 
          },
        ].map((stat, idx) => (
          <Card key={idx} className="bg-slate-900/40 border-white/5 backdrop-blur-xl p-6 rounded-[2rem] hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-400">{stat.label}</p>
                <p className="text-3xl font-black">
                   {isLoadingStats ? (
                     <span className="inline-block w-16 h-8 bg-white/10 rounded-md animate-pulse"></span>
                   ) : (
                     stat.value
                   )}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="size-6" />
              </div>
            </div>
            {/* مؤشر وهمي حتى الآن */}
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter opacity-50">
              <TrendingUp className="size-3" />
              قريباً
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Videos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black tracking-tight">آخر الفيديوهات المرفوعة</h2>
            <Button variant="link" className="text-indigo-400 font-bold hover:text-indigo-300">عرض الكل</Button>
          </div>
          <div className="space-y-4">
            {/* سنقوم بربط هذه القائمة قريباً ببيانات يوتيوب الحقيقية */}
            {!isLoadingStats && (!channelStats || parseInt(channelStats.videoCount) === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-900/20 rounded-[2rem] border border-dashed border-white/10 text-slate-500">
                <Video className="size-12 mb-4 opacity-20" />
                <p className="font-bold">لا يوجد فيديوهات مرفوعة حتى الآن</p>
              </div>
            ) : (
              // سيتم استبدال هذه ببيانات حقيقية في الخطوة القادمة
              <div className="text-xs text-slate-500 text-center py-4">جاري تجهيز قائمة الفيديوهات...</div>
            )}
          </div>
        </div>

        {/* Exclusive Nexus Features */}
        <div className="space-y-6">
          <h2 className="text-xl font-black tracking-tight px-2 text-indigo-400">مزايا Nexus Studio الحصرية</h2>
          <div className="space-y-4">
             {[
               { title: "التحسين بالذكاء الاصطناعي", desc: "تحسين جودة الفيديو تلقائياً باستخدام خوارزميات Nexus.", icon: BarChart3 },
               { title: "التوزيع العابر للمنصات", desc: "نشر المحتوى على عدة منصات بضغطة زر واحدة.", icon: Video },
               { title: "نظام الأرباح الذكي", desc: "تتبع أرباحك وعوائدك بشكل لحظي ودقيق.", icon: PlusCircle }
             ].map((feature, idx) => (
               <div key={idx} className="p-5 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4 mb-3">
                     <div className="size-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <feature.icon className="size-5" />
                     </div>
                     <h3 className="font-bold text-sm text-white">{feature.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
               </div>
             ))}
          </div>
        </div>
        
        {/* Connected Accounts Section */}
        <div className="space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-xl font-black tracking-tight">الحسابات المربوطة (Token Bridge)</h2>
             <Button variant="outline" className="border-white/10 text-white font-bold h-9 gap-2 bg-white/5 hover:bg-white/10">
                <Link2 className="size-4" />
                ربط حساب جديد
             </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
               { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
               { id: 'tiktok', name: 'TikTok', icon: Video, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
               { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
             ].map((platform) => {
               const isConnected = connectedPlatforms.some(acc => acc.platform === platform.id) || (platform.id === 'youtube' && user?.linkedYouTubeChannel);
               return (
                 <div key={platform.id} className={`p-5 rounded-[2rem] border ${isConnected ? platform.border : 'border-white/5'} bg-slate-900/40 backdrop-blur-xl flex items-center justify-between transition-all hover:bg-slate-900/60`}>
                    <div className="flex items-center gap-4">
                       <div className={`size-12 rounded-2xl ${platform.bg} flex items-center justify-center ${platform.color}`}>
                          <platform.icon className="size-6" />
                       </div>
                       <div>
                          <h3 className="font-bold text-white text-sm">{platform.name}</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {isConnected ? 'متصل' : 'غير متصل'}
                          </p>
                       </div>
                    </div>
                    {isConnected ? (
                       <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                          <CheckCircle2 className="size-4" />
                       </div>
                    ) : (
                       <Button 
                         size="sm" 
                         variant="ghost" 
                         className="h-8 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10"
                         onClick={() => {
                           if (platform.id === 'youtube') {
                             window.location.href = `/api/auth/youtube/login?userId=${user?.id}`;
                           }
                         }}
                       >
                         ربط
                       </Button>
                    )}
                 </div>
               );
             })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
