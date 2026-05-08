'use client';

import React from "react";
import {
  DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { 
  Star, Palette, PlusCircle, Settings2, Download, ExternalLink, Activity, 
  PanelTop, PanelBottom, PanelLeft, PanelRight, Orbit, Box
} from "lucide-react";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useSectionSettingsStore } from "@/lib/section-settings-store";
import { NavItem } from "./nav-items";
import { useSidebarLayout } from "./use-sidebar-layout";

interface SidebarItemContextMenuProps {
  item: NavItem;
  onTabChange: (id: string) => void;
}

export function SidebarItemContextMenu({ item, onTabChange }: SidebarItemContextMenuProps) {
  const { defaultActions, setDefaultAction } = useSectionSettingsStore() as any;
  const { setPosition } = useSidebarStore();
  const { dropdownSide } = useSidebarLayout();
  const currentDefaultAction = defaultActions[item.id] || 'open';

  const executeAction = (action: string) => {
    switch (action) {
      case 'open': onTabChange(item.id); break;
      case 'settings': window.dispatchEvent(new CustomEvent('open-section-settings', { detail: { sectionId: item.id } })); break;
      case 'design': window.dispatchEvent(new CustomEvent('open-section-design', { detail: { sectionId: item.id } })); break;
      case 'feature': window.dispatchEvent(new CustomEvent('open-section-feature', { detail: { sectionId: item.id } })); break;
      case 'preload': window.dispatchEvent(new CustomEvent('open-section-preload', { detail: { sectionId: item.id } })); break;
      case 'set-pos-left': setPosition('left'); break;
      case 'set-pos-right': setPosition('right'); break;
      case 'set-pos-top': setPosition('top'); break;
      case 'set-pos-bottom': setPosition('bottom'); break;
      case 'set-pos-floating': setPosition('floating'); break;
      default: onTabChange(item.id);
    }
  };

  return (
    <DropdownMenuContent 
      align="end" 
      side={dropdownSide} 
      className="w-64 bg-slate-900/95 backdrop-blur-xl border-white/10 text-white p-2 rounded-xl shadow-2xl z-50 animate-in zoom-in-95"
    >
      <DropdownMenuLabel className="text-xs text-indigo-400 opacity-70 px-2 py-1.5 text-right">التحكم في {item.label}</DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-white/10" />
      
      <div className="p-1 space-y-0.5">
        <DropdownMenuItem onClick={() => executeAction('open')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-right flex-row-reverse">
          <ExternalLink className="size-4 text-white/70" />
          <span className="flex-1 text-sm">فتح القسم</span>
          {currentDefaultAction === 'open' && <Star className="size-3 text-amber-400 fill-amber-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => executeAction('settings')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-right flex-row-reverse">
          <Settings2 className="size-4 text-white/70" />
          <span className="flex-1 text-sm">إعدادات القسم العامة</span>
          {currentDefaultAction === 'settings' && <Star className="size-3 text-amber-400 fill-amber-400" />}
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator className="bg-white/10" />

      <div className="p-1 space-y-0.5">
        <DropdownMenuItem onClick={() => executeAction('design')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-right flex-row-reverse">
          <Palette className="size-4 text-white/70" />
          <span className="flex-1 text-sm">تخصيص المظهر والتصميم</span>
          {currentDefaultAction === 'design' && <Star className="size-3 text-amber-400 fill-amber-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => executeAction('feature')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-emerald-400 hover:text-emerald-300 text-right flex-row-reverse">
          <PlusCircle className="size-4" />
          <span className="flex-1 text-sm font-medium">إضافة ميزات متقدمة</span>
          {currentDefaultAction === 'feature' && <Star className="size-3 text-amber-400 fill-amber-400" />}
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator className="bg-white/10" />

      <div className="p-1 space-y-0.5">
        <DropdownMenuItem onClick={() => executeAction('preload')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-right flex-row-reverse">
          <Download className="size-4 text-white/70" />
          <span className="flex-1 text-sm">تفعيل التحميل المسبق</span>
          {currentDefaultAction === 'preload' && <Star className="size-3 text-amber-400 fill-amber-400" />}
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-right flex-row-reverse">
            <Activity className="size-4 text-white/70" />
            <span className="flex-1 text-sm">إجراء الضغط المزدوج</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-slate-800 border-white/10 text-white p-2 rounded-xl shadow-xl min-w-[180px]">
            {['open', 'settings', 'design', 'preload'].map(action => (
              <DropdownMenuItem key={action} onClick={() => setDefaultAction(item.id, action)} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                <span className="text-xs">{action === 'open' ? 'فتح القسم' : action === 'settings' ? 'إعدادات القسم' : action === 'design' ? 'تعديل التصميم' : 'تحميل القسم'}</span>
                {currentDefaultAction === action && <span className="text-xs">✅</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-indigo-300 text-right flex-row-reverse">
            <Box className="size-4" />
            <span className="flex-1 text-sm font-medium">تغيير تخطيط الواجهة</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-slate-900 border-white/10 text-white p-2 rounded-xl shadow-xl min-w-[200px]">
            <DropdownMenuItem onClick={() => executeAction('set-pos-left')} className="flex items-center gap-3 hover:bg-white/10 py-2 rounded-md flex-row-reverse text-right">
              <PanelLeft className="size-4" /> <span className="text-xs">الشريط الأيسر</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => executeAction('set-pos-right')} className="flex items-center gap-3 hover:bg-white/10 py-2 rounded-md flex-row-reverse text-right">
              <PanelRight className="size-4" /> <span className="text-xs">الشريط الأيمن</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => executeAction('set-pos-top')} className="flex items-center gap-3 hover:bg-white/10 py-2 rounded-md flex-row-reverse text-right">
              <PanelTop className="size-4" /> <span className="text-xs">شريط علوي</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => executeAction('set-pos-bottom')} className="flex items-center gap-3 hover:bg-white/10 py-2 rounded-md flex-row-reverse text-right">
              <PanelBottom className="size-4" /> <span className="text-xs">شريط سفلي</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => executeAction('set-pos-floating')} className="flex items-center gap-3 hover:bg-white/10 py-2 rounded-md text-amber-400 flex-row-reverse text-right">
              <Orbit className="size-4" /> <span className="text-xs font-bold">الوضع العائم (Nexus Orb)</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </div>
    </DropdownMenuContent>
  );
}
