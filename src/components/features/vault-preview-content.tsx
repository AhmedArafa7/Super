import React, { useState } from "react";
import dynamic from "next/dynamic";
import { X, Download, ExternalLink, FileText, Image as ImageIcon, Video as VideoIcon, Music, Edit3, Check, Trash2, Palette, Settings2, Loader2, Save, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { renameDriveFile } from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface VaultPreviewContentProps {
  asset: any;
  onClose: () => void;
  onRefresh?: () => void;
  isFloating?: boolean;
  onToggleFloating?: () => void;
}

/**
 * [STABILITY_ANCHOR: VAULT_PREVIEW_CONTENT_V1.0]
 * محتوى المعاينة الموحد - يمكن استخدامه داخل مودال أو كعرض متكامل.
 */
export function VaultPreviewContent({ 
  asset, 
  onClose, 
  onRefresh, 
  isFloating = false,
  onToggleFloating 
}: VaultPreviewContentProps) {
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(asset?.name || "");
  const [isRenaming, setIsRenaming] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'default' | 'dark' | 'glass' | 'sepia'>('default');

  const isImage = asset.mimeType?.includes('image');
  const isVideo = asset.mimeType?.includes('video');
  const isAudio = asset.mimeType?.includes('audio');
  
  const directUrl = `https://drive.google.com/uc?export=view&id=${asset.id}`;
  const previewUrl = `https://drive.google.com/file/d/${asset.id}/preview`;
  const viewUrl = `https://drive.google.com/file/d/${asset.id}/view?usp=sharing`;

  const handleRename = async () => {
    if (!newName || newName === asset.name) {
      setIsEditingName(false);
      return;
    }

    setIsRenaming(true);
    try {
      const res = await renameDriveFile(asset.id, newName);
      if (res.success) {
        toast({ title: "تم تغيير الاسم بنجاح", description: `الاسم الجديد: ${newName}` });
        onRefresh?.();
        setIsEditingName(false);
      } else {
        toast({ title: "فشل تغيير الاسم", description: res.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطأ في الاتصال", description: "تعذر إتمام طلب إعادة التسمية", variant: "destructive" });
    } finally {
      setIsRenaming(false);
    }
  };

  const themes = {
    default: "bg-black/40",
    dark: "bg-slate-950",
    glass: "bg-indigo-500/10 backdrop-blur-xl",
    sepia: "bg-[#704214]/20"
  };

  return (
    <div className={cn(
      "flex flex-col md:flex-row h-full w-full overflow-hidden",
      !isFloating && "rounded-3xl border border-white/5 bg-slate-900/20"
    )}>
      
      {/* Actions Sidebar (Customization & Controls) */}
      <aside className="w-full md:w-72 border-r border-white/5 bg-slate-900/40 p-6 flex flex-col gap-8 order-2 md:order-1">
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Settings2 className="size-3" /> إجراءات الملف
          </h4>
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditingName(true)}
              className="w-full justify-start rounded-xl border-white/5 bg-white/5 gap-3 h-11 text-xs font-bold hover:bg-white/10"
            >
              <Edit3 className="size-4 text-amber-400" /> إعـادة التسمية
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onToggleFloating}
              className="w-full justify-start rounded-xl border-white/5 bg-white/5 gap-3 h-11 text-xs font-bold hover:bg-white/10"
            >
              {isFloating ? (
                <>
                  <Minimize2 className="size-4 text-indigo-400" /> تثبيت العرض
                </>
              ) : (
                <>
                  <Maximize2 className="size-4 text-indigo-400" /> عرض عائم
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start rounded-xl border-white/5 bg-white/5 gap-3 h-11 text-xs font-bold hover:bg-white/10 opacity-50 cursor-not-allowed"
              disabled
            >
              <Trash2 className="size-4 text-red-400" /> حذف الملف قريباً
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Palette className="size-3" /> مظهر المعاينة
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(themes).map((t) => (
              <button
                key={t}
                onClick={() => setPreviewTheme(t as any)}
                className={cn(
                  "h-10 rounded-lg text-[10px] font-bold capitalize transition-all border",
                  previewTheme === t ? "bg-indigo-600 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
           <Button 
             className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl h-12 font-bold gap-2 text-xs shadow-lg shadow-indigo-600/20"
             onClick={() => window.open(directUrl, '_blank')}
           >
             <Download className="size-4" /> تحميل النسخة الأصلية
           </Button>
           <p className="text-[9px] text-muted-foreground text-center leading-relaxed px-4">
             لديك "تحكم سيادي" كامل على هذا الملف عبر سيرفر نكسوس العصبى.
           </p>
        </div>
      </aside>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col min-w-0 order-1 md:order-2 bg-black/20">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/30 shrink-0">
           <div className="flex items-center gap-4 flex-row-reverse text-right flex-1 min-w-0">
              {isEditingName ? (
                 <div className="flex items-center gap-2 w-full max-w-sm">
                    <Button 
                      size="icon" 
                      onClick={handleRename} 
                      disabled={isRenaming}
                      className="bg-emerald-600 hover:bg-emerald-500 size-10 rounded-xl shrink-0"
                    >
                      {isRenaming ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    </Button>
                    <Input 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                      className="h-10 bg-white/5 border-white/10 rounded-xl text-right text-sm focus-visible:ring-indigo-500"
                    />
                 </div>
              ) : (
                <div className="flex flex-col min-w-0">
                  <div dir="auto" className="text-white font-bold text-lg truncate pr-2 tracking-tight group flex items-center gap-3 justify-end">
                     <button onClick={() => { setIsEditingName(true); setNewName(asset.name); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded-md"><Edit3 className="size-3 text-muted-foreground" /></button>
                     {asset.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1 justify-end px-2">
                     <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[8px] h-4 py-0 font-mono tracking-tighter">VAULT_ASSET_{asset.id.substring(0,6)}</Badge>
                     <span className="text-[10px] text-muted-foreground font-mono uppercase truncate">{asset.mimeType}</span>
                  </div>
                </div>
              )}
           </div>
           <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5 text-muted-foreground shrink-0 ml-4"><X className="size-6" /></Button>
        </header>

        <div className={cn("flex-1 relative overflow-auto flex items-center justify-center p-8 transition-colors duration-500", themes[previewTheme])}>
          {isImage ? (
            <img 
              src={directUrl} 
              alt={asset.name} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:scale-[1.02]"
            />
          ) : isVideo ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
              <ReactPlayer
                url={directUrl}
                width="100%"
                height="100%"
                controls
                playing
                config={{ file: { attributes: { controlsList: 'nodownload' } } }}
              />
            </div>
          ) : (
            <iframe 
              src={previewUrl} 
              className="size-full min-h-[500px] border-none rounded-xl"
              title={asset.name}
            />
          )}
        </div>

        <footer className="h-16 border-t border-white/5 flex items-center justify-between px-8 bg-black/40 text-[10px] text-muted-foreground font-mono uppercase tracking-widest shrink-0">
           <div className="flex gap-4">
              <span>Format: {asset.mimeType}</span>
              <span>Size: {asset.size ? (parseInt(asset.size) / (1024*1024)).toFixed(2) + " MB" : "N/A"}</span>
           </div>
           <button onClick={() => window.open(viewUrl, '_blank')} className="hover:text-white transition-colors flex items-center gap-1">
              View in Google Drive <ExternalLink className="size-3" />
           </button>
        </footer>
      </div>
    </div>
  );
}
