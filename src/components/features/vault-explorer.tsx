"use client";

import React, { useState, useEffect } from "react";
import { 
  HardDrive, Plus, Search, Grid, List, 
  MoreVertical, FileText, Video, Music, 
  ExternalLink, Trash2, Clock, Star, 
  ShieldCheck, Loader2, Info, ArrowLeft, X, RefreshCw, Eye, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchDriveFolderFiles } from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const VAULT_FOLDER_ID = "16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g";
const DRIVE_SHARE_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

interface VaultExplorerProps {
  folderId?: string | string[];
  hideSidebar?: boolean;
  title?: string;
  icon?: React.ReactNode;
}

/**
 * [STABILITY_ANCHOR: NATIVE_VAULT_V2.2]
 * مستكشف الخزنة المطور - يعالج حالات تعطل الـ API بدون إظهار أخطاء برمجية للمستخدم.
 */
export function VaultExplorer({ 
  folderId = VAULT_FOLDER_ID, 
  hideSidebar = false,
  title = "استعراض الخزنة المركزية",
  icon = <ShieldCheck className="size-5 text-indigo-400" />
}: VaultExplorerProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [isKeyMissing, setIsKeyMissing] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | string[]>(folderId);
  const [folderStack, setFolderStack] = useState<{id: string | string[], name: string}[]>([]);

  useEffect(() => {
    loadRealDriveData(currentFolderId);
  }, [currentFolderId]);

  const loadRealDriveData = async (fId: string | string[] = currentFolderId) => {
    setIsLoading(true);
    setIsKeyMissing(false);
    try {
      let allFiles: any[] = [];
      
      if (Array.isArray(fId)) {
        // Fetch from multiple sources if it's an array
        const results = await Promise.all(fId.map(id => fetchDriveFolderFiles(id)));
        allFiles = results.flat();
      } else {
        allFiles = await fetchDriveFolderFiles(fId);
      }
      
      setAssets(allFiles || []);
      setIsKeyMissing(false);
    } catch (err) {
      console.warn("Vault Sync Interrupted:", err);
      setIsKeyMissing(true); 
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('video')) return <Video className="size-6 text-indigo-400" />;
    if (mimeType.includes('audio')) return <Music className="size-6 text-emerald-400" />;
    if (mimeType.includes('image')) return <Eye className="size-6 text-amber-400" />;
    if (mimeType.includes('folder')) return <HardDrive className="size-6 text-primary" />;
    return <FileText className="size-6 text-blue-400" />;
  };

  const filteredAssets = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const formatSize = (bytes?: string, mimeType?: string) => {
    if (mimeType?.includes('folder')) return "مجلد";
    if (!bytes) return "Unknown";
    const mb = parseInt(bytes) / (1024 * 1024);
    if (mb < 0.1) return "< 0.1 MB";
    return `${mb.toFixed(1)} MB`;
  };

  const handleLevelDown = (id: string, name: string) => {
    setFolderStack([...folderStack, { id: currentFolderId, name: folderStack.length === 0 ? "الرئيسية" : assets.find(a => a.id === currentFolderId)?.name || "السابق" }]);
    setCurrentFolderId(id);
  };

  const handleLevelUp = () => {
    const newStack = [...folderStack];
    const parent = newStack.pop();
    if (parent) {
      setFolderStack(newStack);
      setCurrentFolderId(parent.id);
    }
  };

  const getPreviewUrl = (asset: any) => {
    if (asset.mimeType.includes('folder')) return asset.webViewLink;
    return `https://drive.google.com/file/d/${asset.id}/view?usp=sharing`;
  };

  return (
    <div className={cn("flex h-full font-sans text-right", hideSidebar ? "bg-transparent rounded-3xl" : "bg-slate-950")}>
      {/* Sidebar */}
      {!hideSidebar && (
      <aside className="w-64 border-l border-white/5 bg-slate-900/40 p-6 flex flex-col gap-8 hidden lg:flex">
        <Button 
          className="w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 shadow-xl font-bold gap-3 flex-row-reverse"
          onClick={() => window.open(DRIVE_SHARE_URL, '_blank')}
        >
          <Plus className="size-6" /> رفع ملف جديد
        </Button>

        <nav className="space-y-1">
          {[
            { id: 'all', label: 'ملفاتي السحابية', icon: HardDrive },
            { id: 'recent', label: 'الأخيرة', icon: Clock },
            { id: 'favorites', label: 'المميزة بنجمة', icon: Star },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all flex-row-reverse text-right",
                activeTab === item.id ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5"
              )}
            >
              <item.icon className="size-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-3">
          <div className="flex items-center justify-between flex-row-reverse text-[10px] font-bold">
            <span className="text-indigo-400">Nexus Vault Status</span>
            <span className={cn(isKeyMissing ? "text-amber-400" : "text-green-400")}>
              {isKeyMissing ? "Sync Offline" : "Nexus Core Sync"}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
            {isKeyMissing 
              ? "تعذر الاتصال بالسيرفر. يرجى التأكد من تهيئة Google API Keys في إعدادات المشروع." 
              : "تعمل الخزنة الآن بنظام المزامنة السيادية (Core Sync). البيانات محمية ومشفرة عبر السيرفر."}
          </p>
        </div>
      </aside>
      )}

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {!hideSidebar && (
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-md shrink-0 flex-row-reverse">
          <div className="relative w-full max-w-xl">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              dir="auto" 
              placeholder="البحث في ملفات الخزنة..." 
              className="h-10 pr-10 bg-white/5 border-white/10 rounded-xl text-right text-sm focus-visible:ring-indigo-500" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {folderStack.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleLevelUp} className="rounded-xl gap-2 text-indigo-400 hover:text-indigo-300">
                <ArrowLeft className="size-4" /> العودة
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); loadRealDriveData(currentFolderId); }} className="rounded-xl hover:bg-white/5"><RefreshCw className={cn("size-4", isLoading && "animate-spin")} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={cn("rounded-xl", viewMode === 'grid' && "bg-white/10 text-white")}><Grid className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={cn("rounded-xl", viewMode === 'list' && "bg-white/10 text-white")}><List className="size-4" /></Button>
          </div>
        </header>
        )}

        {hideSidebar && (
          <div className="flex items-center justify-between px-8 py-4 shrink-0 flex-row-reverse gap-4 bg-black/20 border-b border-white/5">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  dir="auto" 
                  placeholder="البحث في ملفات الخزنة..." 
                  className="h-10 pr-10 bg-white/5 border-white/10 rounded-xl text-right text-sm focus-visible:ring-indigo-500 w-full" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); loadRealDriveData(currentFolderId); }} className="rounded-xl hover:bg-white/5"><RefreshCw className={cn("size-4", isLoading && "animate-spin")} /></Button>
                <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={cn("rounded-xl", viewMode === 'grid' && "bg-white/10 text-white")}><Grid className="size-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={cn("rounded-xl", viewMode === 'list' && "bg-white/10 text-white")}><List className="size-4" /></Button>
              </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col p-8">
          {!hideSidebar && (
          <div className="flex items-center justify-between mb-8 flex-row-reverse">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {title}
              {icon}
            </h2>
            <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 text-[10px] uppercase">
              {isKeyMissing ? "Maintenance Mode" : `${filteredAssets.length} Physical Assets Synced`}
            </Badge>
          </div>
          )}

          <ScrollArea className="flex-1 h-full pr-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">جاري استدعاء السجل السحابي...</p>
              </div>
            ) : (isKeyMissing || (assets.length === 0 && !isLoading)) ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                <div className="size-24 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 shadow-2xl">
                  <AlertTriangle className="size-12 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">تعذر الاتصال التلقائي بـ Drive</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    يبدو أن مفتاح API غير صالح أو غير موجود. يمكنك الوصول للملفات ورفعها يدوياً عبر الرابط المباشر للمجلد.
                  </p>
                </div>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-8 h-12 font-bold gap-2"
                  onClick={() => window.open(DRIVE_SHARE_URL, '_blank')}
                >
                  <ExternalLink className="size-4" /> فتح المجلد يدوياً
                </Button>
              </div>
            ) : (
              <div className={cn(
                "pb-20",
                viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-2"
              )}>
                 {filteredAssets.map(asset => (
                  <Card 
                    key={asset.id} 
                    onClick={() => asset.mimeType.includes('folder') ? handleLevelDown(asset.id, asset.name) : window.open(getPreviewUrl(asset), '_blank')}
                    className={cn(
                      "group glass border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer relative",
                      viewMode === 'grid' ? "aspect-[4/3] flex flex-col p-6 rounded-[2rem]" : "flex items-center p-4 rounded-xl flex-row-reverse"
                    )}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex justify-between items-start flex-row-reverse mb-auto">
                          {getFileIcon(asset.mimeType)}
                          <Badge className="bg-black/40 text-[8px]">{formatSize(asset.size, asset.mimeType)}</Badge>
                        </div>
                        <div className="mt-4 text-right">
                          <p dir="auto" className="font-bold text-white text-sm truncate">{asset.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono mt-1">Verified Cloud Asset</p>
                        </div>
                        <div className="flex gap-2 mt-6">
                          <Button 
                            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-[10px] gap-2"
                            onClick={(e) => { e.stopPropagation(); window.open(getPreviewUrl(asset), '_blank'); }}
                          >
                            <Eye className="size-3" /> {asset.mimeType.includes('folder') ? 'فتح' : 'معاينة'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-4 flex-1 flex-row-reverse">
                        <div className="size-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">{getFileIcon(asset.mimeType)}</div>
                        <p dir="auto" className="font-bold text-white text-sm flex-1 truncate">{asset.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono hidden md:block">{formatSize(asset.size, asset.mimeType)}</p>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); window.open(getPreviewUrl(asset), '_blank'); }}><ExternalLink className="size-4 text-indigo-400" /></Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
