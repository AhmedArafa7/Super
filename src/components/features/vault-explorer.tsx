"use client";

import React, { useState, useEffect } from "react";
import { 
  HardDrive, Plus, Search, Grid, List, 
  FileText, Video, Music, 
  ExternalLink, Clock, Star, 
  ShieldCheck, Loader2, RefreshCw, Eye, AlertTriangle, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeatureHeader } from "@/components/ui/feature-header";
import { GlassCard } from "@/components/ui/glass-card";
import { SecurityBadge } from "@/components/ui/security-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchDriveFolderFiles } from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VaultPreviewModal } from "./vault-preview-modal";
import { VaultPreviewContent } from "./vault-preview-content";

const VAULT_FOLDER_ID = "16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g";
const DRIVE_SHARE_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

interface DriveAsset {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
}

interface VaultExplorerProps {
  folderId?: string | string[];
  hideSidebar?: boolean;
  title?: string;
}

/**
 * [STABILITY_ANCHOR: VAULT_EXPLORER_V2.0_MERGED]
 * مستكشف الخزنة المتطور — Nexus V2
 */
export function VaultExplorer({ 
  folderId = VAULT_FOLDER_ID, 
  hideSidebar = false,
  title = "الخزنة المركزية"
}: VaultExplorerProps) {
  const { toast } = useToast();
  const [assets, setAssets] = useState<DriveAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [isKeyMissing, setIsKeyMissing] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | string[]>(folderId);
  const [folderStack, setFolderStack] = useState<{id: string | string[], name: string}[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<DriveAsset | null>(null);
  const [previewMode, setPreviewMode] = useState<'integrated' | 'floating'>('integrated');

  useEffect(() => {
    loadRealDriveData(currentFolderId);
  }, [currentFolderId]);

  const loadRealDriveData = async (fId: string | string[] = currentFolderId) => {
    setIsLoading(true);
    setIsKeyMissing(false);
    try {
      const results = Array.isArray(fId) 
        ? (await Promise.all(fId.map(id => fetchDriveFolderFiles(id)))).flat()
        : await fetchDriveFolderFiles(fId);
      setAssets(results || []);
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

  return (
    <div className={cn("flex h-full font-sans text-right", hideSidebar ? "bg-transparent" : "bg-slate-950")}>
      {!hideSidebar && (
        <aside className="w-72 border-l border-white/5 bg-slate-900/40 p-6 flex flex-col gap-8 hidden lg:flex">
          <Button 
            className="w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-xl font-bold gap-3 flex-row-reverse"
            onClick={() => window.open(DRIVE_SHARE_URL, '_blank')}
          >
            <Plus className="size-5" /> رفع ملف جديد
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
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all flex-row-reverse text-right group",
                  activeTab === item.id ? "bg-primary/10 text-primary font-bold" : "text-slate-400 hover:bg-white/5"
                )}
              >
                <item.icon className={cn("size-5", activeTab === item.id ? "text-primary" : "group-hover:text-white")} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <GlassCard variant="flat" className="mt-auto p-4 space-y-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <SecurityBadge 
                label={isKeyMissing ? "Sync Offline" : "Core Sync"} 
                className={isKeyMissing ? "bg-amber-500/10 text-amber-400" : ""}
                hideIcon={isKeyMissing}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed font-medium">
              {isKeyMissing 
                ? "تعذر الاتصال بالسيرفر. يرحى التحقق من المفاتيح." 
                : "البيانات محمية ومشفرة عبر النظام الأساسي."}
            </p>
          </GlassCard>
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-8 pt-8 shrink-0">
          <FeatureHeader 
            title={title}
            description={isKeyMissing ? "Maintenance Mode" : `${filteredAssets.length} Physical Assets Synced`}
            Icon={ShieldCheck}
            iconClassName="text-indigo-400"
            onRefresh={() => loadRealDriveData(currentFolderId)}
            isRefreshing={isLoading}
            action={
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode('grid')} 
                  className={cn("rounded-xl size-11", viewMode === 'grid' && "bg-white/10 text-white")}
                >
                  <Grid className="size-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode('list')} 
                  className={cn("rounded-xl size-11", viewMode === 'list' && "bg-white/10 text-white")}
                >
                  <List className="size-5" />
                </Button>
              </div>
            }
          />
          
          <div className="flex items-center gap-4 flex-row-reverse mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                dir="auto" 
                placeholder="البحث في سجل الخزنة..." 
                className="h-12 pr-11 bg-white/[0.03] border-white/10 rounded-2xl text-right text-sm focus-visible:ring-indigo-500 focus-visible:bg-white/[0.05] transition-all" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {folderStack.length > 0 && (
              <Button variant="outline" onClick={handleLevelUp} className="rounded-2xl h-12 gap-2 border-white/10 bg-white/5 hover:bg-white/10">
                <ArrowLeft className="size-4" /> العودة للأعلى
              </Button>
            )}
          </div>
        </header>

        <ScrollArea className="flex-1 p-8 pt-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 animate-in fade-in zoom-in duration-500">
               <div className="relative">
                <div className="size-16 border-4 border-primary/20 rounded-full" />
                <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
              </div>
              <p className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Neural Sync in Progress</p>
            </div>
          ) : isKeyMissing ? (
            <GlassCard variant="hover" className="max-w-2xl mx-auto my-20 text-center py-16 space-y-8 animate-in slide-in-from-bottom-8">
               <div className="size-24 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 mx-auto">
                 <AlertTriangle className="size-12 text-amber-500" />
               </div>
               <div className="space-y-3">
                 <h3 className="text-2xl font-bold text-white">بوابة المزامنة غير مستقرة</h3>
                 <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                   تعذر الوصول التلقائي لملفات Drive. يمكنك الانتقال للمجلد يدوياً لإدارة المحتوى.
                 </p>
               </div>
               <Button 
                 variant="outline"
                 className="rounded-2xl h-14 px-10 font-bold gap-3 border-amber-500/20 text-amber-400 hover:bg-amber-500/5"
                 onClick={() => window.open(DRIVE_SHARE_URL, '_blank')}
               >
                 <ExternalLink className="size-5" /> فتح المجلد يدوياً
               </Button>
            </GlassCard>
          ) : (
            <div className={cn(
              "pb-32 animate-in fade-in duration-700",
              viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6" : "space-y-3"
            )}>
              {filteredAssets.map(asset => (
                <GlassCard
                  key={asset.id}
                  variant="hover"
                  noPadding={viewMode === 'list'}
                  onClick={() => asset.mimeType.includes('folder') ? handleLevelDown(asset.id, asset.name) : setSelectedAsset(asset)}
                  className={cn(
                    "cursor-pointer group select-none",
                    viewMode === 'grid' ? "aspect-square flex flex-col" : "flex items-center px-6 py-4 flex-row-reverse"
                  )}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex justify-between items-start flex-row-reverse mb-auto">
                        <div className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          {getFileIcon(asset.mimeType)}
                        </div>
                        <Badge className="bg-black/40 backdrop-blur-md border hover:bg-black/60 transition-colors border-white/5 text-[9px] font-mono rounded-lg">
                          {asset.mimeType === 'application/vnd.google-apps.folder' ? "DIR" : "FILE"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p dir="auto" className="font-bold text-white text-base truncate group-hover:text-primary transition-colors">{asset.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">Verified Cloud Asset</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-6 flex-1 flex-row-reverse">
                       <div className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                          {getFileIcon(asset.mimeType)}
                        </div>
                        <div className="flex-1 text-right min-w-0">
                           <p dir="auto" className="font-bold text-white text-base truncate">{asset.name}</p>
                           <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase opacity-40">System Object Node</p>
                        </div>
                        <Button variant="ghost" size="icon" className="group-hover:bg-primary group-hover:text-white rounded-xl transition-all">
                           <Eye className="size-5" />
                        </Button>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </ScrollArea>

        {selectedAsset && previewMode === 'integrated' && (
           <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl animate-in zoom-in-95 duration-300 p-8">
              <VaultPreviewContent 
                asset={selectedAsset} 
                onClose={() => setSelectedAsset(null)} 
                onRefresh={() => loadRealDriveData(currentFolderId)}
                isFloating={false}
                onToggleFloating={() => setPreviewMode('floating')}
              />
           </div>
        )}

        <VaultPreviewModal 
          asset={previewMode === 'floating' ? selectedAsset : null} 
          onClose={() => setSelectedAsset(null)} 
          onRefresh={() => loadRealDriveData(currentFolderId)}
          onToggleFloating={() => setPreviewMode('integrated')}
        />
      </main>
    </div>
  );
}
