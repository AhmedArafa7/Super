
"use client";

import React from "react";
import { LayoutGrid, Laptop, Boxes, Briefcase, Terminal, GraduationCap, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainCategory } from "@/lib/market-store";

export const MAIN_CATEGORIES = [
  { id: 'all', label: 'كل القطاعات', icon: LayoutGrid },
  { id: 'electronics', label: 'الإلكترونيات', icon: Laptop },
  { id: 'digital_assets', label: 'الأصول الرقمية', icon: Boxes },
  { id: 'services', label: 'الخدمات التقنية', icon: Briefcase },
  { id: 'tools', label: 'أدوات AI', icon: Terminal },
  { id: 'education', label: 'المعرفة', icon: GraduationCap },
  { id: 'software', label: 'البرمجيات والعقد', icon: MonitorSmartphone },
];

interface MarketSidebarProps {
  currentCat: MainCategory;
  onSelect: (cat: MainCategory) => void;
}

export function MarketSidebar({ currentCat, onSelect }: MarketSidebarProps) {
  return (
    <aside className="w-64 border-r border-white/5 bg-slate-900/20 backdrop-blur-xl flex flex-col hidden lg:flex">
      <div className="p-6 border-b border-white/5">
        <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 text-right">نطاقات المتجر</h2>
        <nav className="space-y-1">
          {MAIN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id as MainCategory)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group flex-row-reverse",
                currentCat === cat.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <cat.icon className={cn("size-4 transition-colors", currentCat === cat.id ? "text-white" : "text-indigo-400 group-hover:text-primary")} />
              {cat.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
