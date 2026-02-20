
"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Loader2, RefreshCcw, GraduationCap, 
  LayoutGrid, List as ListIcon, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { 
  getSubjects, getCollections, getLearningItems, Subject, Collection, LearningItem, 
  addSubject, addCollection, addLearningItem, LearningItemType,
  deleteSubject, updateSubject, deleteCollection, deleteLearningItem
} from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";
import { DriveLayoutView } from "./learning/drive-layout-view";

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

/**
 * [STABILITY_ANCHOR: KNOWLEDGE_HUB_UNIFIED_V7.0]
 * واجهة التعلم الموحدة - تم إزالة التعقيدات لتبسيط التجربة وجعلها تشبه الدرايف تماماً.
 */
export function KnowledgeHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, LearningItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isListView, setIsListView] = useState(false);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const [newSubject, setNewSubject] = useState({ title: "", description: "" });
  const [newCollection, setNewCollection] = useState({ title: "", description: "" });
  const [newItem, setNewItem] = useState<{title: string, type: LearningItemType, externalUrl: string}>({ 
    title: "", 
    type: "video", 
    externalUrl: ""
  });

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
    await addSubject({ title: newSubject.title, description: newSubject.description, allowedUserIds: null });
    toast({ title: "تم إنشاء المجلد الرئيسي" });
    setIsSubjectModalOpen(false);
    setNewSubject({ title: "", description: "" });
    loadSubjects();
  };

  const handleRenameSubject = async (id: string, currentTitle: string) => {
    const newTitle = window.prompt("أدخل الاسم الجديد:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    await updateSubject(id, { title: newTitle });
    toast({ title: "تم تغيير الاسم" });
    loadSubjects();
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("حذف هذا المجلد؟ (لن يتم مسح ملفات الدرايف)")) return;
    await deleteSubject(id);
    toast({ title: "تم الحذف" });
    if (selectedSubject?.id === id) setSelectedSubject(null);
    loadSubjects();
  };

  const handleCreateCollection = async () => {
    if (!selectedSubject || !newCollection.title) return;
    await addCollection({ 
      subjectId: selectedSubject.id, 
      title: newCollection.title, 
      description: newCollection.description,
      orderIndex: collections.length
    });
    toast({ title: "تم إنشاء المجلد الفرعي" });
    setIsCollectionModalOpen(false);
    setNewCollection({ title: "", description: "" });
    handleSelectSubject(selectedSubject);
  };

  const handleCreateItem = async () => {
    if (!activeCollectionId || !newItem.title || !selectedSubject) return;
    await addLearningItem({
      subjectId: selectedSubject.id,
      collectionId: activeCollectionId,
      title: newItem.title,
      type: newItem.type,
      url: newItem.externalUrl,
      orderIndex: (itemsMap[activeCollectionId]?.length || 0)
    });
    toast({ title: "تم ربط الملف بنجاح" });
    setIsItemModalOpen(false);
    handleSelectSubject(selectedSubject);
    setNewItem({ title: "", type: "video", externalUrl: "" });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 font-sans min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-row-reverse text-right">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            المكتبة التعليمية
            <GraduationCap className="text-primary size-10" />
          </h1>
          <div className="flex items-center gap-2 justify-end mt-1">
            <span className="text-[10px] uppercase font-black text-indigo-400">نظام إدارة الملفات الذكي</span>
            <ShieldCheck className="size-3 text-indigo-400" />
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1 flex-row-reverse">
            <Button variant="ghost" size="sm" className={cn("rounded-lg h-9", !isListView && "bg-white/10 text-white")} onClick={() => setIsListView(false)}><LayoutGrid className="size-4" /></Button>
            <Button variant="ghost" size="sm" className={cn("rounded-lg h-9", isListView && "bg-white/10 text-white")} onClick={() => setIsListView(true)}><ListIcon className="size-4" /></Button>
          </div>
          <Button variant="ghost" size="icon" onClick={loadSubjects} className="h-11 w-11 rounded-xl border border-white/10 bg-white/5">
            <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
          {user?.role === 'admin' && (
            <Button onClick={() => setIsSubjectModalOpen(true)} className="bg-primary rounded-xl h-11 px-6 shadow-lg font-bold">
              <Plus className="mr-2 size-4" /> مجلد جديد
            </Button>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">جاري فتح المكتبة...</p>
        </div>
      ) : (
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
          onDeleteCollection={(sId, cId) => deleteCollection(sId, cId).then(() => handleSelectSubject(selectedSubject))}
          onDeleteItem={(sId, cId, iId) => deleteLearningItem(sId, cId, iId).then(() => handleSelectSubject(selectedSubject))}
          onAddItem={(colId) => { setActiveCollectionId(colId); setIsItemModalOpen(true); }}
          isAdmin={user?.role === 'admin'}
          viewMode={isListView ? 'list' : 'grid'}
        />
      )}

      {/* Modals - Simplified */}
      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
          <DialogHeader><DialogTitle className="text-right">إنشاء مجلد رئيسي</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>اسم المجلد</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={newSubject.title} onChange={e => setNewSubject({...newSubject, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label>الوصف (اختياري)</Label><Textarea dir="auto" className="bg-white/5 border-white/10 text-right" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreateSubject} className="w-full bg-primary h-12 rounded-xl font-bold">إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
          <DialogHeader><DialogTitle className="text-right">إنشاء مجلد فرعي</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>اسم المجلد</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={newCollection.title} onChange={e => setNewCollection({...newCollection, title: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreateCollection} className="w-full bg-primary h-12 rounded-xl font-bold">إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">ربط ملف من الدرايف</DialogTitle>
            <DialogDescription className="text-right text-xs">ارفع الملف أولاً في جوجل درايف ثم الصق الرابط هنا.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid gap-2"><Label>عنوان الملف</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-11" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} /></div>
            <div className="grid gap-2">
              <Label>نوع الملف</Label>
              <Select value={newItem.type} onValueChange={(v: any) => setNewItem({...newItem, type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white"><SelectItem value="video">فيديو</SelectItem><SelectItem value="audio">ملف صوتي</SelectItem><SelectItem value="file">مستند / PDF</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>رابط الملف (Google Drive)</Label><Input placeholder="https://drive.google.com/..." className="bg-white/5 border-white/10 text-right h-11" value={newItem.externalUrl} onChange={e => setNewItem({...newItem, externalUrl: e.target.value})} /></div>
            <Button variant="ghost" className="w-full text-indigo-400 text-xs gap-2" onClick={() => window.open(VAULT_URL, '_blank')}>فتح مجلد الدرايف للرفع <RefreshCcw className="size-3" /></Button>
          </div>
          <DialogFooter><Button onClick={handleCreateItem} disabled={!newItem.externalUrl} className="w-full bg-primary h-12 rounded-xl font-bold">حفظ الملف في المكتبة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
