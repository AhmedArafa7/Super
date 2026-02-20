
'use client';

import React, { useState } from "react";
import { 
  Folder, FileText, Video, Mic, 
  MoreVertical, ChevronRight, LayoutGrid, 
  List, HardDrive, ArrowLeft, Play,
  ExternalLink, File, ShieldCheck,
  Pencil, Trash2, Share2, Eye, Info, RefreshCw, Database
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Subject, Collection, LearningItem } from "@/lib/learning-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

interface DriveLayoutViewProps {
  subjects: Subject[];
  collections: Collection[];
  itemsMap: Record<string, LearningItem[]>;
  selectedSubject: Subject | null;
  onSelectSubject: (s: Subject | null) => void;
  onAddSubject?: () => void;
  onAddCollection?: () => void;
  onDeleteSubject?: (id: string) => Promise<void>;
  onRenameSubject?: (id: string, currentTitle: string) => Promise<void>;
  onDeleteCollection?: (subjectId: string, colId: string) => Promise<void>;
  onDeleteItem?: (subjectId: string, colId: string, itemId: string) => Promise<void>;
  isAdmin: boolean;
}

/**
 * [STABILITY_ANCHOR: DRIVE_LAYOUT_VIEW_V3.5]
 * واجهة تحاكي Google Drive بدقة مع توضيح بروتوكول المزامنة الهجينة.
 */
export function DriveLayoutView({ 
  subjects, 
  collections, 
  itemsMap, 
  selectedSubject, 
  onSelectSubject,
  onAddSubject,
  onAddCollection,
  onDeleteSubject,
  onRenameSubject,
  onDeleteCollection,
  onDeleteItem,
  isAdmin
}: DriveLayoutViewProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="size-5 text-indigo-400" />;
      case 'audio': return <Mic className="size-5 text-emerald-400" />;
      case 'text': return <FileText className="size-5 text-blue-400" />;
      default: return <File className="size-5 text-slate-400" />;
    }
  };

  const handleCopyLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast({ title: "تم نسخ الرابط", description: "رابط الأصل جاهز للمشاركة العصبية." });
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-right">
        {/* معلومات المزامنة الهجينة */}
        <div className="p-6 bg-slate-900/40 border border-white/10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 flex-row-reverse text-right shadow-xl">
          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Database className="size-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-widest">Nexus Metadata Engine</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">هذه المجلدات مخزنة في Firestore كطبقة تنظيمية لروابط جوجل درايف الخاصة بك.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="ghost" className="h-10 rounded-xl text-indigo-400 hover:bg-indigo-500/10 font-bold gap-2" onClick={() => window.open(VAULT_URL, '_blank')}>
               <ExternalLink className="size-3" /> فتح Drive الحقيقي
             </Button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-row-reverse mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">مجلدات القطاعات (Organization)</h3>
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
                "group glass border-white/5 hover:border-primary/40 transition-all cursor-pointer flex items-center gap-4 flex-row-reverse relative",
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
                <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Subject Node</p>
              </div>
              
              <div className="absolute top-2 left-2 sm:static">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="size-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-slate-900 border-white/10 text-white min-w-[160px]">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectSubject(s); }} className="flex-row-reverse gap-3 text-right">
                      <Eye className="size-4 text-indigo-400" /> فتح القطاع
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRenameSubject?.(s.id, s.title); }} className="flex-row-reverse gap-3 text-right">
                          <Pencil className="size-4 text-indigo-400" /> إعادة تسمية
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteSubject?.(s.id); }} className="flex-row-reverse gap-3 text-right text-red-400 focus:text-red-400">
                          <Trash2 className="size-4" /> حذف من السجل
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
          {isAdmin && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAddSubject?.(); }}
              className={cn(
                "border-2 border-dashed border-white/5 rounded-[1.5rem] flex flex-col items-center justify-center text-muted-foreground hover:border-primary/20 hover:bg-white/5 transition-all",
                viewMode === 'grid' ? "h-40" : "h-14 flex-row gap-3"
              )}
            >
              <Plus className="size-6 mb-2" />
              <span className="text-xs font-bold">إضافة قطاع للسجل</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 text-right">
      <nav className="flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-2 text-xs font-bold flex-row-reverse">
          <button onClick={() => onSelectSubject(null)} className="text-muted-foreground hover:text-white transition-colors">الرئيسية</button>
          <ChevronRight className="size-3 text-muted-foreground rotate-180" />
          <span className="text-primary truncate max-w-[200px]">{selectedSubject.title}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
           <RefreshCw className="size-2 text-green-400 animate-spin" />
           <span className="text-[8px] font-black uppercase text-green-400">Nexus Metadata Sync Active</span>
        </div>
      </nav>

      <div className="space-y-10">
        {collections.map((col) => (
          <div key={col.id} className="space-y-4">
            <div className="flex items-center justify-between flex-row-reverse border-b border-white/5 pb-2">
              <div className="flex items-center gap-3 flex-row-reverse">
                <Folder className="size-4 text-amber-400 fill-amber-400/20" />
                <h4 dir="auto" className="font-bold text-white">{col.title}</h4>
                <Link href={`/learn/${col.id}?subjectId=${selectedSubject.id}`} onClick={(e) => e.stopPropagation()}>
                   <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[10px] text-indigo-400 hover:bg-indigo-500/10 gap-1 px-2">
                     <Play className="size-2" /> دخول الدرس
                   </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] opacity-40 border-white/10">{itemsMap[col.id]?.length || 0} ملفات</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                      <MoreVertical className="size-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-slate-900 border-white/10 text-white">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "بروتوكول المشاركة", description: "جاري توليد رابط الوحدة..." }); }} className="flex-row-reverse gap-3 text-right">
                      <Share2 className="size-4 text-indigo-400" /> مشاركة الرابط
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteCollection?.(selectedSubject.id, col.id); }} className="flex-row-reverse gap-3 text-right text-red-400 focus:text-red-400">
                        <Trash2 className="size-4" /> حذف من السجل
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {itemsMap[col.id]?.map((item) => (
                <Card 
                  key={item.id} 
                  onClick={() => item.url && window.open(item.url, '_blank')}
                  className="p-4 glass border-white/5 hover:border-indigo-500/30 transition-all group flex items-center gap-4 flex-row-reverse cursor-pointer"
                >
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
                  
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="size-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-slate-900 border-white/10 text-white">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if(item.url) window.open(item.url, '_blank'); }} className="flex-row-reverse gap-3 text-right">
                          <ExternalLink className="size-4 text-indigo-400" /> فتح المصدر الأصلي
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { if(item.url) handleCopyLink(e, item.url); }} className="flex-row-reverse gap-3 text-right">
                          <Share2 className="size-4 text-indigo-400" /> نسخ الرابط
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteItem?.(selectedSubject.id, col.id, item.id); }} className="flex-row-reverse gap-3 text-right text-red-400 focus:text-red-400">
                            <Trash2 className="size-4" /> إزالة من السجل
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
              {isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddCollection?.(); }}
                  className="border-2 border-dashed border-white/5 rounded-xl p-4 flex items-center justify-center gap-3 text-muted-foreground hover:border-primary/20 hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" />
                  <span className="text-[10px] font-bold">تسجيل أصل جديد</span>
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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
  );
}
