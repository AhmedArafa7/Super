
'use client';

import React from "react";
import { 
  Folder, FileText, Video, Mic, 
  MoreVertical, ChevronRight, HardDrive, 
  Play, ExternalLink, File, ShieldCheck,
  Pencil, Trash2, Share2, Eye, Plus, Database
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

interface DriveLayoutViewProps {
  subjects: Subject[];
  collections: Collection[];
  itemsMap: Record<string, LearningItem[]>;
  selectedSubject: Subject | null;
  onSelectSubject: (s: Subject | null) => void;
  onAddSubject?: () => void;
  onAddCollection?: () => void;
  onAddItem?: (colId: string) => void;
  onDeleteSubject?: (id: string) => Promise<void>;
  onRenameSubject?: (id: string, currentTitle: string) => Promise<void>;
  onDeleteCollection?: (subjectId: string, colId: string) => Promise<void>;
  onDeleteItem?: (subjectId: string, colId: string, itemId: string) => Promise<void>;
  isAdmin: boolean;
  viewMode: 'grid' | 'list';
}

export function DriveLayoutView({ 
  subjects, 
  collections, 
  itemsMap, 
  selectedSubject, 
  onSelectSubject,
  onAddSubject,
  onAddCollection,
  onAddItem,
  onDeleteSubject,
  onRenameSubject,
  onDeleteCollection,
  onDeleteItem,
  isAdmin,
  viewMode
}: DriveLayoutViewProps) {
  const { toast } = useToast();

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="size-5 text-indigo-400" />;
      case 'audio': return <Mic className="size-5 text-emerald-400" />;
      case 'text': return <FileText className="size-5 text-blue-400" />;
      default: return <File className="size-5 text-slate-400" />;
    }
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 text-right">
        <div className="flex items-center justify-between flex-row-reverse mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">المجلدات الرئيسية</h3>
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
                <p className="text-[10px] text-muted-foreground uppercase mt-0.5">مجلد رئيسي</p>
              </div>
              
              <div className="absolute top-2 left-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="size-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-slate-900 border-white/10 text-white min-w-[160px]">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectSubject(s); }} className="flex-row-reverse gap-3 text-right">
                      <Eye className="size-4 text-indigo-400" /> فتح
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRenameSubject?.(s.id, s.title); }} className="flex-row-reverse gap-3 text-right">
                          <Pencil className="size-4 text-indigo-400" /> إعادة تسمية
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteSubject?.(s.id); }} className="flex-row-reverse gap-3 text-right text-red-400 focus:text-red-400">
                          <Trash2 className="size-4" /> حذف
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
              <span className="text-xs font-bold">إضافة مجلد</span>
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
          <button onClick={() => onSelectSubject(null)} className="text-muted-foreground hover:text-white transition-colors">المكتبة</button>
          <ChevronRight className="size-3 text-muted-foreground rotate-180" />
          <span className="text-primary truncate max-w-[200px]">{selectedSubject.title}</span>
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
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "تم نسخ الرابط" }); }} className="flex-row-reverse gap-3 text-right">
                      <Share2 className="size-4 text-indigo-400" /> مشاركة
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteCollection?.(selectedSubject.id, col.id); }} className="flex-row-reverse gap-3 text-right text-red-400 focus:text-red-400">
                        <Trash2 className="size-4" /> حذف المجلد
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
                          <ExternalLink className="size-4 text-indigo-400" /> فتح المصدر
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteItem?.(selectedSubject.id, col.id, item.id); }} className="flex-row-reverse gap-3 text-right text-red-400 focus:text-red-400">
                            <Trash2 className="size-4" /> إزالة
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
              {isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddItem?.(col.id); }}
                  className="border-2 border-dashed border-white/5 rounded-xl p-4 flex items-center justify-center gap-3 text-muted-foreground hover:border-primary/20 hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" />
                  <span className="text-[10px] font-bold">ربط ملف جديد</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {isAdmin && (
          <Button variant="outline" className="w-full border-dashed border-2 h-16 rounded-[1.5rem] text-muted-foreground hover:bg-white/5" onClick={onAddCollection}>
            <Plus className="size-5 ml-2" /> إضافة مجلد دروس جديد
          </Button>
        )}
      </div>
    </div>
  );
}
