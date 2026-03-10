
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, Loader2, RefreshCcw,
  LayoutGrid, List as ListIcon, Cloud, Library
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import {
  getSubjects, getCollections, getLearningItems, Subject, Collection, LearningItem,
  addSubject, addCollection, addLearningItem, LearningItemType,
  deleteSubject, updateSubject, deleteCollection, deleteLearningItem
} from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";
import { DriveLayoutView } from "./learning/drive-layout-view";
import { SubjectModal, CollectionModal, ItemModal, DriveModal } from "./learning/knowledge-hub-modals";

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

/**
 * [STABILITY_ANCHOR: KNOWLEDGE_HUB_V4.0]
 * واجهة المكتبة المركزية - تدعم الرقابة وعرض المحتوى المقترح للمؤلف فقط قبل الاعتماد.
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

  const isAdmin = !!user && ['admin', 'founder', 'cofounder'].includes(user.role);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const [newSubject, setNewSubject] = useState({ title: "", description: "" });
  const [newCollection, setNewCollection] = useState({ title: "", description: "" });
  const [newItem, setNewItem] = useState<{ title: string, type: LearningItemType, externalUrl: string }>({
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
      const data = await getSubjects(user?.id, isAdmin);
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
    const cols = await getCollections(subject.id, user?.id, isAdmin);
    setCollections(cols);

    const items: Record<string, LearningItem[]> = {};
    for (const col of cols) {
      items[col.id] = await getLearningItems(subject.id, col.id, user?.id, isAdmin);
    }
    setItemsMap(items);
  };

  const handleCreateSubject = async () => {
    if (!newSubject.title || !user) return;
    await addSubject({
      title: newSubject.title,
      description: newSubject.description,
      authorId: user.id,
      allowedUserIds: null
    }, isAdmin);

    toast({
      title: isAdmin ? "تم إنشاء المجلد" : "تم إرسال المقترح",
      description: isAdmin ? "المحتوى متاح للجميع الآن." : "سيظهر طلبك في المكتبة العامة بعد مراجعة الأدمن."
    });

    setIsSubjectModalOpen(false);
    setNewSubject({ title: "", description: "" });
    loadSubjects();
  };

  const handleCreateCollection = async () => {
    if (!selectedSubject || !newCollection.title || !user) return;
    await addCollection({
      subjectId: selectedSubject.id,
      title: newCollection.title,
      authorId: user.id,
      description: newCollection.description,
      orderIndex: collections.length
    }, isAdmin);

    toast({ title: isAdmin ? "تم الإنشاء بنجاح" : "قيد المراجعة الإدارية" });
    setIsCollectionModalOpen(false);
    setNewCollection({ title: "", description: "" });
    handleSelectSubject(selectedSubject);
  };

  const handleCreateItem = async () => {
    if (!activeCollectionId || !newItem.title || !selectedSubject || !user) return;
    await addLearningItem({
      subjectId: selectedSubject.id,
      collectionId: activeCollectionId,
      title: newItem.title,
      type: newItem.type,
      url: newItem.externalUrl,
      authorId: user.id,
      orderIndex: (itemsMap[activeCollectionId]?.length || 0)
    }, isAdmin);

    toast({ title: isAdmin ? "تم إضافة الدرس" : "طلب الإضافة قيد المراجعة" });
    setIsItemModalOpen(false);
    handleSelectSubject(selectedSubject);
    setNewItem({ title: "", type: "video", externalUrl: "" });
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("هل أنت متأكد؟ سيتم حذف المجلد وكافة محتوياته.")) return;
    try {
      await deleteSubject(id);
      toast({ title: "تم مسح المجلد" });
      loadSubjects();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الحذف" });
    }
  };

  const handleRenameSubject = async (id: string, currentTitle: string) => {
    const newTitle = prompt("أدخل الاسم الجديد:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await updateSubject(id, { title: newTitle });
      toast({ title: "تم تحديث العنوان" });
      loadSubjects();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التحديث" });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 font-sans min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-row-reverse text-right">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            المكتبة التعليمية
            <Library className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground text-sm">استكشف وساهم في بناء المعرفة السيادية لنكسوس.</p>
        </div>

        <div className="flex gap-3 items-center">
          <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1 flex-row-reverse">
            <Button variant="ghost" size="sm" className={cn("rounded-lg h-9", !isListView && "bg-white/10 text-white")} onClick={() => setIsListView(false)}><LayoutGrid className="size-4" /></Button>
            <Button variant="ghost" size="sm" className={cn("rounded-lg h-9", isListView && "bg-white/10 text-white")} onClick={() => setIsListView(true)}><ListIcon className="size-4" /></Button>
          </div>
          <Button variant="ghost" size="icon" onClick={loadSubjects} className="h-11 w-11 rounded-xl border border-white/10 bg-white/5">
            <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
          <Button onClick={() => setIsDriveModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl h-11 px-5 shadow-lg font-bold gap-2">
            <Cloud className="size-4" /> مساحة الرفع السحابية
          </Button>
          <Button onClick={() => setIsSubjectModalOpen(true)} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-5 shadow-lg font-bold">
            <Plus className="mr-2 size-4" /> إضافة مجلد رئيسي
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">جاري فتح المجلدات...</p>
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
          onAddItem={(colId) => { setActiveCollectionId(colId); setIsItemModalOpen(true); }}
          onDeleteSubject={handleDeleteSubject}
          onRenameSubject={handleRenameSubject}
          onDeleteCollection={deleteCollection}
          onDeleteItem={deleteLearningItem}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          viewMode={isListView ? 'list' : 'grid'}
        />
      )}

      {/* Modals */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onOpenChange={setIsSubjectModalOpen}
        value={newSubject}
        onChange={setNewSubject}
        onSubmit={handleCreateSubject}
      />
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onOpenChange={setIsCollectionModalOpen}
        value={newCollection}
        onChange={setNewCollection}
        onSubmit={handleCreateCollection}
      />
      <ItemModal
        isOpen={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        value={newItem}
        onChange={setNewItem}
        onSubmit={handleCreateItem}
      />
      <DriveModal
        isOpen={isDriveModalOpen}
        onOpenChange={setIsDriveModalOpen}
      />
    </div>
  );
}
