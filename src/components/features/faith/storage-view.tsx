
"use client";

import React from "react";
import { HardDrive, Database, Music, Trash2, ZoomIn, ZoomOut, Heart, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: STORAGE_VIEW_V2]
 * مدير الذاكرة المطور - يدعم إدارة المفضلات المحمية من الحذف التلقائي.
 */
export function StorageView() {
  const { cachedAssets, storageLimitMB, removeAsset, toggleFavorite, getTotalUsedSpace } = useGlobalStorage();
  
  const usedStorage = getTotalUsedSpace();
  const storagePercentage = Math.round((usedStorage / storageLimitMB) * 100);

  return (
    <div className="space-y-8 outline-none animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass border-white/5 rounded-[3rem] p-10 space-y-8 text-right shadow-2xl">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">الحالة الفيزيائية للذاكرة <HardDrive className="text-indigo-400" /></h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-sm font-bold text-white">{usedStorage.toFixed(1)} MB مستخدم</span>
              <span className="text-xs text-muted-foreground">الإجمالي: {storageLimitMB} MB</span>
            </div>
            <Progress value={storagePercentage} className="h-2 bg-white/5" />
          </div>
          <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 flex items-start gap-4 flex-row-reverse">
            <ShieldCheck className="size-6 text-indigo-400 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed text-right">
              نظام "المفضلات" يحمي ملفاتك من الحذف. عند امتلاء الذاكرة، يتم مسح أقدم الأصول **غير المفضلة** فقط لتوفير مساحة.
            </p>
          </div>
        </Card>

        <Card className="glass border-white/5 rounded-[3rem] p-10 space-y-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-white text-right">إعدادات النخاع المحلي</h3>
          <div className="space-y-6 text-right">
            <div className="flex items-center justify-between flex-row-reverse">
              <Label className="text-sm font-bold">حجم خط القراءة</Label>
              <div className="flex items-center gap-4 w-48">
                <ZoomOut className="size-4 opacity-40" />
                <Slider defaultValue={[24]} min={16} max={42} step={1} />
                <ZoomIn className="size-4 opacity-40" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-bold">التنبيهات العصبية</p>
                <p className="text-[10px] text-muted-foreground">إرسال إشعارات الأذكار والمزامنة</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-500/20 bg-green-500/5 uppercase text-[8px] font-bold">نشط</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between flex-row-reverse">
          <h3 className="text-xl font-bold text-white">الأصول المزامنة في الذاكرة الحية</h3>
          <Badge variant="secondary" className="bg-white/5 border-white/10">{cachedAssets.length} Assets</Badge>
        </div>
        <ScrollArea className="h-96">
          <div className="divide-y divide-white/5">
            {cachedAssets.length === 0 ? (
              <div className="p-20 text-center opacity-30 flex flex-col items-center">
                <Database className="size-12 mb-4" />
                <p>لا توجد بيانات مخزنة حالياً في العقدة المحلية.</p>
              </div>
            ) : (
              cachedAssets.sort((a,b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1)).map(asset => (
                <div key={asset.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse group">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className={cn(
                      "size-12 rounded-2xl flex items-center justify-center border transition-all",
                      asset.isFavorite ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    )}>
                      {asset.type === 'quran' ? <Music className="size-6" /> : <Database className="size-6" />}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {asset.isFavorite && <Heart className="size-3 text-red-500 fill-current" />}
                        <p className="font-bold text-white text-sm">{asset.title}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase">{asset.type} • {asset.sizeMB} MB</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleFavorite(asset.id)}
                      className={cn("size-10 rounded-xl", asset.isFavorite ? "text-red-500 bg-red-500/5" : "text-muted-foreground hover:text-red-400")}
                    >
                      <Heart className={cn("size-5", asset.isFavorite && "fill-current")} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-10 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl" 
                      onClick={() => removeAsset(asset.id)}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
