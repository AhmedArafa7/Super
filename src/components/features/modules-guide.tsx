
"use client";

import React, { useState, useMemo } from "react";
import { DETAILED_MODULES, ModuleCategory, DetailedModule } from "./modules-data";
import { getVisibleNavItems, ALL_NAV_ITEMS } from "@/components/layout/app-sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { useSettingsStore } from "@/lib/settings-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ArrowRight, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  core: "العصب الرئيسي",
  communication: "التواصل والشبكات",
  productivity: "الإنتاجية والأدوات",
  learning: "المعرفة والتعلم",
  tools: "أدوات متقدمة",
  management: "إدارة النظام",
  community: "مجتمع المنصة"
};

export function ModulesGuide({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user } = useAuth();
  const { settings } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ModuleCategory | 'all'>('all');

  // الاستخراج الذكي: جلب الأقسام المُسمح للمستخدم الحالي برؤيتها فقط
  const allowedItems = useMemo(() => {
    return getVisibleNavItems(user, settings, ALL_NAV_ITEMS).map(item => item.id);
  }, [user, settings]);

  // دمج بيانات الدليل مع قائمة الصلاحيات وعمليات البحث
  const filteredModules = useMemo(() => {
    return DETAILED_MODULES.filter(module => {
      // 1. الفلترة الأمنية: هل يمتلك صلاحية لرؤية هذا القسم؟
      if (!allowedItems.includes(module.id)) return false;

      // 2. فلترة البحث
      const matchesSearch = 
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        module.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.detailedDesc.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 3. فلترة التصنيف
      const matchesCategory = activeCategory === 'all' || module.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allowedItems, searchQuery, activeCategory]);

  const categoriesInUse = useMemo(() => {
    const cats = new Set<ModuleCategory>();
    DETAILED_MODULES.forEach(m => {
      if (allowedItems.includes(m.id)) cats.add(m.category);
    });
    return Array.from(cats);
  }, [allowedItems]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 uppercase font-black tracking-widest text-[10px] gap-2">
            <Sparkles className="size-3" /> دليل المزامنة العصبية
          </Badge>
        </div>
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight">Nexus Architecture</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          دليلك الشامل لتعظيم الاستفادة من المنصة. يُعرض لك فقط الأدوات والميزات التي تُطابق رتبة حسابك وصلاحياتك الحالية.
        </p>

        <div className="relative max-w-md mx-auto mt-8">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search className="size-5 text-muted-foreground" />
          </div>
          <Input 
            dir="auto"
            type="text"
            placeholder="ابحث عن أداة، واسأل: ماذا يفعل هذا القسم؟..."
            className="w-full bg-slate-900/50 border-white/10 text-right pr-12 h-14 rounded-2xl focus-visible:ring-primary/50 text-white shadow-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* شريط الفئات */}
      <div className="flex flex-wrap items-center justify-center gap-2 flex-row-reverse">
        <Badge
          className={cn(
            "px-5 py-2.5 rounded-full cursor-pointer transition-all border text-sm font-bold",
            activeCategory === 'all' 
              ? "bg-white text-black border-transparent shadow-lg shadow-white/10" 
              : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
          )}
          onClick={() => setActiveCategory('all')}
        >
          كل الأقسام الشغالة
        </Badge>
        {categoriesInUse.map(cat => (
          <Badge
            key={cat}
            className={cn(
              "px-5 py-2.5 rounded-full cursor-pointer transition-all border text-sm font-bold",
              activeCategory === cat 
                ? "bg-white text-black border-transparent shadow-lg shadow-white/10" 
                : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
            )}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </Badge>
        ))}
      </div>

      {/* شبكة الأدلة */}
      {filteredModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-30 border-2 border-dashed border-white/5 rounded-[3rem] text-center w-full">
          <Layers className="size-16 mb-4" />
          <p className="text-xl font-bold">لم يتم العثور على أي قسم يطابق بحثك أو صلاحياتك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right pb-20">
          {filteredModules.map((module) => (
            <Card key={module.id} className="group p-6 glass border-white/5 hover:border-primary/40 rounded-[2.5rem] flex flex-col justify-between transition-all duration-500 shadow-2xl overflow-hidden relative">
              
              <div className={cn("absolute top-0 right-0 size-48 blur-[80px] -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-700", module.color.split(' ')[0])} />

              <div className="relative z-10 flex-1">
                <div className="flex items-start justify-between mb-6 flex-row-reverse">
                  <div className={cn("size-14 rounded-2xl flex items-center justify-center shadow-lg border backdrop-blur-md transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3", module.color)}>
                    <module.icon className="size-7" />
                  </div>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px] uppercase font-black tracking-widest">{CATEGORY_LABELS[module.category]}</Badge>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                <p className="text-sm text-primary font-medium mb-4 italic">{module.shortDesc}</p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{module.detailedDesc}</p>

                <div className="space-y-3 mb-8">
                  <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest border-b border-white/5 pb-2">كيف تستفيد من هذا القسم؟</p>
                  <ul className="space-y-2">
                    {module.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-white/80 flex-row-reverse">
                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => onNavigate(module.id)}
                className="relative z-10 w-full mt-4 flex items-center justify-center gap-2 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all group-hover:border-primary/50 group-hover:bg-primary/20"
              >
                انتقل للقسم <ChevronLeft className="size-4 opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
