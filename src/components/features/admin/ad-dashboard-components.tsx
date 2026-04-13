
"use client";

import React from "react";
import { BarChart3, Zap, Globe, Trash2, Edit3, Tag, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ad } from "@/lib/ads-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: AD_DASHBOARD_COMPONENTS_V1.0]
 * Modular atomic components for the Ad Management dashboard.
 */

export function AdStatsPanel({ totalImpressions, totalClicks, avgCTR }: { totalImpressions: number, totalClicks: number, avgCTR: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 bg-indigo-600/10 border-indigo-500/20 rounded-3xl flex flex-col items-center justify-center gap-2">
        <BarChart3 className="text-indigo-400 size-6" />
        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">إجمالي المشاهدات</p>
        <h3 className="text-2xl font-black text-white">{totalImpressions.toLocaleString()}</h3>
      </Card>
      <Card className="p-6 bg-amber-600/10 border-amber-500/20 rounded-3xl flex flex-col items-center justify-center gap-2">
        <Zap className="text-amber-400 size-6" />
        <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest">إجمالي النقرات</p>
        <h3 className="text-2xl font-black text-white">{totalClicks.toLocaleString()}</h3>
      </Card>
      <Card className="p-6 bg-emerald-600/10 border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center gap-2">
        <Globe className="text-emerald-400 size-6" />
        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">معدل التحويل المتوسط</p>
        <h3 className="text-2xl font-black text-white">{avgCTR.toFixed(2)}%</h3>
      </Card>
    </div>
  );
}

export function AdCampaignCard({ ad, onDelete }: { ad: Ad, onDelete: (id: string) => void }) {
  const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
  
  return (
    <Card className="p-8 glass border-white/5 rounded-[2.5rem] group relative overflow-hidden transition-all hover:bg-white/[0.02]">
      <div className="flex justify-between items-start flex-row-reverse mb-6">
        <div className="text-right">
          <h4 className="font-black text-white text-xl leading-tight">{ad.title}</h4>
          <div className="flex flex-wrap gap-1 justify-end mt-2">
            {ad.targetCategories?.map(c => (
              <Badge key={c} variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 py-0">{c}</Badge>
            ))}
            <Badge variant="outline" className="text-[10px] opacity-40 border-white/10 uppercase tracking-tighter">
                {ad.type}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 rounded-xl" onClick={() => onDelete(ad.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
        <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">المشاهدات</p>
          <p className="text-lg font-black text-white">{ad.impressions || 0}</p>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">النقرات</p>
          <p className="text-lg font-black text-amber-500">{ad.clicks || 0}</p>
        </div>
        <div className="text-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <p className="text-[8px] text-indigo-400 uppercase font-black mb-1">CTR</p>
          <p className="text-lg font-black text-indigo-400">{ctr.toFixed(1)}%</p>
        </div>
      </div>
    </Card>
  );
}
