'use client';

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconSafe } from "@/components/ui/icon-safe";
import { NavItem } from "./nav-items";

/**
 * [STABILITY_ANCHOR: SIDEBAR_CUSTOMIZE_DIALOG_V1]
 * مكون موحد لنافذة تخصيص أقسام الشريط الجانبي.
 * يُستخدم في جميع أوضاع التخطيط (جانبي، أفقي، عائم) لضمان تجربة متسقة.
 */

interface SidebarCustomizeDialogProps {
  allItems: NavItem[];
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  /** Trigger variant: 'button' for vertical, 'icon' for compact layouts */
  variant?: 'button' | 'icon';
}

export function SidebarCustomizeDialog({ allItems, isPinned, togglePin, variant = 'button' }: SidebarCustomizeDialogProps) {
  const customizableItems = allItems.filter(i => !i.isPermanent);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'button' ? (
          <Button variant="ghost" className="w-full border border-dashed border-white/10 h-10 rounded-xl text-[10px] uppercase font-bold text-muted-foreground hover:bg-white/5 gap-3 flex-row-reverse">
            <IconSafe icon={MonitorSmartphone} className="size-4 text-primary" /> تخصيص القائمة
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-white/50 shrink-0">
            <MonitorSmartphone className="size-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إعدادات القائمة الجانبية</DialogTitle>
          <DialogDescription className="text-right">اختر الأقسام المفضلة لتثبيتها في شريط التنقل.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] mt-4">
          <div className="grid grid-cols-1 gap-2 pr-4">
            {customizableItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 glass border-white/5 rounded-2xl hover:bg-white/5 transition-all flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <IconSafe icon={item.icon} className="size-5" />
                  </div>
                  <span className="font-bold text-sm text-white">{item.label}</span>
                </div>
                <Button size="sm" variant={isPinned(item.id) ? "default" : "outline"} className={cn("rounded-lg h-8 px-4", isPinned(item.id) ? "bg-primary" : "border-white/10")} onClick={() => togglePin(item.id)}>
                  {isPinned(item.id) ? "إلغاء التثبيت" : "ثبت"}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
