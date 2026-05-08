'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Plus, Trash2, Search, FileSpreadsheet, Database,
  Calendar, Hash, Type, History, Settings2, Settings,
  MoreHorizontal, ArrowUpDown, PlusCircle, LayoutGrid
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/**
 * [INTERFACES]
 */
interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'status';
}

interface Row {
  id: string;
  [key: string]: any;
}

interface DataTable {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  rows: Row[];
  lastModified: string;
  category: string;
}

/**
 * [SUB-COMPONENT: EditableCell]
 * مكوّن مخصص لتقليل عمليات الـ Re-render وزيادة سلاسة الكتابة.
 */
const EditableCell = memo(({ value, type, onChange }: { value: any, type: string, onChange: (val: any) => void }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <input 
      className="w-full h-14 bg-transparent px-6 text-right text-xs text-white/70 focus:text-white focus:bg-primary/5 focus:outline-none transition-all tabular-nums font-medium"
      value={localValue}
      type={type === 'number' ? 'number' : 'text'}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) onChange(localValue);
      }}
    />
  );
});

EditableCell.displayName = 'EditableCell';

export function NexusSheets() {
  const [tables, setTables] = useState<DataTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const activeTable = tables.find(t => t.id === activeTableId) || null;

  // Persistence Logic
  useEffect(() => {
    const saved = localStorage.getItem('nexus-sheets-v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTables(parsed);
      if (parsed.length > 0) setActiveTableId(parsed[0].id);
    }
  }, []);

  const persist = useCallback((updated: DataTable[]) => {
    setTables(updated);
    localStorage.setItem('nexus-sheets-v2', JSON.stringify(updated));
  }, []);

  // Table Actions
  const createTable = () => {
    if (!newTableName.trim()) return;
    const newTable: DataTable = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTableName,
      description: 'جدول بيانات ذكي',
      category: 'عام',
      lastModified: new Date().toISOString(),
      columns: [
        { id: 'c1', name: 'البيان', type: 'text' },
        { id: 'c2', name: 'القيمة', type: 'number' },
        { id: 'c3', name: 'التاريخ', type: 'date' },
      ],
      rows: [{ id: 'r1', c1: 'سجل افتراضي', c2: 0, c3: new Date().toISOString().split('T')[0] }]
    };
    persist([...tables, newTable]);
    setActiveTableId(newTable.id);
    setNewTableName('');
    setIsCreateModalOpen(false);
    toast({ title: "تم إنشاء الجدول" });
  };

  const updateTableData = useCallback((tableId: string, updater: (t: DataTable) => DataTable) => {
    const updated = tables.map(t => t.id === tableId ? updater(t) : t);
    persist(updated);
  }, [tables, persist]);

  const addRow = () => {
    if (!activeTableId) return;
    updateTableData(activeTableId, (t) => ({
      ...t,
      rows: [...t.rows, { id: Math.random().toString(36).substr(2, 9) }],
      lastModified: new Date().toISOString()
    }));
  };

  const addColumn = (name: string, type: Column['type']) => {
    if (!activeTableId) return;
    updateTableData(activeTableId, (t) => ({
      ...t,
      columns: [...t.columns, { id: 'c' + Date.now(), name, type }],
      lastModified: new Date().toISOString()
    }));
  };

  const deleteRow = (rowId: string) => {
    if (!activeTableId) return;
    updateTableData(activeTableId, (t) => ({
      ...t,
      rows: t.rows.filter(r => r.id !== rowId)
    }));
  };

  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full flex bg-slate-950/40 text-white overflow-hidden animate-in fade-in duration-700 font-sans">
      
      {/* SIDEBAR: NAVIGATION */}
      <aside className="w-72 border-l border-white/5 bg-slate-900/60 backdrop-blur-3xl flex flex-col shrink-0">
        <div className="p-6">
           <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black gap-3 shadow-lg shadow-primary/20">
                  <Plus className="size-5" /> جدول جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2.5rem]">
                <DialogHeader><DialogTitle className="text-right font-black">إنشاء جدول</DialogTitle></DialogHeader>
                <div className="py-6"><Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="اسم الجدول..." className="bg-white/5 text-right h-14 rounded-xl" /></div>
                <DialogFooter><Button onClick={createTable} className="w-full h-12 rounded-xl bg-primary">تأكيد</Button></DialogFooter>
              </DialogContent>
           </Dialog>
        </div>

        <ScrollArea className="flex-1 px-3">
           <div className="space-y-1">
              {tables.map(t => (
                <button key={t.id} onClick={() => setActiveTableId(t.id)} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all flex-row-reverse group", activeTableId === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                  <div className="flex items-center gap-3 flex-row-reverse overflow-hidden">
                    <FileSpreadsheet className="size-4 shrink-0" />
                    <span className="text-xs font-bold truncate">{t.name}</span>
                  </div>
                  {activeTableId === t.id && <div className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />}
                </button>
              ))}
           </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5">
           <Button variant="ghost" className="w-full justify-end gap-3 text-muted-foreground hover:text-white rounded-xl flex-row-reverse"><Settings className="size-4" /><span className="text-xs font-bold">الإعدادات</span></Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 flex-row-reverse">
           <div className="flex items-center gap-4 flex-row-reverse">
              <h1 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Nexus Sheets</h1>
              <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary"><FileSpreadsheet className="size-4" /></div>
           </div>
           
           <div className="relative w-[450px]">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="البحث الذكي في البيانات..." className="w-full h-10 pr-12 bg-slate-950/50 border-white/5 rounded-xl text-xs text-right" />
           </div>

           <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 flex-row-reverse">
                 <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold tabular-nums">150.00</span>
              </div>
           </div>
        </header>

        {activeTable ? (
          <div className="flex-1 flex flex-col overflow-hidden p-8 animate-in slide-in-from-left-2 duration-500">
             
             {/* HEADER INFO */}
             <div className="flex items-center justify-between mb-8 flex-row-reverse">
                <div className="text-right">
                   <div className="flex items-center gap-3 flex-row-reverse">
                      <h2 className="text-3xl font-black text-white leading-none">{activeTable.name}</h2>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 rounded-lg text-[10px] h-5">قاعدة بيانات</Badge>
                   </div>
                   <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">محرر البيانات النشط</p>
                </div>
                
                <div className="flex items-center gap-3">
                   <Button variant="outline" className="h-10 rounded-xl border-white/5 bg-slate-900/40 text-xs font-bold gap-2 flex-row-reverse"><History className="size-4" /> السجل</Button>
                   <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 rounded-xl border-white/5 bg-slate-900/40 text-xs font-bold gap-2 flex-row-reverse"><LayoutGrid className="size-4" /> عمود جديد</Button></DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-900 border-white/10 text-white w-48 rounded-2xl p-2 shadow-2xl">
                        <DropdownMenuItem onClick={() => addColumn('نص', 'text')} className="flex-row-reverse gap-3 p-3 rounded-xl hover:bg-white/5"><Type className="size-4 text-blue-400" /> نص</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => addColumn('رقم', 'number')} className="flex-row-reverse gap-3 p-3 rounded-xl hover:bg-white/5"><Hash className="size-4 text-emerald-400" /> رقم</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => addColumn('تاريخ', 'date')} className="flex-row-reverse gap-3 p-3 rounded-xl hover:bg-white/5"><Calendar className="size-4 text-amber-400" /> تاريخ</DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                   <Button onClick={addRow} className="h-10 px-8 rounded-xl bg-primary text-white text-xs font-black gap-2 shadow-lg shadow-primary/20 flex-row-reverse"><Plus className="size-4" /> إضافة سجل</Button>
                </div>
             </div>

             {/* DATA GRID */}
             <div className="flex-1 flex flex-col rounded-[2.5rem] border border-white/5 bg-slate-900/20 backdrop-blur-md shadow-2xl overflow-hidden">
                <ScrollArea className="flex-1">
                   <Table className="relative">
                      <TableHeader className="bg-slate-900/60 sticky top-0 z-30 border-b border-white/5">
                         <TableRow className="border-none hover:bg-transparent h-16">
                            <TableHead className="w-16 border-l border-white/5"><Settings2 className="size-4 mx-auto opacity-20" /></TableHead>
                            {activeTable.columns.slice().reverse().map(col => (
                              <TableHead key={col.id} className="text-right text-indigo-300/60 font-black text-[10px] uppercase tracking-[0.2em] px-8 border-l border-white/5">
                                <div className="flex items-center justify-end gap-3">
                                   <ArrowUpDown className="size-3 opacity-20" />
                                   {col.name}
                                   {col.type === 'number' && <Hash className="size-3" />}
                                   {col.type === 'date' && <Calendar className="size-3" />}
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="w-16 border-l border-white/5"><Settings2 className="size-4 mx-auto opacity-20" /></TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {activeTable.rows.map((row) => (
                           <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group h-14">
                              <TableCell className="p-0 border-l border-white/5 text-center">
                                 <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 rounded-lg text-white/20 hover:text-white"><MoreHorizontal className="size-4" /></Button>
                              </TableCell>
                              {activeTable.columns.slice().reverse().map(col => (
                                <TableCell key={col.id} className="p-0 border-l border-white/5">
                                   <EditableCell 
                                      value={row[col.id] ?? ''} 
                                      type={col.type} 
                                      onChange={(val) => {
                                         updateTableData(activeTableId!, (t) => ({
                                            ...t,
                                            rows: t.rows.map(r => r.id === row.id ? { ...r, [col.id]: val } : r)
                                         }));
                                      }} 
                                   />
                                </TableCell>
                              ))}
                              <TableCell className="p-0 border-l border-white/5 text-center">
                                 <DropdownMenu dir="rtl">
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 rounded-lg"><MoreHorizontal className="size-4 opacity-40" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-900 border-white/10 text-white rounded-xl p-2">
                                       <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-red-400 gap-3 flex-row-reverse text-right hover:bg-red-500/10 rounded-lg p-2.5">
                                          <Trash2 className="size-4" /> حذف السجل بشكل نهائي
                                       </DropdownMenuItem>
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                              </TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </ScrollArea>
                
                {/* FOOTER BAR */}
                <footer className="h-12 bg-slate-950/60 border-t border-white/5 flex items-center justify-between px-10 text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0 flex-row-reverse">
                   <div className="flex items-center gap-8 flex-row-reverse">
                      {activeTable.columns.filter(c => c.type === 'number').map(col => {
                         const total = activeTable.rows.reduce((sum, r) => sum + (Number(r[col.id]) || 0), 0);
                         return (
                            <div key={col.id} className="flex items-center gap-3 flex-row-reverse bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                               <span className="text-emerald-400 tabular-nums">{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                               <span className="opacity-40">إجمالي {col.name}:</span>
                            </div>
                         )
                      })}
                   </div>
                   <div className="flex items-center gap-2 flex-row-reverse opacity-40">
                      <span>{activeTable.rows.length}</span>
                      <span>سجلات نشطة</span>
                   </div>
                </footer>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
             <div className="size-32 bg-white/5 rounded-[3.5rem] flex items-center justify-center mb-8 border border-white/5 shadow-2xl"><Database className="size-16 text-muted-foreground/10" /></div>
             <h2 className="text-4xl font-black text-white/40 mb-3 tracking-tighter">Nexus Intelligence Grid</h2>
             <p className="text-muted-foreground max-w-sm font-bold text-xs uppercase tracking-widest opacity-60">اختر قاعدة بيانات للبدء في المعالجة</p>
          </div>
        )}
      </main>
    </div>
  );
}
