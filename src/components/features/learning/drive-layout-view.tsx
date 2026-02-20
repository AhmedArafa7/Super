
'use client';

import React, { useState } from "react";
import { 
  Folder, FileText, Video, Mic, 
  MoreVertical, ChevronRight, LayoutGrid, 
  List, HardDrive, ArrowLeft, Play,
  ExternalLink, File, ShieldCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Subject, Collection, LearningItem } from "@/lib/learning-store";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DriveLayoutViewProps {
  subjects: Subject[];
  collections: Collection[];
  itemsMap: Record<string, LearningItem[]>;
  selectedSubject: Subject | null;
  onSelectSubject: (s: Subject | null) => void;
  onAddSubject?: () => void;
  onAddCollection?: () => void;
  isAdmin: boolean;
}

/**
 * [STABILITY_ANCHOR: DRIVE_LAYOUT_VIEW_V1.0]
 * واجهة تحاكي Google Drive لعرض المحتوى التعليمي.
 */
export function DriveLayoutView({ 
  subjects, 
  collections, 
  itemsMap, 
  selectedSubject, 
  onSelectSubject,
  onAddSubject,
  onAddCollection,
  isAdmin
}: DriveLayoutViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="size-5 text-indigo-400" />;
      case 'audio': return <Mic className="size-5 text-emerald-400" />;
      case 'text': return <FileText className="size-5 text-blue-400" />;
      default: return <File className="size-5 text-slate-400" />;
    }
  };

  // عرض القطاعات (المجلدات الرئيسية)
  if (!selectedSubject) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-right">
        <div className="flex items-center justify-between flex-row-reverse mb-6">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">المجلدات التعليمية (القطاعات)</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={cn("rounded-xl", viewMode === 'grid' && "bg-white/10 text-white")}><LayoutGrid className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={cn("rounded-xl", viewMode === 'list' && "bg-white/10 text-white")}><List className="size-4" /></Button>
          </div>
        </div>

        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
        )}>
          {subjects.map((s) => (
            <Card 
              key={s.id} 
              onClick={() => onSelectSubject(s)}
              className={cn(
                "group glass border-white/5 hover:border-primary/40 transition-all cursor-pointer flex items-center gap-4 flex-row-reverse",
                viewMode === 'grid' ? "p-6 rounded-[1.5rem] flex-col text-center" : "p-4 rounded-xl"
              )}
            >
              <div className={cn(
                "rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-110 transition-transform",
                viewMode === 'grid' ? "size-16" : "size-10"
              )}>
                <Folder className={cn(viewMode === 'grid' ? "size-8" : "size-5", "text-primary fill-primary/20")} />
              </div>
              <div className="flex-1 min-w-0">
                <p dir="auto" className="font-bold text-white truncate">{s.title}</p>
                <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Subject Folder</p>
              </div>
              <MoreVertical className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          ))}
          {isAdmin && (
            <button 
              onClick={onAddSubject}
              className={cn(
                "border-2 border-dashed border-white/5 rounded-[1.5rem] flex flex-col items-center justify-center text-muted-foreground hover:border-primary/20 hover:bg-white/5 transition-all",
                viewMode === 'grid' ? "h-40" : "h-14 flex-row gap-3"
              )}
            >
              <HardDrive className="size-6 mb-2" />
              <span className="text-xs font-bold">إنشاء قطاع جديد</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // عرض الدروس والأصول داخل قطاع محدد
  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 text-right">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-bold flex-row-reverse">
        <button onClick={() => onSelectSubject(null)} className="text-muted-foreground hover:text-white">الرئيسية</button>
        <ChevronRight className="size-3 text-muted-foreground rotate-180" />
        <span className="text-primary truncate max-w-[200px]">{selectedSubject.title}</span>
      </nav>

      <div className="space-y-10">
        {collections.map((col) => (
          <div key={col.id} className="space-y-4">
            <div className="flex items-center justify-between flex-row-reverse border-b border-white/5 pb-2">
              <div className="flex items-center gap-3 flex-row-reverse">
                <Folder className="size-4 text-amber-400 fill-amber-400/20" />
                <h4 dir="auto" className="font-bold text-white">{col.title}</h4>
                <Link href={`/learn/${col.id}?subjectId=${selectedSubject.id}`}>
                   <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[10px] text-indigo-400 hover:bg-indigo-500/10 gap-1 px-2">
                     <Play className="size-2" /> دخول الدرس
                   </Button>
                </Link>
              </div>
              <Badge variant="outline" className="text-[8px] opacity-40 border-white/10">{itemsMap[col.id]?.length || 0} ملفات</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsMap[col.id]?.map((item) => (
                <Card key={item.id} className="p-4 glass border-white/5 hover:border-indigo-500/30 transition-all group flex items-center gap-4 flex-row-reverse">
                  <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                    {getFileIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p dir="auto" className="text-xs font-bold text-white truncate">{item.title}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-[8px] text-muted-foreground uppercase font-black">{item.type}</span>
                      {item.url?.includes('drive.google.com') && (
                        <div className="flex items-center gap-1 text-[8px] text-indigo-400 font-bold">
                          <ShieldCheck className="size-2" /> VAULT
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 group-hover:opacity-100" onClick={() => window.open(item.url, '_blank')}>
                    <ExternalLink className="size-3" />
                  </Button>
                </Card>
              ))}
              {isAdmin && (
                <button 
                  onClick={onAddCollection}
                  className="border-2 border-dashed border-white/5 rounded-xl p-4 flex items-center justify-center gap-3 text-muted-foreground hover:border-primary/20 hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" />
                  <span className="text-[10px] font-bold">إلحاق ملف</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
