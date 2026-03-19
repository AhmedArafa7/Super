"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Info } from "lucide-react";
import { useSettingsStore } from "@/lib/settings-store";
import { ALL_NAV_ITEMS } from "@/components/layout/app-sidebar";
import { useToast } from "@/hooks/use-toast";

export function SectionsManagement() {
  const { settings, updateSectionBeta } = useSettingsStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleToggleBeta = async (id: string, currentVal: boolean) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      await updateSectionBeta(id, !currentVal);
      toast({ title: !currentVal ? "تم تفعيل الوضع التجريبي" : "تم إلغاء الوضع التجريبي" });
    } catch (e) {
      toast({ variant: "destructive", title: "حدث خطأ أثناء التحديث" });
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex-row-reverse">
        <Info className="size-5 text-amber-500" />
        <p className="text-sm text-right text-amber-500 font-medium">الوضع التجريبي (BETA) يخفي القسم عن المستخدمين العاديين ويجعله متاحاً فقط للإدارة والمؤسسين لتجربته قبل الإطلاق.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
        {ALL_NAV_ITEMS.map((item) => {
          const isBeta = settings?.sections?.[item.id]?.isBeta ?? false;
          
          return (
            <Card key={item.id} className="p-6 glass border-white/5 rounded-3xl flex justify-between flex-row-reverse items-center gap-4">
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary">
                  <item.icon className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">{item.label}</h4>
                  <div className="flex gap-2 justify-end mt-1">
                    {item.restricted ? (
                      <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-[10px] uppercase">إدارة فقط</Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px] uppercase">عام</Badge>
                    )}
                    {isBeta && <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] uppercase font-black">BETA</Badge>}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Switch 
                  checked={isBeta} 
                  onCheckedChange={() => handleToggleBeta(item.id, isBeta)}
                  disabled={loading[item.id] || item.restricted} 
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
