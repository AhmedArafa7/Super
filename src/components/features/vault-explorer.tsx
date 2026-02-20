
"use client";

import React, { useState, useEffect } from "react";
import { 
  HardDrive, Plus, Search, Grid, List, 
  MoreVertical, FileText, Video, Music, 
  ExternalLink, Trash2, Clock, Star, 
  ShieldCheck, Loader2, Info, ArrowLeft, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-provider";
import { initializeFirebase } from "@/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

interface VaultAsset {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'audio' | 'document' | 'other';
  authorId: string;
  createdAt: string;
  isFavorite: boolean;
}

/**
 * [STABILITY_ANCHOR: VAULT_EXPLORER_V1.0]
 * مستكشف الخزنة - واجهة تحاكي Google Drive وتخزن في الدرايف حصرياً.
 */
export function VaultExplorer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<VaultAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ title: "", url: "", type: 'document' as any });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadVault();
  }, [user]);

  const loadVault = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const q = query(collection(firestore, 'vault_assets'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as VaultAsset));
      setAssets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!newAsset.title || !newAsset.url) return;
    setIsSubmitting(true);
    try {
      const { firestore } = initializeFirebase();
      await addDoc(collection(firestore, 'vault_assets'), {
        ...newAsset,
        authorId: user?.id,
        createdAt: new Date().toISOString(),
        isFavorite: false
      });
      toast({ title: "تم تسجيل الأصل", description: "الملف متاح الآن في خزنتك العصبية." });
      setIsUploadModalOpen(false);
      setNewAsset({ title: "", url: "", type: 'document' });
      loadVault();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التسجيل" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد إزالة هذا الأصل من السجل؟ لن يُحذف الملف الأصلي من الدرايف.")) return;
    const { firestore } = initializeFirebase();
    await deleteDoc(doc(firestore, 'vault_assets', id));
    loadVault();
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'favorites') return a.isFavorite && matchesSearch;
    return matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="size-6 text-indigo-400" />;
      case 'audio': return <Music className="size-6 text-emerald-400" />;
      default: return <FileText className="size-6 text-blue-400" />;
    }
  };

  return (
    <div className="flex h-full bg-slate-950 font-sans text-right">
      {/* Sidebar - Drive Style */}
      <aside className="w-64 border-l border-white/5 bg-slate-900/40 p-6 flex flex-col gap-8 hidden lg:flex">
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 shadow-xl font-bold gap-3 flex-row-reverse">
              <Plus className="size-6" /> جديد (Vault)
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] p-8 text-right">
            <DialogHeader><DialogTitle className="text-right">إضافة أصل إلى الخزنة</DialogTitle></DialogHeader>
            <div className="space-y-6 py-6">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-300">بروتوكول الرفع</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">ارفع الملف في المجلد المشترك، ثم الصق الرابط هنا.</p>
                </div>
                <Button variant="ghost" size="sm" className="text-indigo-400 gap-2 font-bold" onClick={() => window.open(VAULT_URL, '_blank')}><ExternalLink className="size-3" /> فتح الدرايف</Button>
              </div>
              <div className="grid gap-2">
                <Label>عنوان الملف في الخزنة</Label>
                <Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={newAsset.title} onChange={e => setNewAsset({...newAsset, title: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>رابط المشاركة من الدرايف</Label>
                <Input placeholder="https://drive.google.com/..." className="bg-white/5 border-white/10 text-right h-12" value={newAsset.url} onChange={e => setNewAsset({...newAsset, url: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveToVault} disabled={isSubmitting} className="w-full bg-primary h-14 rounded-2xl font-bold shadow-xl shadow-primary/20">تثبيت في السجل</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <nav className="space-y-1">
          {[
            { id: 'all', label: 'ملفاتي (Drive)', icon: HardDrive },
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

        <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between flex-row-reverse text-[10px] font-bold">
            <span className="text-indigo-400">Nexus Vault</span>
            <span className="text-muted-foreground">15 GB Free</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[15%]" />
          </div>
          <p className="text-[9px] text-muted-foreground text-center">مساحة تخزين سحابية غير محدودة تقريباً</p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
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
            <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={cn("rounded-xl", viewMode === 'grid' && "bg-white/10 text-white")}><Grid className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={cn("rounded-xl", viewMode === 'list' && "bg-white/10 text-white")}><List className="size-4" /></Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-8">
          <div className="flex items-center justify-between mb-8 flex-row-reverse">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {activeTab === 'all' ? 'ملفاتي السحابية' : activeTab === 'favorites' ? 'المميزة بنجمة' : 'الملفات الأخيرة'}
              <ShieldCheck className="size-5 text-indigo-400" />
            </h2>
            <Badge variant="outline" className="border-white/10 text-[10px] text-muted-foreground uppercase">{filteredAssets.length} Assets</Badge>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">جاري مزامنة السجل العالمي...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20 italic">
                <HardDrive className="size-20 mb-4" />
                <p>لا توجد ملفات في هذا النطاق.</p>
              </div>
            ) : (
              <div className={cn(
                "pb-20",
                viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-2"
              )}>
                {filteredAssets.map(asset => (
                  <Card key={asset.id} className={cn(
                    "group glass border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer relative",
                    viewMode === 'grid' ? "aspect-[4/3] flex flex-col p-6 rounded-[2rem]" : "flex items-center p-4 rounded-xl flex-row-reverse"
                  )}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex justify-between items-start flex-row-reverse mb-auto">
                          {getIcon(asset.type)}
                          <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100" onClick={() => handleDelete(asset.id)}>
                            <Trash2 className="size-4 text-red-400" />
                          </Button>
                        </div>
                        <div className="mt-4 text-right">
                          <p dir="auto" className="font-bold text-white text-sm truncate">{asset.title}</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Vault Node</span>
                            <Star className={cn("size-2", asset.isFavorite ? "text-amber-400 fill-amber-400" : "text-white/10")} />
                          </div>
                        </div>
                        <Button 
                          className="mt-6 w-full h-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-[10px] gap-2"
                          onClick={() => window.open(asset.url, '_blank')}
                        >
                          <ExternalLink className="size-3" /> فتح في الدرايف
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-4 flex-1 flex-row-reverse">
                        <div className="size-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">{getIcon(asset.type)}</div>
                        <p dir="auto" className="font-bold text-white text-sm flex-1 truncate">{asset.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono hidden md:block">{new Date(asset.createdAt).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => window.open(asset.url, '_blank')}><ExternalLink className="size-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)}><Trash2 className="size-4 text-red-400" /></Button>
                        </div>
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
