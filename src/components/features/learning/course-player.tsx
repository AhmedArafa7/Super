
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  FileText, 
  Trophy, 
  Loader2, 
  Menu, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  AlignLeft,
  Mic,
  Volume2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { initializeFirebase } from "@/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { LearningItem } from "@/lib/learning-store";
import { QuizPlayer } from "./quiz-player";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface CoursePlayerProps {
  collectionId: string;
  subjectId?: string | null;
}

const formatMediaUrl = (url?: string) => {
  if (!url) return "";
  if (url.includes('drive.google.com')) {
    return url.replace('/view', '/preview').replace('/edit', '/preview');
  }
  return url;
};

/**
 * [STABILITY_ANCHOR: COURSE_PLAYER_V3.1]
 * مشغل المسارات التعليمية - تم إصلاح أخطاء الفهرسة عبر استخدام المسارات المباشرة.
 */
export function CoursePlayer({ collectionId, subjectId }: CoursePlayerProps) {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [activeItem, setActiveItem] = useState<LearningItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (subjectId) {
      fetchCollectionItems();
    }
  }, [collectionId, subjectId]);

  const fetchCollectionItems = async () => {
    if (!subjectId) return;
    setIsLoading(true);
    const { firestore } = initializeFirebase();
    try {
      // استخدام مسار مباشر لتجنب الحاجة لفهارس Collection Group
      const itemsRef = collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items');
      const q = query(itemsRef, orderBy('orderIndex', 'asc'));

      const snapshot = await getDocs(q);
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LearningItem[];

      setItems(fetchedItems);
      if (fetchedItems.length > 0) {
        setActiveItem(fetchedItems[0]);
      }
    } catch (err) {
      console.error("Neural Fetch Failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeIndex = useMemo(() => 
    items.findIndex(item => item.id === activeItem?.id), 
    [items, activeItem]
  );

  const handleNext = useCallback(() => {
    if (activeIndex < items.length - 1) {
      setActiveItem(items[activeIndex + 1]);
    }
  }, [activeIndex, items]);

  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      setActiveItem(items[activeIndex - 1]);
    }
  }, [activeIndex, items]);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="size-4" />;
      case 'audio': return <Mic className="size-4" />;
      case 'text': return <AlignLeft className="size-4" />;
      case 'quiz_json': return <Trophy className="size-4" />;
      default: return <FileText className="size-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">جاري استدعاء العقد التعليمية...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center flex-col p-6 text-center">
        <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <FileText className="size-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">لا يوجد محتوى</h2>
        <p className="text-muted-foreground mb-8">هذا المسار المعرفي فارغ حالياً في السجل العالمي.</p>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-xl border-white/10">العودة للوحة التحكم</Button>
        </Link>
      </div>
    );
  }

  const finalUrl = activeItem?.url ? formatMediaUrl(activeItem.url) : "";
  const isVaultItem = activeItem?.url?.includes('drive.google.com');

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-50 font-sans">
      {!isSidebarOpen && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 right-4 z-50 bg-black/50 backdrop-blur-md rounded-full border border-white/10 md:hidden"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
      )}

      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isSidebarOpen ? "md:mr-0" : ""
      )}>
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md shrink-0 flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                <ArrowLeft className="size-5 rotate-180" />
              </Button>
            </Link>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-2 flex-row-reverse">
              <h1 dir="auto" className="font-bold text-sm truncate max-w-[200px] md:max-w-md text-right text-white">
                {activeItem?.title}
              </h1>
              {isVaultItem && <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px] h-4">Vault</Badge>}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden md:flex gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            {isSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
          </Button>
        </header>

        <div className="flex-1 bg-black relative flex flex-col">
          <div className="flex-1 relative overflow-y-auto">
            {activeItem?.type === 'video' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {mounted && (
                  <ReactPlayer
                    url={finalUrl}
                    width="100%"
                    height="100%"
                    controls
                    playing
                    onEnded={handleNext}
                    config={{
                      youtube: { playerVars: { showinfo: 0, rel: 0 } },
                      file: { attributes: { controlsList: 'nodownload' } }
                    }}
                  />
                )}
              </div>
            ) : activeItem?.type === 'audio' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 p-6">
                <div className="max-w-md w-full p-10 glass border-white/10 rounded-[3rem] text-center">
                  <div className="size-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
                    <Volume2 className="size-12 text-indigo-400" />
                  </div>
                  <h3 dir="auto" className="text-2xl font-bold mb-4 text-white">{activeItem.title}</h3>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    {mounted && (
                      <audio controls className="w-full">
                        <source src={finalUrl} />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                </div>
              </div>
            ) : activeItem?.type === 'text' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-8">
                <ScrollArea className="max-w-3xl w-full h-full max-h-[90%] glass border-white/10 rounded-[2.5rem] p-10">
                  <div className="flex items-center gap-3 mb-8 justify-end">
                    <h2 dir="auto" className="text-3xl font-bold text-white tracking-tight text-right">{activeItem.title}</h2>
                    <div className="size-10 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <AlignLeft className="size-5 text-indigo-400" />
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p dir="auto" className="text-lg text-slate-300 leading-loose whitespace-pre-wrap text-right font-medium">
                      {activeItem.url}
                    </p>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="max-w-md w-full p-8 glass border-white/10 rounded-[2.5rem] text-center">
                  <div className="size-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/10">
                    <FileText className="size-10 text-indigo-400" />
                  </div>
                  <h3 dir="auto" className="text-2xl font-bold mb-2 text-white">{activeItem?.title}</h3>
                  <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                    {isVaultItem ? "هذا المستند مخزن في خزنة Nexus Vault السيادية." : "هذا الدرس يحتوي على أصل رقمي خارجي."}
                  </p>
                  <a href={activeItem?.url} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button className="w-full h-12 bg-indigo-600 rounded-xl font-bold shadow-lg shadow-indigo-600/20 gap-2">
                      <ExternalLink className="size-4" /> فتح الأصل الرقمي
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="h-20 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 flex-row-reverse">
            <Button 
              className="rounded-xl bg-primary h-11 px-6 group font-bold"
              onClick={handleNext}
              disabled={activeIndex === items.length - 1}
            >
              الدرس التالي
              <ChevronRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="hidden sm:flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">معدل الإنجاز</span>
              <span className="text-sm font-mono text-white">{(activeIndex + 1).toString().padStart(2, '0')} / {items.length.toString().padStart(2, '0')}</span>
            </div>

            <Button 
              variant="outline" 
              className="rounded-xl border-white/10 h-11 px-6 group font-bold"
              onClick={handlePrevious}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform rotate-180" />
              السابق
            </Button>
          </div>
        </div>
      </div>

      <aside className={cn(
        "w-80 border-l border-white/5 bg-slate-900/90 backdrop-blur-2xl flex flex-col transition-all duration-300 absolute inset-y-0 right-0 z-40 md:relative translate-x-full md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : ""
      )}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-row-reverse">
          <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-indigo-400 text-right">قائمة المسار العصبي</h3>
          <Button variant="ghost" size="icon" className="md:hidden rounded-full h-8 w-8" onClick={() => setIsSidebarOpen(false)}><X className="size-4" /></Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {items.map((item, index) => {
              const isActive = item.id === activeItem?.id;
              const isCompleted = index < activeIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 group flex-row-reverse text-right",
                    isActive 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className={cn(
                    "size-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                    isActive 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : isCompleted
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-white/5 border-white/10 text-muted-foreground group-hover:text-white"
                  )}>
                    {isCompleted ? <CheckCircle2 className="size-4" /> : getItemIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p dir="auto" className={cn(
                      "text-xs font-bold transition-colors line-clamp-2",
                      isActive ? "text-primary" : "text-slate-300 group-hover:text-white"
                    )}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      {item.url?.includes('drive.google.com') && <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[7px] py-0 px-1">VAULT</Badge>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between mb-4 flex-row-reverse">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">نسبة المزامنة المعرفية</span>
            <span className="text-[10px] font-mono text-primary">{Math.round((activeIndex / items.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(activeIndex / items.length) * 100}%` }} />
          </div>
        </div>
      </aside>
    </div>
  );
}
