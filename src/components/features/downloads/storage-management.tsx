"use client";

import React from "react";
import { 
  Settings2, Info, BookOpen, Video, 
  GraduationCap, Cpu, Database, Heart, Trash2 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalStorage, AssetType } from "@/lib/global-storage-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: STORAGE_MANAGEMENT_NODE_V1.0]
 * وحدة إدارة الذاكرة المحلية والحدود.
 */
export function StorageManagement() {
  const { 
    cachedAssets, categoryLimits, removeAsset, toggleFavorite, 
    setCategoryLimit, getUsedSpaceByCategory 
  } = useGlobalStorage();

  const SECTIONS: { id: AssetType, label: string, icon: any, color: string }[] = [
    { id: 'quran', label: 'القرآن الكريم', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'video', label: 'WeTube (فيديو)', icon: Video, color: 'text-indigo-400' },
    { id: 'learning_asset', label: 'المكتبة التعليمية', icon: GraduationCap, color: 'text-blue-400' },
    { id: 'ai_model_data', label: 'النبضات العصبية (AI)', icon: Cpu, color: 'text-primary' },
  ];

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5 rounded-[3rem] p-8 text-right space-y-8">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">
            حدود السعة الفيزيائية
            <Settings2 className="text-indigo-400" />
          </h3>
          <div className="space-y-6">
            {SECTIONS.map(section => {
              const used = getUsedSpaceByCategory(section.id);
              const limit = categoryLimits[section.id];
              const percentage = Math.min(100, Math.round((used / limit) * 100));
              
              return (
                <div key={section.id} className="space-y-3">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <section.icon className={cn("size-4", section.color)} />
                      <span className="text-sm font-bold text-white">{section.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 border border-white/5">
                        <Input 
                          type="number" 
                          min="1"
                          className="w-16 h-8 bg-transparent border-none text-center text-xs p-0 focus-visible:ring-0"
                          value={limit}
                          onChange={(e) => setCategoryLimit(section.id, Math.max(1, Number(e.target.value)))}
                        />
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">MB</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{used.toFixed(1)} MB مستخدم</span>
                    </div>
                  </div>
                  <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", percentage > 85 ? "bg-red-500" : "bg-primary")} 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4 flex-row-reverse shadow-inner">
            <Info className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              بروتوكول التنظيف الذكي نشط: عند تجاوز الحد المخصص لأي قسم، سيقوم النظام تلقائياً بمسح أقدم الأصول المخزنة في ذلك القسم فقط لضمان توفير مساحة للأصول الجديدة.
            </p>
          </div>
        </Card>

        <Card className="glass border-white/5 rounded-[3rem] p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-row-reverse border-b border-white/5 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
              <Database className="text-indigo-400" />
              الأصول المزامنة حالياً
            </h3>
            <Badge variant="outline" className="border-indigo-500/20 text-indigo-400">{cachedAssets.length} ملف</Badge>
          </div>
          <ScrollArea className="flex-1 max-h-[400px]">
            <div className="space-y-2 pr-4">
              {cachedAssets.length === 0 ? (
                <div className="py-20 text-center opacity-20 italic text-sm">لا توجد أصول في الذاكرة المحلية</div>
              ) : (
                cachedAssets.sort((a,b) => b.timestamp - a.timestamp).map(asset => (
                  <div key={asset.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all flex-row-reverse group">
                    <div className="flex items-center gap-4 flex-row-reverse overflow-hidden">
                      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                        {SECTIONS.find(s => s.id === asset.type)?.icon ? 
                          React.createElement(SECTIONS.find(s => s.id === asset.type)!.icon, { className: "size-5 text-muted-foreground" }) : 
                          <Database className="size-5" />
                        }
                      </div>
                      <div className="text-right overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{asset.title}</p>
                        <div className="flex items-center gap-2 justify-end mt-0.5">
                          <span className="text-[8px] text-muted-foreground uppercase font-black">{asset.type}</span>
                          <div className="size-1 rounded-full bg-white/20" />
                          <span className="text-[8px] font-mono text-indigo-400">{asset.sizeMB} MB</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("size-8 rounded-lg", asset.isFavorite ? "text-red-500" : "text-muted-foreground")}
                        onClick={() => toggleFavorite(asset.id)}
                      >
                        <Heart className={cn("size-4", asset.isFavorite && "fill-current")} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 rounded-lg text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من مسح هذا الملف من الذاكرة المحلية؟')) {
                            removeAsset(asset.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
