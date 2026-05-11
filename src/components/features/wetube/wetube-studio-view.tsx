"use client";

import React from "react";
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
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function WeTubeStudioView() {
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
          { label: "إجمالي المشاهدات", value: "124.5K", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "المشتركون الجدد", value: "+1,204", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "وقت المشاهدة", value: "4.2Kh", icon: PlaySquare, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "التفاعل", value: "89%", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((stat, idx) => (
          <Card key={idx} className="bg-slate-900/40 border-white/5 backdrop-blur-xl p-6 rounded-[2rem] hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-400">{stat.label}</p>
                <p className="text-3xl font-black">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="size-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
              <TrendingUp className="size-3" />
              +12% هذا الشهر
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
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all group cursor-pointer">
                <div className="size-20 rounded-2xl bg-slate-800 shrink-0 overflow-hidden relative border border-white/10">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-end p-1">
                      <span className="text-[8px] font-black bg-black/80 px-1 rounded">10:24</span>
                   </div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                   <h3 className="font-bold text-sm truncate group-hover:text-indigo-400 transition-colors">كيفية بناء تطبيقات الذكاء الاصطناعي في 2024 - الجزء {4-i}</h3>
                   <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>2.4K مشاهدة</span>
                      <span className="size-1 rounded-full bg-slate-700" />
                      <span>منذ {i+1} أيام</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex flex-col items-end gap-1 px-4 border-r border-white/5">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                         <MessageCircle className="size-3" /> 24
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                         <Heart className="size-3" /> 152
                      </div>
                   </div>
                </div>
              </div>
            ))}
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
      </div>
    </div>
  );
}
