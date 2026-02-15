
"use client";

import React, { useState, useEffect } from "react";
import { FileText, Calendar, MoreVertical, Circle, ChevronRight, BookOpen, Play, Music, Trophy, Lock, Plus, Trash2, ArrowUp, ArrowDown, Upload, Loader2, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { getSubjects, getCollections, getLearningItems, Subject, Collection, LearningItem, addSubject, deleteSubject, addCollection, addLearningItem, uploadLearningFile, LearningItemType } from "@/lib/learning-store";
import { useToast } from "@/hooks/use-toast";

export function KnowledgeHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, LearningItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // Form States
  const [newSubject, setNewSubject] = useState({ name: "", description: "", allowedUserIds: "" });
  const [newCollection, setNewCollection] = useState({ 
    title: "", 
    description: "",
    includeAsset: true,
    assetTitle: "",
    assetType: "file" as LearningItemType,
    file: null as File | null
  });
  const [newItem, setNewItem] = useState<{title: string, type: LearningItemType, file: File | null}>({ title: "", type: "file", file: null });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, [user]);

  const loadSubjects = async () => {
    setIsLoading(true);
    const data = await getSubjects(user?.username);
    setSubjects(data);
    setIsLoading(false);
  };

  const handleSelectSubject = async (subject: Subject) => {
    setSelectedSubject(subject);
    const cols = await getCollections(subject.id);
    setCollections(cols);
    
    const items: Record<string, LearningItem[]> = {};
    for (const col of cols) {
      items[col.id] = await getLearningItems(col.id);
    }
    setItemsMap(items);
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name) return;
    const allowed = newSubject.allowedUserIds ? newSubject.allowedUserIds.split(',').map(s => s.trim()) : null;
    await addSubject({ ...newSubject, allowedUserIds: allowed });
    toast({ title: "Subject Created", description: "New neural pathway initialized." });
    setIsSubjectModalOpen(false);
    loadSubjects();
  };

  const handleCreateCollection = async () => {
    if (!selectedSubject || !newCollection.title) return;
    setIsUploading(true);

    try {
      // 1. Create the Collection (Lesson)
      const colData = await addCollection({ 
        subjectId: selectedSubject.id, 
        title: newCollection.title, 
        description: newCollection.description,
        orderIndex: collections.length 
      });

      if (!colData) throw new Error("Failed to create collection");

      // 2. If a file is selected, upload and link it
      if (newCollection.includeAsset && newCollection.file) {
        let url = "";
        let quizData = null;

        if (newCollection.assetType === 'quiz_json') {
          const content = await newCollection.file.text();
          quizData = JSON.parse(content);
        } else {
          const uploadedUrl = await uploadLearningFile(newCollection.file);
          if (!uploadedUrl) throw new Error("File upload failed");
          url = uploadedUrl;
        }

        await addLearningItem({
          collectionId: colData.id,
          title: newCollection.assetTitle || newCollection.title,
          type: newCollection.assetType,
          url,
          quizData,
          orderIndex: 0
        });
      }

      toast({ title: "Lesson Integrated", description: "Content synchronized successfully." });
      setIsCollectionModalOpen(false);
      setNewCollection({ title: "", description: "", includeAsset: true, assetTitle: "", assetType: "file", file: null });
      handleSelectSubject(selectedSubject);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Integration Failed", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!activeCollectionId || !newItem.title || !newItem.file) return;
    setIsUploading(true);
    
    try {
      let url = "";
      let quizData = null;

      if (newItem.type === 'quiz_json') {
        const content = await newItem.file.text();
        quizData = JSON.parse(content);
      } else {
        const uploadedUrl = await uploadLearningFile(newItem.file);
        if (!uploadedUrl) throw new Error("Upload failed");
        url = uploadedUrl;
      }

      await addLearningItem({
        collectionId: activeCollectionId,
        title: newItem.title,
        type: newItem.type,
        url,
        quizData,
        orderIndex: (itemsMap[activeCollectionId]?.length || 0)
      });

      toast({ title: "Asset Added", description: "Resource linked to lesson." });
      setIsItemModalOpen(false);
      handleSelectSubject(selectedSubject!);
      setNewItem({ title: "", type: "file", file: null });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedSubject) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Knowledge Hub</h1>
            <p className="text-muted-foreground mt-2">Neural learning pathways and institutional intelligence.</p>
          </div>
          
          <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                <Plus className="mr-2 size-5" />
                Add New Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Create Learning Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Subject Name</Label>
                  <Input className="bg-white/5 border-white/10 rounded-xl" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea className="bg-white/5 border-white/10 rounded-xl" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Allowed Usernames (Comma separated, empty for public)</Label>
                  <Input className="bg-white/5 border-white/10 rounded-xl" placeholder="user1, user2" value={newSubject.allowedUserIds} onChange={e => setNewSubject({...newSubject, allowedUserIds: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSubject} className="w-full bg-primary rounded-xl h-11">Authorize Subject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-2xl"
                onClick={() => handleSelectSubject(subject)}
              >
                <div className="p-8">
                  <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                    <BookOpen className="size-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{subject.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-6">{subject.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       {subject.allowedUserIds ? <Lock className="size-3 text-amber-400" /> : <Globe className="size-3 text-green-400" />}
                       <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        {subject.allowedUserIds ? "Restricted" : "Public Access"}
                       </span>
                    </div>
                    <ChevronRight className="size-4 text-primary group-hover:translate-x-1 transition-transform" />
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
    <div className="min-h-full bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">
              <span className="hover:text-teal-600 cursor-pointer" onClick={() => setSelectedSubject(null)}>Knowledge Hub</span>
              <span>/</span>
              <span className="text-slate-400">{selectedSubject.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              {selectedSubject.name}
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setIsCollectionModalOpen(true)}>
              <Plus className="size-4 mr-2" />
              Add Lesson
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {collections.map((col, index) => (
          <div 
            key={col.id} 
            className="flex flex-col md:flex-row bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className={cn(
              "w-full md:w-64 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100",
              index === 0 ? "bg-amber-50/50" : "bg-white"
            )}>
              {index === 0 && (
                <Badge className="bg-red-600 hover:bg-red-700 text-white rounded-sm text-[10px] px-2 py-0.5 mb-2 font-bold uppercase">
                  Lesson Start
                </Badge>
              )}
              <div className="text-5xl font-extrabold text-slate-800 leading-none">
                {(index + 1).toString().padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Sequence
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-teal-700 font-semibold text-sm">
                <BookOpen className="size-3.5" />
                {col.title}
              </div>
            </div>

            <div className="flex-1 p-6 bg-slate-50/30 space-y-4">
              {itemsMap[col.id]?.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "bg-white rounded-md border-l-4 p-4 shadow-sm group hover:shadow-md transition-shadow",
                    item.type === 'video' ? "border-blue-500" : 
                    item.type === 'audio' ? "border-purple-500" : 
                    item.type === 'quiz_json' ? "border-rose-500" : "border-green-500"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Circle className={cn("size-2.5 fill-current", 
                        item.type === 'video' ? "text-blue-500" : 
                        item.type === 'audio' ? "text-purple-500" : 
                        item.type === 'quiz_json' ? "text-rose-500" : "text-green-500"
                      )} />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.type.replace('_', ' ')}</span>
                    </div>
                    <MoreVertical className="size-4 text-slate-300 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      {item.type === 'video' ? <Play className="size-5" /> : 
                       item.type === 'audio' ? <Music className="size-5" /> : 
                       item.type === 'quiz_json' ? <Trophy className="size-5" /> : <FileText className="size-5" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <div className="flex gap-2">
                        {item.type === 'quiz_json' ? (
                          <Button size="sm" className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8 px-4">Start Quiz</Button>
                        ) : (
                          <a href={item.url} target="_blank" className="text-xs font-bold text-teal-700 hover:underline uppercase">View Content</a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="ghost" 
                className="w-full border-dashed border-2 border-slate-200 h-12 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg text-xs font-bold"
                onClick={() => {
                  setActiveCollectionId(col.id);
                  setIsItemModalOpen(true);
                }}
              >
                <Plus className="size-4 mr-2" />
                Add Learning Item to {col.title}
              </Button>
            </div>
          </div>
        ))}
      </main>

      {/* Admin Modals */}
      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] sm:max-w-[550px] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Collection / Lesson</DialogTitle>
            <DialogDescription className="text-slate-400">Create a new lesson and optionally upload your first asset.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Lesson Title</Label>
                <Input className="bg-white/5 border-white/10 text-white h-12 rounded-xl" value={newCollection.title} onChange={e => setNewCollection({...newCollection, title: e.target.value})} placeholder="e.g., Intro to Neural Networks" />
              </div>
              <div className="grid gap-2">
                <Label>Brief Description</Label>
                <Textarea className="bg-white/5 border-white/10 text-white rounded-xl min-h-[80px]" value={newCollection.description} onChange={e => setNewCollection({...newCollection, description: e.target.value})} placeholder="What will students learn?" />
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Upload className="size-4" />
                Lesson Asset (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Asset Type</Label>
                  <Select value={newCollection.assetType} onValueChange={(v: any) => setNewCollection({...newCollection, assetType: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="file">Document (PDF)</SelectItem>
                      <SelectItem value="quiz_json">Quiz (JSON)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Asset Title</Label>
                  <Input className="bg-white/5 border-white/10 h-11 rounded-xl" value={newCollection.assetTitle} onChange={e => setNewCollection({...newCollection, assetTitle: e.target.value})} placeholder="Display name" />
                </div>
              </div>
              
              <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewCollection({...newCollection, file: e.target.files?.[0] || null})} accept={newCollection.assetType === 'quiz_json' ? '.json' : '*'} />
                {newCollection.file ? (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="size-8 text-green-400" />
                    <span className="text-xs text-slate-300 truncate w-48 text-center">{newCollection.file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                    <p className="text-xs font-medium text-white/70">Click or drag payload to upload</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCollection} disabled={isUploading || !newCollection.title} className="w-full bg-primary h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20">
              {isUploading ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Synchronizing Neural Content...
                </>
              ) : (
                "Append Lesson & Assets"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">New Learning Asset</DialogTitle>
            <DialogDescription className="text-slate-400">Add another resource to this lesson sequence.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="grid gap-2">
              <Label>Asset Title</Label>
              <Input className="bg-white/5 border-white/10 h-12 rounded-xl" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="e.g., Reading Materials" />
            </div>
            <div className="grid gap-2">
              <Label>Asset Type</Label>
              <Select value={newItem.type} onValueChange={(v: any) => setNewItem({...newItem, type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="file">File (PDF/DOC)</SelectItem>
                  <SelectItem value="quiz_json">Quiz (JSON File)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Upload Asset</Label>
              <div className="relative h-32 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center bg-white/5 group hover:bg-white/10 cursor-pointer">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewItem({...newItem, file: e.target.files?.[0] || null})} accept={newItem.type === 'quiz_json' ? '.json' : '*'} />
                {newItem.file ? (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="size-8 text-green-400" />
                    <span className="text-xs text-slate-300 truncate w-48 text-center">{newItem.file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Upload className="size-8" />
                    <span className="text-xs uppercase font-bold tracking-widest">Select Payload</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateItem} disabled={isUploading || !newItem.file || !newItem.title} className="w-full bg-primary h-14 rounded-2xl font-bold shadow-lg">
              {isUploading ? <Loader2 className="size-5 animate-spin mr-2" /> : <Plus className="size-5 mr-2" />}
              {isUploading ? "Transmitting..." : "Integrate Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
