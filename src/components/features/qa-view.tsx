'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { subscribeToQAPosts, addQAPost, updateQAPostUser, deleteQAPostUser, answerQAPost, addFollowUp, answerFollowUp, QAPost, QACategory } from "@/lib/qa-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, MessageCircleQuestion, Send, Clock, Edit, Trash, FileQuestion, HelpCircle, User, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { getRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { QAPostCard } from "./qa-post-card";

export function QAView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<QAPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'questions' | 'requests'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<QACategory>('question');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const [editPost, setEditPost] = useState<QAPost | null>(null);
  const [editText, setEditText] = useState("");
  const [editAnonymous, setEditAnonymous] = useState(false);
  
  const [answerPost, setAnswerPost] = useState<QAPost | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerAlert, setAnswerAlert] = useState("");
  
  const [followUpPost, setFollowUpPost] = useState<QAPost | null>(null);
  const [followUpText, setFollowUpText] = useState("");
  
  const [followUpAnswerPost, setFollowUpAnswerPost] = useState<QAPost | null>(null);
  const [followUpAnswerText, setFollowUpAnswerText] = useState("");

  const isManagement = ['founder', 'cofounder', 'admin', 'management'].includes(user?.role || '');

  useEffect(() => {
    const unsubscribe = subscribeToQAPosts((data) => {
      setPosts(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Action Handlers
  const handleAddPost = async () => {
    if (!newPostText.trim() || !user) return;
    try {
      await addQAPost({ category: newPostCategory, text: newPostText, authorId: user.id || '', authorName: user.name || 'مستخدم', isAnonymous });
      setNewPostText(""); setIsAnonymous(true); setIsAddOpen(false);
      toast({ title: "تم الإرسال بنجاح", description: "تم إضافة مشاركتك إلى قسم الأسئلة والطلبات." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdatePost = async () => {
    if (!editPost || !editText.trim() || !user) return;
    try {
      await updateQAPostUser(editPost.id, user.id, editText, editPost.category, editAnonymous);
      setEditPost(null);
      toast({ title: "تم التعديل", description: "تم تحديث مشاركتك بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePost = useCallback(async (post: QAPost) => {
    if (!user) return;
    try {
      await deleteQAPostUser(post.id, user.id);
      toast({ title: "تم الحذف", description: "تم حذف مشاركتك بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  }, [user]);

  const handleAnswerPost = async () => {
    if (!answerPost || !answerText.trim() || !user) return;
    try {
      await answerQAPost(answerPost.id, answerText, user.name || 'الإدارة', answerAlert);
      setAnswerPost(null); setAnswerText(""); setAnswerAlert("");
      toast({ title: "تم الرد", description: "تم إضافة الرد بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleAddFollowUp = async () => {
    if (!followUpPost || !followUpText.trim()) return;
    try {
      await addFollowUp(followUpPost.id, followUpText);
      setFollowUpPost(null); setFollowUpText("");
      toast({ title: "تم إرسال الاستفسار", description: "تم إضافة استفسارك التكميلي بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleAnswerFollowUp = async () => {
    if (!followUpAnswerPost || !followUpAnswerText.trim() || !user) return;
    try {
      await answerFollowUp(followUpAnswerPost.id, followUpAnswerText, user.name || 'الإدارة');
      setFollowUpAnswerPost(null); setFollowUpAnswerText("");
      toast({ title: "تم الرد على الاستفسار", description: "تم إضافة الرد على الاستفسار بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  // Dialog Triggers via Card
  const openEdit = useCallback((post: QAPost) => { setEditPost(post); setEditText(post.text); setEditAnonymous(post.isAnonymous || false); }, []);
  const openAnswer = useCallback((post: QAPost) => { setAnswerPost(post); setAnswerText(post.answer || ""); setAnswerAlert(post.answerAlert || ""); }, []);
  const openFollowUp = useCallback((post: QAPost) => { setFollowUpPost(post); setFollowUpText(""); }, []);
  const openFollowUpAnswer = useCallback((post: QAPost) => { setFollowUpAnswerPost(post); setFollowUpAnswerText(""); }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (post.answer && post.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === 'questions' && post.category !== 'question') return false;
    if (filter === 'requests' && post.category !== 'request') return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between flex-row-reverse">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 flex-row-reverse">
              <MessageCircleQuestion className="size-8 text-primary" />
              الأسئلة والطلبات
            </h1>
            <p className="text-muted-foreground mt-2 text-right">
              اطرح سؤالاً أو اطلب ميزة جديدة، وسيتم الرد عليك من قبل الإدارة. يمكن للجميع استعراض الأسئلة والإجابات.
            </p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-8 rounded-xl font-bold gap-3 text-lg flex-row-reverse bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95" size="lg">
                <Plus className="size-6" />
                إضافة جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
              <DialogHeader><DialogTitle>إضافة سؤال أو طلب جديد</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-full">
                  <Button variant={newPostCategory === 'question' ? 'default' : 'ghost'} className="flex-1 rounded-md" onClick={() => setNewPostCategory('question')}>سؤال</Button>
                  <Button variant={newPostCategory === 'request' ? 'default' : 'ghost'} className="flex-1 rounded-md" onClick={() => setNewPostCategory('request')}>طلب</Button>
                </div>
                <Textarea 
                  placeholder={newPostCategory === 'question' ? "اكتب سؤالك هنا..." : "اكتب طلبك أو اقتراحك هنا..."}
                  className="min-h-[120px] bg-slate-900 border-white/10 resize-none"
                  value={newPostText} onChange={(e) => setNewPostText(e.target.value)}
                />
                <div className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all duration-300", isAnonymous ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "bg-white/5 border-white/5")}>
                  <div className="flex flex-col gap-1 text-right">
                    <Label htmlFor="anonymous-mode" className="text-sm font-bold text-white tracking-wide">الوضع الخفى (هوية مخفية)</Label>
                    <span className="text-[10px] text-muted-foreground font-medium">لن يظهر اسمك في القائمة العامة للمشاركات.</span>
                  </div>
                  <Switch id="anonymous-mode" checked={isAnonymous} onCheckedChange={setIsAnonymous} className="data-[state=checked]:bg-primary"/>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button onClick={handleAddPost} disabled={!newPostText.trim()} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 font-bold text-lg shadow-lg shadow-primary/20 gap-2">
                  <Send className="size-4 rotate-180" /> إرسال الطلب الآن
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input placeholder="ابحث في الأسئلة والطلبات..." className="pl-4 pr-12 h-12 bg-slate-900/50 border-white/10 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} dir="rtl"/>
          </div>
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} className="rounded-xl border-white/10 h-12" onClick={() => setFilter('all')}>الكل</Button>
            <Button variant={filter === 'questions' ? 'default' : 'outline'} className="rounded-xl border-white/10 h-12" onClick={() => setFilter('questions')}>أسئلة</Button>
            <Button variant={filter === 'requests' ? 'default' : 'outline'} className="rounded-xl border-white/10 h-12" onClick={() => setFilter('requests')}>طلبات</Button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="grid grid-cols-1 gap-4 pb-20">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">جاري التحميل...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center justify-center">
              <MessageCircleQuestion className="size-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">لا يوجد أسئلة أو طلبات متاحة.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <QAPostCard 
                key={post.id} 
                post={post} 
                currentUser={user} 
                isManagement={isManagement} 
                onEdit={openEdit} 
                onDelete={handleDeletePost} 
                onAnswer={openAnswer} 
                onFollowUp={openFollowUp} 
                onFollowUpAnswer={openFollowUpAnswer}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Global Modals for better DOM performance */}
      
      {/* Edit User Post Dialog */}
      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
          <DialogHeader><DialogTitle>تعديل {editPost?.category === 'question' ? 'السؤال' : 'الطلب'}</DialogTitle></DialogHeader>
          <Textarea 
            className="min-h-[120px] bg-slate-900 border-white/10 mt-4 resize-none"
            value={editText} onChange={(e) => setEditText(e.target.value)}
          />
          <div className="flex items-center justify-between p-2 mt-4 bg-white/5 rounded-lg">
            <Label htmlFor="edit-anonymous-mode" className="text-sm text-white/70">إرسال بهوية مخفية (Anonymous)</Label>
            <Switch id="edit-anonymous-mode" checked={editAnonymous} onCheckedChange={setEditAnonymous} />
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={handleUpdatePost} disabled={!editText.trim() || (editText === editPost?.text && editAnonymous === editPost?.isAnonymous)} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 font-bold shadow-lg shadow-primary/20">
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Answer Post Dialog */}
      <Dialog open={!!answerPost} onOpenChange={(open) => !open && setAnswerPost(null)}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
          <DialogHeader><DialogTitle>{answerPost?.answer ? 'تعديل الرد' : 'إضافة رد إداري'}</DialogTitle></DialogHeader>
          <Textarea 
            placeholder="اكتب ردك هنا..." className="min-h-[120px] bg-slate-900 border-white/10 mt-4 resize-none"
            value={answerText} onChange={(e) => setAnswerText(e.target.value)}
          />
          <div className="space-y-2 mt-4">
            <Label className="text-xs text-muted-foreground mr-1">تنبيه أو ملاحظة هامة (اختياري)</Label>
            <Input 
              placeholder="مثال: يرجى العلم أن هذه الميزة قيد الاختبار..." className="bg-slate-900 border-white/10 h-10 text-xs"
              value={answerAlert} onChange={(e) => setAnswerAlert(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={handleAnswerPost} disabled={!answerText.trim() || (answerText === answerPost?.answer && answerAlert === answerPost?.answerAlert)} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-emerald-600 font-bold shadow-lg shadow-emerald-500/20">
              اعتماد الرد الإداري
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Follow-up Dialog */}
      <Dialog open={!!followUpPost} onOpenChange={(open) => !open && setFollowUpPost(null)}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
          <DialogHeader><DialogTitle>إضافة استفسار أو طلب تكميلي</DialogTitle></DialogHeader>
          <Textarea 
            placeholder="هل لديك توضيح إضافي أو طلب مرتبط بهذا الرد؟" className="min-h-[120px] bg-slate-900 border-white/10 mt-4 resize-none"
            value={followUpText} onChange={(e) => setFollowUpText(e.target.value)}
          />
          <DialogFooter className="mt-4">
            <Button onClick={handleAddFollowUp} disabled={!followUpText.trim()}>إرسال الاستفسار</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Answer Follow-up Dialog */}
      <Dialog open={!!followUpAnswerPost} onOpenChange={(open) => !open && setFollowUpAnswerPost(null)}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
          <DialogHeader><DialogTitle>الرد على الاستفسار التكميلي</DialogTitle></DialogHeader>
          <Textarea 
            placeholder="اكتب ردك هنا..." className="min-h-[100px] bg-slate-900 border-white/10 mt-4 resize-none"
            value={followUpAnswerText} onChange={(e) => setFollowUpAnswerText(e.target.value)}
          />
          <DialogFooter className="mt-4">
            <Button onClick={handleAnswerFollowUp} disabled={!followUpAnswerText.trim()}>إرسال الرد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

