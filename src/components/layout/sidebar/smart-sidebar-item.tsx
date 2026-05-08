'use client';

import React from "react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, 
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, 
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { 
  Star, Palette, PlusCircle, Settings2, Download, ExternalLink, Activity, 
  PanelTop, PanelBottom, PanelLeft, PanelRight, Orbit, Box, MoreVertical 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useSectionSettingsStore } from "@/lib/section-settings-store";
import { IconSafe } from "@/components/ui/icon-safe";

export function SmartSidebarItem({ item, activeTab, onTabChange, isCollapsed, isBeta }: any) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { defaultActions, setDefaultAction } = useSectionSettingsStore() as any;
  const { position } = useSidebarStore();
  
  const currentDefaultAction = defaultActions[item.id] || 'open';

  const executeAction = (action: string) => {
    switch (action) {
      case 'open':
        onTabChange(item.id);
        break;
      case 'settings':
        window.dispatchEvent(new CustomEvent('open-section-settings', { detail: { sectionId: item.id } }));
        break;
      case 'design':
        window.dispatchEvent(new CustomEvent('open-section-design', { detail: { sectionId: item.id } }));
        break;
      case 'feature':
        window.dispatchEvent(new CustomEvent('open-section-feature', { detail: { sectionId: item.id } }));
        break;
      case 'preload':
        window.dispatchEvent(new CustomEvent('open-section-preload', { detail: { sectionId: item.id } }));
        break;
      case 'set-pos-left':
        useSidebarStore.getState().setPosition('left');
        break;
      case 'set-pos-right':
        useSidebarStore.getState().setPosition('right');
        break;
      case 'set-pos-top':
        useSidebarStore.getState().setPosition('top');
        break;
      case 'set-pos-bottom':
        useSidebarStore.getState().setPosition('bottom');
        break;
      case 'set-pos-floating':
        useSidebarStore.getState().setPosition('floating');
        break;
      default:
        onTabChange(item.id);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <SidebarMenuItem onContextMenu={handleRightClick}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} dir="rtl">
        <SidebarMenuButton
          isActive={activeTab === item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "h-12 gap-4 px-4 rounded-xl transition-all justify-start relative group overflow-hidden",
            position === "right" ? "flex-row" : "flex-row-reverse",
            activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
          )}
        >
            <IconSafe 
              icon={item.icon} 
              className={cn(
                "size-5 shrink-0 transition-transform group-hover:scale-110",
                item.id === 'time' && "text-primary",
                item.id === 'micro-ide' && "text-emerald-400",
                item.id === 'health' && "text-red-400 font-bold",
                item.id === 'vault' && "text-amber-400",
                item.id === 'downloads' && "text-primary"
              )} 
            />
            {!isCollapsed && (
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <span className="font-medium truncate animate-in fade-in slide-in-from-right-1">{item.label}</span>
                {isBeta && (
                  <div className="text-[8px] px-1.5 h-4 border border-amber-500/30 text-amber-500 font-black tracking-widest uppercase rounded-full flex items-center shrink-0">BETA</div>
                )}
                {item.id === 'stream' && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-black px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase tracking-tighter shrink-0">PRO</div>
                )}
                {item.badge !== undefined && item.badge > 0 && !isBeta && (
                  <div className="mr-auto bg-indigo-500 text-white h-5 w-5 flex items-center justify-center text-[10px] rounded-full font-bold shrink-0">{item.badge}</div>
                )}
                
                {/* Options Trigger (Three Dots) - RESTORED */}
                <DropdownMenuTrigger asChild>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "size-7 opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-lg transition-all absolute top-1/2 -translate-y-1/2 z-20",
                      position === "left" ? "left-2" : "right-2"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(true);
                    }}
                   >
                     <MoreVertical className="size-4" />
                   </Button>
                </DropdownMenuTrigger>
              </div>
            )}
          </SidebarMenuButton>

        <DropdownMenuContent 
          align="end" 
          side={position === "left" ? "right" : "left"} 
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
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'open')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">فتح القسم</span>
                  {currentDefaultAction === 'open' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'settings')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">إعدادات القسم</span>
                  {currentDefaultAction === 'settings' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'design')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">تعديل التصميم</span>
                  {currentDefaultAction === 'design' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'preload')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">تحميل القسم</span>
                  {currentDefaultAction === 'preload' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
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
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
