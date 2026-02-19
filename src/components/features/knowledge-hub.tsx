
"use client";

import React, { useState, useEffect } from "react";
import { FileText, ChevronRight, BookOpen, Play, Music, Trophy, Plus, Trash2, Upload, Loader2, Globe, CheckCircle2, RefreshCcw, Lock, AlignLeft, Mic, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { getSubjects, getCollections, getLearningItems, Subject, Collection, LearningItem, addSubject, addCollection, addLearningItem, uploadLearningFile, LearningItemType } from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * [STABILITY_ANCHOR: KNOWLEDGE_HUB_V3.0]
 * المنسق الرئيسي لقسم التعلم - تم تحسين تجربة الانتقال للمشغل المعرفي.
 */
export function KnowledgeHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, LearningItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const [newSubject, setNewSubject] = useState({ title: "", description: "", allowedUserIds: "" });
  const [newCollection, setNewCollection] = useState({ title: "", description: "" });
  const [newItem, setNewItem] = useState<{title: string, type: LearningItemType, file: File | null, textContent: string}>({ 
    title: "", 
    type: "file", 
    file: null,
    textContent: ""
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleSelectSubject = async (subject: Subject) => {
    setSelectedSubject(subject);
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
    toast({ title: "تم إنشاء القطاع", description: "تم فتح مسار عصبي معرفي جديد." });
    setIsSubjectModalOpen(false);
    setNewSubject({ title: "", description: "", allowedUserIds: "" });
    loadSubjects();
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
      toast({ title: "تم دمج الدرس", description: "تمت مزامنة المحتوى بنجاح." });
      setIsCollectionModalOpen(false);
      setNewCollection({ title: "", description: "" });
      handleSelectSubject(selectedSubject);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الدمج", description: err.message });
    }
  };

  const handleCreateItem = async () => {
    if (!activeCollectionId || !newItem.title || !selectedSubject) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let url = "";
      
      if (newItem.type === 'text') {
        url = newItem.textContent;
        setUploadProgress(100);
      } else if (newItem.file) {
        const uploadUrl = await uploadLearningFile(newItem.file, (pct) => {
          setUploadProgress(pct);
        });

        if (!uploadUrl) {
          throw new Error("لم تقبل أي عقدة تخزين هذا المحتوى.");
        }
        url = uploadUrl;
      } else {
        throw new Error("البيانات فارغة: يرجى تقديم ملف أو محتوى تقني.");
      }

      await addLearningItem({
        subjectId: selectedSubject.id,
        collectionId: activeCollectionId,
        title: newItem.title,
        type: newItem.type,
        url: url,
        orderIndex: (itemsMap[activeCollectionId]?.length || 0)
      });

      toast({ title: "تمت المزامنة", description: "الأصل التعليمي مرتبط الآن بالعقدة العصبية." });
      setIsItemModalOpen(false);
      if (selectedSubject) handleSelectSubject(selectedSubject);
      setNewItem({ title: "", type: "file", file: null, textContent: "" });
      
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "فشل المزامنة", 
        description: err.message 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!selectedSubject) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-row-reverse text-right">
          <div>
            <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
              Knowledge Hub
              <GraduationCap className="text-primary size-10" />
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">المسارات التعليمية العصبية والذكاء المؤسسي الموزع.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" onClick={loadSubjects} className="h-12 w-12 rounded-xl border border-white/10 bg-white/5">
              <RefreshCcw className="size-5" />
            </Button>
            {user?.role === 'admin' && (
              <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary rounded-xl h-12 px-6 shadow-lg shadow-primary/20 font-bold">
                    <Plus className="mr-2 size-5" /> إضافة قطاع جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
                  <DialogHeader><DialogTitle className="text-right">إنشاء قطاع تعليمي سيادي</DialogTitle></DialogHeader>
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
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="size-12 animate-spin text-primary" /></div>
        ) : (
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
                    <ChevronRight className="size-4 text-primary group-hover:translate-x-1 transition-transform rotate-180" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950/20 text-white font-sans animate-in slide-in-from-left-4 duration-500">
      <header className="border-b border-white/5 px-8 py-6 sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse text-right">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSubject(null)} className="rounded-full"><ChevronRight className="rotate-180" /></Button>
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

      <main className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
        {collections.map((col, idx) => (
          <Card key={col.id} className="glass border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 flex flex-col md:flex-row gap-8 flex-row-reverse">
              <div className="w-full md:w-48 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-l border-white/5 pb-6 md:pb-0 md:pl-8">
                <span className="text-6xl font-black text-white/10">{(idx + 1).toString().padStart(2, '0')}</span>
                <p dir="auto" className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-2">{col.title}</p>
                <Link href={`/learn/${col.id}`} className="mt-6 w-full">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold gap-2 flex-row-reverse">
                    <Play className="size-3" /> دخول الدرس
                  </Button>
                </Link>
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
                    <ArrowRight className="size-3 text-muted-foreground opacity-20 rotate-180" />
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
      </main>

      {/* Modals for Admin */}
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
          <DialogHeader><DialogTitle className="text-right">مزامنة أصل معرفي</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>عنوان الأصل</Label>
              <Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>البروتوكول (النوع)</Label>
              <Select value={newItem.type} onValueChange={(v: any) => setNewItem({...newItem, type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="video">فيديو تعليمي</SelectItem>
                  <SelectItem value="audio">شرح صوتي</SelectItem>
                  <SelectItem value="file">مستند تقني</SelectItem>
                  <SelectItem value="text">نص إيضاحي (Manual)</SelectItem>
                  <SelectItem value="quiz_json">اختبار تقييمي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newItem.type === 'text' ? (
              <div className="grid gap-2">
                <Label>المحتوى التعليمي</Label>
                <Textarea 
                  dir="auto"
                  className="bg-white/5 border-white/10 min-h-[150px] text-right" 
                  placeholder="اكتب الشرح التقني هنا..."
                  value={newItem.textContent}
                  onChange={e => setNewItem({...newItem, textContent: e.target.value})}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>رفع الملف</Label>
                <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={e => setNewItem({...newItem, file: e.target.files?.[0] || null})} 
                    accept={newItem.type === 'audio' ? 'audio/*' : newItem.type === 'video' ? 'video/*' : '*/*'}
                    disabled={isUploading}
                  />
                  {newItem.file ? (
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <CheckCircle2 className="size-5" />
                      <span className="text-sm truncate max-w-[200px]">{newItem.file.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-8 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-muted-foreground">اضغط لرفع الملف للنخاع</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2 mt-4 animate-in fade-in">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                  <span>جاري المزامنة مع السحاب</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1 bg-white/5" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateItem} 
              disabled={isUploading || (!newItem.file && newItem.type !== 'text') || (newItem.type === 'text' && !newItem.textContent)} 
              className="w-full bg-primary h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
            >
              {isUploading ? <Loader2 className="size-5 animate-spin mr-2" /> : <Plus className="size-5 mr-2" />}
              تأكيد الدمج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
