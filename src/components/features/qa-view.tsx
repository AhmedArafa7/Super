'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { subscribeToQAPosts, addQAPost, updateQAPostUser, deleteQAPostUser, answerQAPost, QAPost, QACategory } from "@/lib/qa-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, MessageCircleQuestion, Send, Clock, Edit, Trash, FileQuestion, HelpCircle, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { getRelativeTime } from "@/lib/date-utils";

export function QAView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<QAPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'questions' | 'requests'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<QACategory>('question');

  const [editPost, setEditPost] = useState<QAPost | null>(null);
  const [editText, setEditText] = useState("");
  
  const [answerPost, setAnswerPost] = useState<QAPost | null>(null);
  const [answerText, setAnswerText] = useState("");

  const isManagement = ['founder', 'cofounder', 'admin', 'management'].includes(user?.role || '');

  useEffect(() => {
    const unsubscribe = subscribeToQAPosts((data) => {
      setPosts(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPost = async () => {
    if (!newPostText.trim() || !user) return;
    try {
      await addQAPost({
        category: newPostCategory,
        text: newPostText,
        authorId: user.id || '',
        authorName: user.name || 'مستخدم'
      });
      setNewPostText("");
      setIsAddOpen(false);
      toast({ title: "تم الإرسال بنجاح", description: "تم إضافة مشاركتك إلى قسم الأسئلة والطلبات." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdatePost = async () => {
    if (!editPost || !editText.trim() || !user) return;
    try {
      await updateQAPostUser(editPost.id, user.id, editText, editPost.category);
      setEditPost(null);
      toast({ title: "تم التعديل", description: "تم تحديث مشاركتك بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePost = async (post: QAPost) => {
    if (!user) return;
    try {
      await deleteQAPostUser(post.id, user.id);
      toast({ title: "تم الحذف", description: "تم حذف مشاركتك بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleAnswerPost = async () => {
    if (!answerPost || !answerText.trim() || !user) return;
    try {
      await answerQAPost(answerPost.id, answerText, user.name || 'الإدارة');
      setAnswerPost(null);
      setAnswerText("");
      toast({ title: "تم الرد", description: "تم إضافة الرد بنجاح." });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

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
              <Button className="h-12 px-6 rounded-xl font-bold gap-2 text-base flex-row-reverse" size="lg">
                <Plus className="size-5" />
                إضافة جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة سؤال أو طلب جديد</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-full">
                  <Button 
                    variant={newPostCategory === 'question' ? 'default' : 'ghost'} 
                    className="flex-1 rounded-md" 
                    onClick={() => setNewPostCategory('question')}
                  >سؤال</Button>
                  <Button 
                    variant={newPostCategory === 'request' ? 'default' : 'ghost'} 
                    className="flex-1 rounded-md" 
                    onClick={() => setNewPostCategory('request')}
                  >طلب</Button>
                </div>
                <Textarea 
                  placeholder={newPostCategory === 'question' ? "اكتب سؤالك هنا..." : "اكتب طلبك أو اقتراحك هنا..."}
                  className="min-h-[120px] bg-slate-900 border-white/10 resize-none"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={handleAddPost} disabled={!newPostText.trim()}>إرسال</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input 
              placeholder="ابحث في الأسئلة والطلبات..." 
              className="pl-4 pr-12 h-12 bg-slate-900/50 border-white/10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              dir="rtl"
            />
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
              <Card key={post.id} className="bg-slate-900/80 border-white/10 overflow-hidden backdrop-blur-xl transition-all hover:bg-slate-900/90" dir="rtl">
                <CardHeader className="p-5 pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {post.category === 'question' ? <HelpCircle className="size-5" /> : <FileQuestion className="size-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{post.authorName}</span>
                          <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-white/5 text-muted-foreground gap-1.5 flex items-center">
                            {post.category === 'question' ? 'سؤال' : 'طلب'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {getRelativeTime(post.createdAt || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions for User (Edit/Delete if unanswered) */}
                    {user?.id === post.authorId && !post.answer && (
                      <div className="flex gap-2">
                        <Dialog open={editPost?.id === post.id} onOpenChange={(open) => {
                          if (open) { setEditPost(post); setEditText(post.text); }
                          else setEditPost(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white rounded-lg">
                              <Edit className="size-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
                            <DialogHeader><DialogTitle>تعديل {post.category === 'question' ? 'السؤال' : 'الطلب'}</DialogTitle></DialogHeader>
                            <Textarea 
                              className="min-h-[120px] bg-slate-900 border-white/10 mt-4 resize-none"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                            />
                            <DialogFooter className="mt-4">
                              <Button onClick={handleUpdatePost} disabled={!editText.trim() || editText === post.text}>حفظ التعديلات</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-400 rounded-lg" onClick={() => handleDeletePost(post)}>
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
                  
                  {/* The Answer block */}
                  {post.answer && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl relative">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="size-4 text-primary" />
                        <span className="text-primary font-bold text-xs">{post.answeredBy}</span>
                        <span className="text-muted-foreground text-[10px] mr-auto">{getRelativeTime(post.answeredAt || new Date().toISOString())}</span>
                      </div>
                      <p className="text-primary/90 text-sm leading-relaxed whitespace-pre-wrap">{post.answer}</p>
                    </div>
                  )}
                  
                  {/* Actions for Admin to Reply or Edit Reply */}
                  {isManagement && (
                    <div className="mt-4 border-t border-white/5 pt-4">
                      <Dialog open={answerPost?.id === post.id} onOpenChange={(open) => {
                        if (open) { setAnswerPost(post); setAnswerText(post.answer || ""); }
                        else setAnswerPost(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant={post.answer ? "outline" : "default"} size="sm" className="rounded-lg h-9 font-bold text-xs gap-2">
                            {post.answer ? <Edit className="size-3" /> : <Send className="size-3" />}
                            {post.answer ? 'تعديل الرد' : 'الرد على المشاركة'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-right" dir="rtl">
                          <DialogHeader><DialogTitle>{post.answer ? 'تعديل الرد' : 'إضافة رد'}</DialogTitle></DialogHeader>
                          <Textarea 
                            placeholder="اكتب ردك هنا..."
                            className="min-h-[120px] bg-slate-900 border-white/10 mt-4 resize-none"
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                          />
                          <DialogFooter className="mt-4">
                            <Button onClick={handleAnswerPost} disabled={!answerText.trim() || answerText === post.answer}>حفظ الرد</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
