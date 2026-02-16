
"use client";

import React, { useState, useEffect } from "react";
import { FileText, ChevronRight, BookOpen, Play, Music, Trophy, Plus, Trash2, Upload, Loader2, Globe, CheckCircle2, RefreshCcw, Lock, AlignLeft, Mic, AlertTriangle } from "lucide-react";
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
      const data = await getSubjects(user?.id);
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
      items[col.id] = await getLearningItems(col.id);
    }
    setItemsMap(items);
  };

  const handleCreateSubject = async () => {
    if (!newSubject.title) return;
    const allowed = newSubject.allowedUserIds ? newSubject.allowedUserIds.split(',').map(s => s.trim()) : null;
    await addSubject({ ...newSubject, allowedUserIds: allowed });
    toast({ title: "Subject Created", description: "New neural pathway initialized." });
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
      toast({ title: "Lesson Integrated", description: "Content synchronized successfully." });
      setIsCollectionModalOpen(false);
      setNewCollection({ title: "", description: "" });
      handleSelectSubject(selectedSubject);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Integration Failed", description: err.message });
    }
  };

  const handleCreateItem = async () => {
    if (!activeCollectionId || !newItem.title) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let url = "";
      
      if (newItem.type === 'text') {
        url = newItem.textContent;
        setUploadProgress(100);
      } else if (newItem.file) {
        // نمرر دالة تحديث التقدم الحقيقي
        const uploadUrl = await uploadLearningFile(newItem.file, (pct) => {
          setUploadProgress(pct);
        });

        if (!uploadUrl) {
          toast({ 
            variant: "destructive", 
            title: "Transmission Error", 
            description: "No storage node accepted the payload. Check your bucket policies or internet link." 
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }
        url = uploadUrl;
      } else {
        toast({ variant: "destructive", title: "Empty Payload", description: "Please provide a file or technical content." });
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      await addLearningItem({
        collectionId: activeCollectionId,
        title: newItem.title,
        type: newItem.type,
        url: url,
        orderIndex: (itemsMap[activeCollectionId]?.length || 0)
      });

      toast({ title: "Asset Synchronized", description: "The educational resource is now linked to the neural node." });
      setIsItemModalOpen(false);
      if (selectedSubject) handleSelectSubject(selectedSubject);
      setNewItem({ title: "", type: "file", file: null, textContent: "" });
      
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" onClick={loadSubjects} className="h-12 w-12 rounded-xl border border-white/10">
              <RefreshCcw className="size-5" />
            </Button>
            <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                  <Plus className="mr-2 size-5" /> Add New Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle>Create Learning Subject</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label>Subject Title</Label>
                    <Input className="bg-white/5 border-white/10" value={newSubject.title} onChange={e => setNewSubject({...newSubject, title: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea className="bg-white/5 border-white/10" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateSubject} className="w-full bg-primary h-11 rounded-xl">Authorize Subject</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => handleSelectSubject(subject)}
              >
                <div className="p-8">
                  <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6 group-hover:bg-primary transition-all">
                    <BookOpen className="size-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{subject.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{subject.description}</p>
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       {subject.allowedUserIds ? <Lock className="size-3 text-amber-400" /> : <Globe className="size-3 text-green-400" />}
                       <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        {subject.allowedUserIds ? "Restricted" : "Public"}
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
    <div className="min-h-full bg-slate-950 text-white font-sans">
      <header className="border-b border-white/5 px-8 py-6 sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSubject(null)}><ChevronRight className="rotate-180" /></Button>
            <h1 className="text-2xl font-bold">{selectedSubject.title}</h1>
          </div>
          <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setIsCollectionModalOpen(true)}>
            <Plus className="size-4 mr-2" /> Add Lesson
          </Button>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-8">
        {collections.map((col, idx) => (
          <Card key={col.id} className="glass border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-48 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8">
                <span className="text-5xl font-black text-white/20">{(idx + 1).toString().padStart(2, '0')}</span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{col.title}</p>
              </div>
              <div className="flex-1 space-y-4">
                {itemsMap[col.id]?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        {item.type === 'video' ? <Play className="size-5" /> : item.type === 'audio' ? <Mic className="size-5" /> : item.type === 'text' ? <AlignLeft className="size-5" /> : <FileText className="size-5" />}
                      </div>
                      <p className="font-bold text-sm">{item.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-white/10 uppercase">{item.type.replace('_', ' ')}</Badge>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full border-dashed border-2 border-white/5 h-12 rounded-2xl text-muted-foreground hover:bg-white/5"
                  onClick={() => { setActiveCollectionId(col.id); setIsItemModalOpen(true); }}
                >
                  <Plus className="size-4 mr-2" /> Add Asset
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </main>

      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem]">
          <DialogHeader><DialogTitle>Add New Lesson</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Lesson Title</Label>
              <Input className="bg-white/5 border-white/10" value={newCollection.title} onChange={e => setNewCollection({...newCollection, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea className="bg-white/5 border-white/10" value={newCollection.description} onChange={e => setNewCollection({...newCollection, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCollection} className="w-full bg-primary h-11 rounded-xl">Append Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem] sm:max-w-md">
          <DialogHeader><DialogTitle>Add Learning Asset</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Asset Title</Label>
              <Input className="bg-white/5 border-white/10" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={newItem.type} onValueChange={(v: any) => setNewItem({...newItem, type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio File</SelectItem>
                  <SelectItem value="file">Document</SelectItem>
                  <SelectItem value="text">Text (Explanation)</SelectItem>
                  <SelectItem value="quiz_json">Quiz (JSON)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newItem.type === 'text' ? (
              <div className="grid gap-2">
                <Label>Explanation Content</Label>
                <Textarea 
                  className="bg-white/5 border-white/10 min-h-[150px]" 
                  placeholder="Enter the educational text here..."
                  value={newItem.textContent}
                  onChange={e => setNewItem({...newItem, textContent: e.target.value})}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Upload File</Label>
                <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
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
                      <span className="text-[10px] text-muted-foreground">({(newItem.file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Click or drag to upload asset</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                  <span>Uploading to Neural Link</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5 bg-white/5" />
                <p className="text-[10px] text-muted-foreground italic text-center">
                  {uploadProgress === 100 ? "Finalizing synchronization..." : "Transmitting data packets to institution vault..."}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateItem} 
              disabled={isUploading || (!newItem.file && newItem.type !== 'text') || (newItem.type === 'text' && !newItem.textContent)} 
              className="w-full bg-primary h-11 rounded-xl font-bold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Integrate Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
