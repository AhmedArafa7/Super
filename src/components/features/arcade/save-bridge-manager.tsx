
"use client";

import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  Upload, 
  Download, 
  RefreshCw, 
  FileCheck, 
  AlertCircle,
  Clock,
  HardDrive,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadGameSave, listGameSaves, GameSaveMetadata } from "@/lib/arcade/save-service";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SaveBridgeManagerProps {
  userId: string;
  gameId: string;
  onSaveRestored?: (url: string) => void;
  className?: string;
}

/**
 * [STABILITY_ANCHOR: SAVE_BRIDGE_MANAGER_V1.0]
 * High-fidelity Save Manager for Nexus Arcade.
 * Provides real-time Firebase sync and professional UX.
 */
export function SaveBridgeManager({ userId, gameId, onSaveRestored, className }: SaveBridgeManagerProps) {
  const [saves, setSaves] = useState<GameSaveMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingSaves, setIsLoadingSaves] = useState(true);
  const [search, setSearch] = useState("");

  const refreshSaves = async () => {
    setIsLoadingSaves(true);
    const data = await listGameSaves(userId, gameId);
    setSaves(data);
    setIsLoadingSaves(false);
  };

  useEffect(() => {
    refreshSaves();
  }, [userId, gameId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      await uploadGameSave(userId, gameId, file, (pct) => setUploadProgress(pct));
      
      toast({
        title: "تم مزامنة التقدم",
        description: "تم رفع ملف الحفظ بنجاح إلى خزنة نكسوس السحابية.",
      });
      
      refreshSaves();
    } catch (err: any) {
      toast({
        title: "فشل الرفع",
        description: err.message || "حدث خطأ أثناء مزامنة الملف.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const filteredSaves = saves.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={cn("flex flex-col gap-6 text-right", className)}>
      {/* Sync Status Card */}
      <Card className="bg-slate-900/50 border-white/5 p-6 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex items-center justify-between flex-row-reverse mb-6">
          <div className="flex items-center gap-3 flex-row-reverse">
             <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                <Cloud className="size-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white">Cloud Save Bridge</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Nexus Universal Progress Sync</p>
             </div>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 py-1 px-3 rounded-lg flex items-center gap-2">
             <ShieldCheck className="size-3" /> وظيفي بالكامل
          </Badge>
        </div>

        {/* Step by Step Instruction */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-primary mb-1">STEP 01</p>
             <p className="text-xs text-white font-bold">صدّر ملف الـ Save من داخل اللعبة</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-primary mb-1">STEP 02</p>
             <p className="text-xs text-white font-bold">ارفع الملف هنا لمزامنته سحابياً</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-primary mb-1">STEP 03</p>
             <p className="text-xs text-white font-bold">حمّله من أي جهاز آخر واستكمله</p>
          </div>
        </div>

        {/* Upload Action */}
        <div className="relative">
          <input 
            type="file" 
            accept=".msav,.zip,.json" 
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className={cn(
            "h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-3 transition-all",
            isUploading ? "opacity-50" : "hover:bg-white/5 hover:border-primary/40"
          )}>
            {isUploading ? (
              <div className="w-2/3 space-y-3">
                 <div className="flex justify-between text-[10px] font-bold text-white uppercase">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                 </div>
                 <Progress value={uploadProgress} className="h-1.5 bg-white/5" />
              </div>
            ) : (
              <>
                <div className="size-10 bg-white/5 rounded-full flex items-center justify-center text-white/40">
                   <Upload className="size-5" />
                </div>
                <p className="text-sm font-bold text-white/60">اسحب ملف الحفظ هنا أو انقر للرفع</p>
                <p className="text-[9px] text-muted-foreground">Supported: .msav, .zip, .json</p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Cloud Saves List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-row-reverse px-2">
           <h4 className="font-black text-white text-lg flex items-center gap-3 flex-row-reverse">
              <HardDrive className="size-5 text-indigo-400" /> الملفات المزامنة سحابياً
           </h4>
           <Button variant="ghost" size="sm" onClick={refreshSaves} className="text-muted-foreground hover:text-white rounded-xl">
              <RefreshCw className={cn("size-4 mr-2", isLoadingSaves && "animate-spin")} /> تحديث
           </Button>
        </div>

        <ScrollArea className="max-h-[300px] pr-4">
          {isLoadingSaves ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
               <Loader2 className="size-8 text-primary/40 animate-spin" />
               <p className="text-xs text-white/20 font-black uppercase tracking-widest">Neural Sync in Progress</p>
            </div>
          ) : filteredSaves.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-white/5">
                <FileCheck className="size-12 text-white/5 mx-auto mb-4" />
                <p className="text-sm text-white/40">لا يوجد ملفات حفظ سحابية حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSaves.map((save) => (
                <div key={save.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between flex-row-reverse group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4 flex-row-reverse text-right">
                    <div className="size-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                       <Clock className="size-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-white truncate max-w-[200px]">{save.name}</p>
                       <p className="text-[9px] text-muted-foreground font-mono">
                         {new Date(save.updatedAt).toLocaleString('ar-EG')} • {(save.size / 1024).toFixed(1)} KB
                       </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:text-white gap-2 font-bold"
                      onClick={() => window.open(save.downloadUrl, '_blank')}
                    >
                       تحميل <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3 flex-row-reverse">
          <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-500/80 leading-relaxed text-right">
             <b>ملاحظة هندسية:</b> نكسوس لا يقوم "باختراق" تخزين اللعبة الداخلي احتراماً للخصوصية. المزامنة تتم يدوياً عبر رفع الملفات المصدرة لضمان بقاء بياناتك تحت سيادتك الكاملة.
          </p>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <RefreshCw className={cn("animate-spin", className)} />;
}
