
"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, ChevronRight, BookOpen, Play, Trophy, Plus, 
  Upload, Loader2, Globe, CheckCircle2, RefreshCcw, 
  Lock, AlignLeft, Mic, GraduationCap, HardDrive, ExternalLink, AlertTriangle, Link2,
  LayoutGrid, List as ListIcon, ShieldCheck, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/auth-provider";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { cn } from "@/lib/utils";
import { 
  getSubjects, getCollections, getLearningItems, Subject, Collection, LearningItem, 
  addSubject, addCollection, addLearningItem, uploadLearningFile, LearningItemType,
  deleteSubject, updateSubject, deleteCollection, deleteLearningItem
} from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { DriveLayoutView } from "./learning/drive-layout-view";

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";
const VAULT_EMBED_URL = "https://drive.google.com/embeddedfolderview?id=16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g#list";

/**
 * [STABILITY_ANCHOR: KNOWLEDGE_HUB_V6.5]
 * المنسق المطور لقسم التعلم - تم تحصين واجهة المزامنة وتوضيح بروتوكول التخزين الهجين.
 */
export function KnowledgeHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, LearningItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'original' | 'drive' | 'live_vault'>('original');

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const [newSubject, setNewSubject] = useState({ title: "", description: "", allowedUserIds: "" });
  const [newCollection, setNewCollection] = useState({ title: "", description: "" });
  const [newItem, setNewItem] = useState<{title: string, type: LearningItemType, externalUrl: string}>({ 
    title: "", 
    type: "video", 
    externalUrl: ""
  });
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, [user]);

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await getSubjects(user?.id, user?.role === 'admin');
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSubject = async (subject: Subject | null) => {
    setSelectedSubject(subject);
    if (!subject) {
      setCollections([]);
      setItemsMap({});
      return;
    }
    const cols = await getCollections(subject.id);
    setCollections(cols);
    
    const items: Record<string, LearningItem[]> = {};
    for (const col of cols) {
      items[col.id] = await getLearningItems(subject.id, col.id);
    }
    setItemsMap(items);
  };

  const handleCreateSubject = async () => {
    if (!newSubject.title) return;
    const allowed = newSubject.allowedUserIds ? newSubject.allowedUserIds.split(',').map(s => s.trim()) : null;
    await addSubject({ title: newSubject.title, description: newSubject.description, allowedUserIds: allowed });
    toast({ title: "تم إنشاء القطاع", description: "تم فتح مسار عصبي معرفي جديد في السجل." });
    setIsSubjectModalOpen(false);
    setNewSubject({ title: "", description: "", allowedUserIds: "" });
    loadSubjects();
  };

  const handleRenameSubject = async (id: string, currentTitle: string) => {
    const newTitle = window.prompt("أدخل العنوان الجديد للقطاع:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await updateSubject(id, { title: newTitle });
      toast({ title: "تم تحديث السجل العصبي" });
      loadSubjects();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التحديث" });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟ (لن يتم مسح ملفات الدرايف)")) return;
    try {
      await deleteSubject(id);
      toast({ title: "تم حذف السجل بنجاح" });
      if (selectedSubject?.id === id) setSelectedSubject(null);
      loadSubjects();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحذف" });
    }
  };

  const handleCreateCollection = async () => {
    if (!selectedSubject || !newCollection.title) return;
    try {
      await addCollection({ 
        subjectId: selectedSubject.id, 
        title: newCollection.title, 
        description: newCollection.description,
        orderIndex: collections.length
      });
      toast({ title: "تم تثبيت الوحدة", description: "تمت مزامنة العنوان مع السجل العالمي." });
      setIsCollectionModalOpen(false);
      setNewCollection({ title: "", description: "" });
      handleSelectSubject(selectedSubject);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التثبيت", description: err.message });
    }
  };

  const handleDeleteCollection = async (subjectId: string, colId: string) => {
    if (!window.confirm("هل تريد حذف هذه الوحدة من السجل؟")) return;
    try {
      await deleteCollection(subjectId, colId);
      toast({ title: "تم حذف الوحدة من السجل" });
      if (selectedSubject) handleSelectSubject(selectedSubject);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحذف" });
    }
  };

  const handleCreateItem = async () => {
    if (!activeCollectionId || !newItem.title || !selectedSubject) return;
    setIsUploading(true);
    try {
      await addLearningItem({
        subjectId: selectedSubject.id,
        collectionId: activeCollectionId,
        title: newItem.title,
        type: newItem.type,
        url: newItem.externalUrl,
        orderIndex: (itemsMap[activeCollectionId]?.length || 0)
      });

      toast({ title: "تم تسجيل الأصل" });
      setIsItemModalOpen(false);
      handleSelectSubject(selectedSubject);
      setNewItem({ title: "", type: "video", externalUrl: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التسجيل", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (subjectId: string, colId: string, itemId: string) => {
    if (!window.confirm("هل تريد إزالة هذا الأصل من سجل نكسوس؟")) return;
    try {
      await deleteLearningItem(subjectId, colId, itemId);
      toast({ title: "تم حذف الأصل من السجل" });
      if (selectedSubject) handleSelectSubject(selectedSubject);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحذف" });
    }
  };

  const HeaderActions = () => (
    <div className="flex gap-3">
      <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1 flex-row-reverse">
        <Button 
          variant="ghost" size="sm" 
          className={cn("rounded-lg h-10 gap-2 flex-row-reverse", displayMode === 'original' ? "bg-primary text-white shadow-lg" : "text-muted-foreground")}
          onClick={() => setDisplayMode('original')}
        >
          <LayoutGrid className="size-4" /> التصميم الأصلي
        </Button>
        <Button 
          variant="ghost" size="sm" 
          className={cn("rounded-lg h-10 gap-2 flex-row-reverse", displayMode === 'drive' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground")}
          onClick={() => setDisplayMode('drive')}
        >
          <HardDrive className="size-4" /> واجهة الدرايف
        </Button>
        <Button 
          variant="ghost" size="sm" 
          className={cn("rounded-lg h-10 gap-2 flex-row-reverse", displayMode === 'live_vault' ? "bg-amber-600 text-white shadow-lg" : "text-muted-foreground")}
          onClick={() => setDisplayMode('live_vault')}
        >
          <Globe className="size-4" /> الخزنة الحية (فعلي)
        </Button>
      </div>
      <Button variant="ghost" size="icon" onClick={loadSubjects} className="h-12 w-12 rounded-xl border border-white/10 bg-white/5">
        <RefreshCcw className={cn("size-5", isLoading && "animate-spin")} />
      </Button>
      {user?.role === 'admin' && (
        <Button onClick={() => setIsSubjectModalOpen(true)} className="bg-primary rounded-xl h-12 px-6 shadow-lg shadow-primary/20 font-bold">
          <Plus className="mr-2 size-5" /> إضافة قطاع
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-row-reverse text-right">
        <div className="space-y-1">
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            Knowledge Hub
            <GraduationCap className="text-primary size-10" />
          </h1>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] uppercase font-black text-indigo-400">Nexus Metadata Layer Active</span>
            <ShieldCheck className="size-3 text-indigo-400" />
          </div>
        </div>
        <HeaderActions />
      </div>

      {displayMode === 'live_vault' && (
        <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] flex items-center justify-between flex-row-reverse shadow-inner mb-8">
          <div className="flex items-center gap-4 flex-row-reverse text-right">
            <Info className="size-6 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">إدارة الملفات الفيزيائية</p>
              <p className="text-xs text-muted-foreground">استخدم هذه الواجهة لرفع، حذف، أو تنظيم ملفاتك داخل Google Drive مباشرة. التغييرات هنا هي التي "تنفذ" فعلياً في السحاب.</p>
            </div>
          </div>
          <Button variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 rounded-xl" onClick={() => window.open(VAULT_URL, '_blank')}>فتح في نافذة مستقلة</Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">جاري المزامنة المعرفية...</p>
        </div>
      ) : displayMode === 'live_vault' ? (
        <div className="h-[75vh] w-full rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900 relative">
          <iframe 
            src={VAULT_EMBED_URL} 
            className="size-full border-none" 
            title="Google Drive Live Vault"
          />
        </div>
      ) : displayMode === 'drive' ? (
        <DriveLayoutView 
          subjects={subjects}
          collections={collections}
          itemsMap={itemsMap}
          selectedSubject={selectedSubject}
          onSelectSubject={handleSelectSubject}
          onAddSubject={() => setIsSubjectModalOpen(true)}
          onAddCollection={() => setIsCollectionModalOpen(true)}
          onDeleteSubject={handleDeleteSubject}
          onRenameSubject={handleRenameSubject}
          onDeleteCollection={handleDeleteCollection}
          onDeleteItem={handleDeleteItem}
          isAdmin={user?.role === 'admin'}
        />
      ) : (
        !selectedSubject ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all cursor-pointer shadow-2xl"
                onClick={() => handleSelectSubject(subject)}
              >
                <div className="p-8">
                  <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    <BookOpen className="size-8" />
                  </div>
                  <h3 dir="auto" className="text-2xl font-bold text-white mb-2 text-right">{subject.title}</h3>
                  <p dir="auto" className="text-muted-foreground text-sm line-clamp-2 text-right leading-relaxed h-10">{subject.description}</p>
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5 flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                       {subject.allowedUserIds ? <Lock className="size-3 text-amber-400" /> : <Globe className="size-3 text-green-400" />}
                       <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        {subject.allowedUserIds ? "عقدة مقيدة" : "متاح للجميع"}
                       </span>
                    </div>
                    {user?.role === 'admin' && (
                      <Button variant="ghost" size="icon" className="text-red-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                    <ChevronRight className="size-4 text-primary group-hover:translate-x-1 transition-transform rotate-180" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="animate-in slide-in-from-left-4 duration-500">
            <header className="border-b border-white/5 pb-6 mb-8">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-4 flex-row-reverse text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleSelectSubject(null)} className="rounded-full"><ChevronRight className="rotate-180" /></Button>
                  <div>
                    <h1 dir="auto" className="text-2xl font-bold text-white">{selectedSubject.title}</h1>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active Neural Track</p>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 font-bold" onClick={() => setIsCollectionModalOpen(true)}>
                    <Plus className="size-4 mr-2" /> إضافة درس
                  </Button>
                )}
              </div>
            </header>

            <div className="space-y-8 pb-32">
              {collections.map((col, idx) => (
                <Card key={col.id} className="glass border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="p-8 flex flex-col md:flex-row gap-8 flex-row-reverse">
                    <div className="w-full md:w-48 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-l border-white/5 pb-6 md:pb-0 md:pl-8">
                      <span className="text-6xl font-black text-white/10">{(idx + 1).toString().padStart(2, '0')}</span>
                      <p dir="auto" className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-2">{col.title}</p>
                      <Link href={`/learn/${col.id}?subjectId=${selectedSubject.id}`} className="mt-6 w-full">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold gap-2 flex-row-reverse">
                          <Play className="size-3" /> دخول الدرس
                        </Button>
                      </Link>
                      {user?.role === 'admin' && (
                        <Button variant="ghost" size="sm" className="mt-2 text-red-400 h-8" onClick={() => handleDeleteCollection(selectedSubject.id, col.id)}>حذف الوحدة</Button>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between flex-row-reverse mb-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">الأصول المرتبطة</h4>
                        <Badge variant="outline" className="text-[8px] opacity-40 border-white/10">{itemsMap[col.id]?.length || 0} Assets</Badge>
                      </div>
                      
                      {itemsMap[col.id]?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors flex-row-reverse">
                          <div className="flex items-center gap-4 flex-row-reverse text-right">
                            <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                              {item.type === 'video' ? <Play className="size-5" /> : item.type === 'audio' ? <Mic className="size-5" /> : item.type === 'text' ? <AlignLeft className="size-5" /> : <FileText className="size-5" />}
                            </div>
                            <div>
                              <p dir="auto" className="font-bold text-sm text-white">{item.title}</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-black">{item.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user?.role === 'admin' && (
                              <Button variant="ghost" size="icon" className="text-red-400/50 hover:text-red-400" onClick={() => handleDeleteItem(selectedSubject.id, col.id, item.id)}>
                                <Trash2 className="size-3" />
                              </Button>
                            )}
                            {item.url?.includes('drive.google.com') && <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px]">Vault</Badge>}
                            <ChevronRight className="size-3 text-muted-foreground opacity-20 rotate-180" />
                          </div>
                        </div>
                      ))}
                      
                      {user?.role === 'admin' && (
                        <Button 
                          variant="ghost" 
                          className="w-full border-dashed border-2 border-white/5 h-14 rounded-2xl text-muted-foreground hover:bg-white/5 hover:border-primary/20 transition-all font-bold gap-2 flex-row-reverse"
                          onClick={() => { setActiveCollectionId(col.id); setIsItemModalOpen(true); }}
                        >
                          <Plus className="size-4" /> إلحاق أصل معرفي
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      )}

      {/* Modals */}
      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
          <DialogHeader>
            <DialogTitle className="text-right">إنشاء قطاع تعليمي سيادي</DialogTitle>
            <DialogDescription className="text-right text-[10px] text-amber-400/60">ملاحظة: هذا القطاع ينشئ مجلداً في سجل نكسوس فقط لتنظيم المسار.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>عنوان القطاع</Label>
              <Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={newSubject.title} onChange={e => setNewSubject({...newSubject, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>الوصف التفصيلي</Label>
              <Textarea dir="auto" className="bg-white/5 border-white/10 text-right min-h-[100px]" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateSubject} className="w-full bg-primary h-12 rounded-xl font-bold">تفعيل القطاع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] p-8 text-right">
          <DialogHeader><DialogTitle className="text-right">إضافة وحدة دراسية جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>عنوان الوحدة</Label>
              <Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={newCollection.title} onChange={e => setNewCollection({...newCollection, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea dir="auto" className="bg-white/5 border-white/10 text-right min-h-[100px]" value={newCollection.description} onChange={e => setNewCollection({...newCollection, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCollection} className="w-full bg-primary h-12 rounded-xl font-bold shadow-xl shadow-primary/20">تثبيت الوحدة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] sm:max-w-md p-8 text-right">
          <DialogHeader><DialogTitle className="text-right">مزامنة أصل معرفي (Drive Only)</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-300">بروتوكول المزامنة الفيزيائية</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">ادخل على "الخزنة الحية" أولاً، ارفع ملفك، ثم انسخ رابطه وضعه هنا.</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-2 text-indigo-400 font-bold" onClick={() => setDisplayMode('live_vault')}><Globe className="size-3" /> الذهاب للخزنة</Button>
            </div>
            <div className="grid gap-2"><Label>عنوان الأصل</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label>النوع</Label><Select value={newItem.type} onValueChange={(v: any) => setNewItem({...newItem, type: v})}><SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-12"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-white/10 text-white"><SelectItem value="video">فيديو</SelectItem><SelectItem value="audio">شرح صوتي</SelectItem><SelectItem value="file">مستند</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>رابط الملف من الدرايف</Label><Input placeholder="https://drive.google.com/..." className="bg-white/5 border-white/10 text-right h-12" value={newItem.externalUrl} onChange={e => setNewItem({...newItem, externalUrl: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreateItem} disabled={isUploading || !newItem.externalUrl} className="w-full bg-primary h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">{isUploading ? <Loader2 className="size-5 animate-spin mr-2" /> : <Plus className="size-5 mr-2" />}تسجيل الأصل في نكسوس</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Trash2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  );
}
