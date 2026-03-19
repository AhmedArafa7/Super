
'use client';

import React from "react";
import { HardDrive, Database, Music, Trash2, Heart, ShieldCheck, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useQuranStore } from "@/lib/quran-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: STORAGE_VIEW_V5.0]
 * مدير الذاكرة السيادي - تم إضافة ميزة المزامنة الكلية للمصحف (نص وتفسير).
 */
export function StorageView() {
  const { cachedAssets, storageLimitMB, removeAsset, toggleFavorite, getTotalUsedSpace } = useGlobalStorage();
  const { syncAllQuranText, isBulkSyncing, bulkSyncProgress } = useQuranStore();
  
  const usedStorage = getTotalUsedSpace();
  const storagePercentage = Math.round((usedStorage / storageLimitMB) * 100);

  return (
    <div className="space-y-8 outline-none animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass border-white/5 rounded-[3rem] p-10 space-y-8 text-right shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 size-32 bg-indigo-500/5 blur-3xl -ml-16 -mt-16" />
          <h3 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">الحالة الفيزيائية للذاكرة <HardDrive className="text-indigo-400" /></h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-sm font-bold text-white">{usedStorage.toFixed(1)} MB مستخدم</span>
              <span className="text-xs text-muted-foreground">السعة الكلية: {storageLimitMB} MB</span>
            </div>
            <Progress value={storagePercentage} className="h-2 bg-white/5" />
          </div>
          
          <div className="pt-6 border-t border-white/5 space-y-4">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">مزامنة البيانات الكبرى</p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={syncAllQuranText}
                disabled={isBulkSyncing}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold gap-3 shadow-xl shadow-indigo-600/20"
              >
                {isBulkSyncing ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    جاري المزامنة... {bulkSyncProgress}%
                  </>
                ) : (
                  <>
                    <Download className="size-5" />
                    حفظ نص القرآن والتفسير كاملاً للأوفلاين
                  </>
                )}
              </Button>
              {isBulkSyncing && <Progress value={bulkSyncProgress} className="h-1 bg-white/5" />}
            </div>
          </div>
        </Card>

        <Card className="glass border-white/5 rounded-[3rem] p-10 space-y-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-white text-right">إعدادات النخاع المحلي</h3>
          <div className="space-y-6 text-right">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-bold">بروتوكول حماية المفضلات</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">الأصول المحمية لن تمسح أبداً تلقائياً.</p>
              </div>
              <ShieldCheck className="size-6 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-bold">التنبيهات العصبية</p>
                <p className="text-[9px] text-muted-foreground">إرسال إشعارات الأذكار والمزامنة</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 uppercase text-[8px] font-bold">Active</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between flex-row-reverse bg-white/5">
          <div className="text-right">
            <h3 className="text-xl font-bold text-white">الأصول المزامنة في العقدة</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1">Managed Physical Assets</p>
          </div>
          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 h-8 px-4 rounded-xl">{cachedAssets.length} Assets</Badge>
        </div>
        <ScrollArea className="h-[450px]">
          <div className="divide-y divide-white/5">
            {cachedAssets.length === 0 ? (
              <div className="p-24 text-center opacity-30 flex flex-col items-center gap-4">
                <Database className="size-16" />
                <p className="text-lg font-bold">لا توجد بيانات مخزنة حالياً في النخاع المحلي.</p>
              </div>
            ) : (
              cachedAssets.sort((a,b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1)).map(asset => (
                <div key={asset.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse group">
                  <div className="flex items-center gap-5 flex-row-reverse">
                    <div className={cn(
                      "size-14 rounded-[1.25rem] flex items-center justify-center border transition-all shadow-xl",
                      asset.isFavorite ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    )}>
                      {asset.type === 'quran' ? <Music className="size-7" /> : <Database className="size-7" />}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        {asset.isFavorite && <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-[8px] h-4 font-black">PROTECTED</Badge>}
                        <p className="font-bold text-white text-base">{asset.title}</p>
                      </div>
                      <div className="flex items-center gap-2 justify-end opacity-50">
                        <span className="text-[10px] uppercase font-mono tracking-widest">{asset.type}</span>
                        <div className="size-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-mono">{asset.sizeMB} MB</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleFavorite(asset.id)}
                      className={cn("size-12 rounded-2xl transition-all border border-transparent", asset.isFavorite ? "text-red-500 bg-red-500/5 border-red-500/10" : "text-muted-foreground hover:text-red-400 hover:bg-white/5")}
                    >
                      <Heart className={cn("size-6", asset.isFavorite && "fill-current")} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-12 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all" 
                      onClick={() => removeAsset(asset.id)}
                    >
                      <Trash2 className="size-6" />
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
