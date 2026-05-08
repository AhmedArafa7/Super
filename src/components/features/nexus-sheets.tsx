'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, Plus, Trash2, Edit3, Save, Download, 
  Search, Filter, MoreHorizontal, ArrowUpDown, ChevronDown,
  LayoutGrid, List, FileSpreadsheet, PlusCircle, Database,
  Calendar, Hash, Type, CheckCircle2, History, Settings2,
  Users, Package, TrendingUp, Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/**
 * [TYPES]
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

export function NexusSheets() {
  const [tables, setTables] = useState<DataTable[]>([]);
  const [activeTable, setActiveTable] = useState<DataTable | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDesc, setNewTableDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('nexus-sheets-data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTables(parsed);
      if (parsed.length > 0 && !activeTable) {
        setActiveTable(parsed[0]);
      }
    }
  }, []);

  // Save Data
  const saveToStorage = (updatedTables: DataTable[]) => {
    setTables(updatedTables);
    localStorage.setItem('nexus-sheets-data', JSON.stringify(updatedTables));
  };

  const createTable = () => {
    if (!newTableName.trim()) return;
    
    const newTable: DataTable = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTableName,
      description: newTableDesc || 'جدول بيانات مخصص',
      category: 'عام',
      lastModified: new Date().toISOString(),
      columns: [
        { id: 'col1', name: 'الاسم', type: 'text' },
        { id: 'col2', name: 'القيمة', type: 'number' },
        { id: 'col3', name: 'التاريخ', type: 'date' },
      ],
      rows: [
        { id: 'row1', col1: 'مثال 1', col2: 50, col3: new Date().toISOString().split('T')[0] },
      ]
    };

    const updated = [...tables, newTable];
    saveToStorage(updated);
    setIsCreateModalOpen(false);
    setNewTableName('');
    setNewTableDesc('');
    setActiveTable(newTable);
    toast({ title: "تم إنشاء الجدول بنجاح" });
  };

  const deleteTable = (id: string) => {
    const updated = tables.filter(t => t.id !== id);
    saveToStorage(updated);
    if (activeTable?.id === id) setActiveTable(updated[0] || null);
    toast({ title: "تم حذف الجدول", variant: "destructive" });
  };

  const addRow = () => {
    if (!activeTable) return;
    const newRow: Row = { id: Math.random().toString(36).substr(2, 9) };
    activeTable.columns.forEach(col => {
      newRow[col.id] = col.type === 'number' ? 0 : '';
    });

    const updatedTable = { 
      ...activeTable, 
      rows: [...activeTable.rows, newRow],
      lastModified: new Date().toISOString()
    };
    
    setActiveTable(updatedTable);
    const updatedTables = tables.map(t => t.id === activeTable.id ? updatedTable : t);
    saveToStorage(updatedTables);
  };

  const updateCell = (rowId: string, colId: string, value: any) => {
    if (!activeTable) return;
    const updatedRows = activeTable.rows.map(row => 
      row.id === rowId ? { ...row, [colId]: value } : row
    );
    const updatedTable = { ...activeTable, rows: updatedRows };
    setActiveTable(updatedTable);
    const updatedTables = tables.map(t => t.id === activeTable.id ? updatedTable : t);
    saveToStorage(updatedTables);
  };

  const addColumn = (name: string, type: Column['type']) => {
    if (!activeTable) return;
    const newCol: Column = { 
      id: 'col' + (activeTable.columns.length + 1), 
      name, 
      type 
    };
    const updatedTable = { 
      ...activeTable, 
      columns: [...activeTable.columns, newCol],
      lastModified: new Date().toISOString()
    };
    setActiveTable(updatedTable);
    const updatedTables = tables.map(t => t.id === activeTable.id ? updatedTable : t);
    saveToStorage(updatedTables);
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex bg-slate-950/40 text-white overflow-hidden animate-in fade-in duration-500">
      
      {/* 1. RIGHT SIDEBAR: Table Navigation */}
      <aside className="w-72 border-l border-white/5 bg-slate-900/60 backdrop-blur-3xl flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
           <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95">
                  <Plus className="size-5" /> جدول جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem] sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-right text-xl font-black">إنشاء جدول جديد</DialogTitle>
                  <DialogDescription className="text-right">أضف اسماً لوصف بياناتك الجديدة.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-right text-primary uppercase tracking-widest px-1">اسم الجدول</p>
                    <Input 
                      value={newTableName} 
                      onChange={(e) => setNewTableName(e.target.value)}
                      placeholder="مثال: قاعدة المبيعات" 
                      className="bg-white/5 border-white/10 text-right h-12 rounded-xl focus:ring-primary/20" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createTable} className="w-full h-12 rounded-xl font-black bg-primary text-white">تأكيد</Button>
                </DialogFooter>
              </DialogContent>
           </Dialog>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
           <div className="space-y-1">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setActiveTable(table)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all flex-row-reverse group",
                    activeTable?.id === table.id 
                      ? "bg-primary/20 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 flex-row-reverse overflow-hidden">
                     <FileSpreadsheet className={cn("size-4 shrink-0", activeTable?.id === table.id ? "text-primary" : "text-muted-foreground")} />
                     <span className="text-xs font-bold truncate text-right">{table.name}</span>
                  </div>
                  {activeTable?.id === table.id && <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />}
                </button>
              ))}
              
              {tables.length === 0 && (
                <div className="px-4 py-10 text-center opacity-30">
                   <Database className="size-10 mx-auto mb-3" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">لا توجد جداول</p>
                </div>
              )}
           </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5">
           <Button variant="ghost" className="w-full justify-end gap-3 text-muted-foreground hover:text-white rounded-xl h-11 px-4 flex-row-reverse">
              <Settings className="size-4" />
              <span className="text-xs font-bold">الإعدادات العامة</span>
           </Button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Navigation / Search */}
        <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 flex-row-reverse">
           <div className="flex items-center gap-4 flex-row-reverse">
              <h1 className="text-sm font-black text-white tracking-tight">Nexus Sheets</h1>
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                 <FileSpreadsheet className="size-4" />
              </div>
           </div>
           
           <div className="relative w-[500px] group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="ابحث عن سجل أو قيمة..." 
                className="w-full h-10 pr-12 bg-slate-950/50 border-white/5 rounded-xl text-xs text-right focus:ring-primary/20 focus:border-primary/20 transition-all"
              />
           </div>

           <div className="flex items-center gap-3">
              <div className="bg-slate-950/50 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-3 flex-row-reverse">
                 <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold tabular-nums">150.00</span>
                 <WalletViewIcon className="size-3 text-primary" />
              </div>
              <Button variant="ghost" size="icon" className="size-10 rounded-xl relative">
                 <BellIcon className="size-5 text-muted-foreground" />
                 <div className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-slate-950" />
              </Button>
           </div>
        </header>

        {activeTable ? (
          /* TABLE VIEW */
          <div className="flex-1 flex flex-col overflow-hidden p-8 animate-in slide-in-from-left-2 duration-500">
             
             {/* Sub-Header */}
             <div className="flex items-center justify-between mb-6 flex-row-reverse">
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-3 flex-row-reverse">
                      <h2 className="text-2xl font-black text-white">{activeTable.name}</h2>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg text-[10px] px-2 h-5">نشط</Badge>
                   </div>
                   <p className="text-[10px] text-muted-foreground mt-1 font-medium">آخر تعديل: منذ دقيقتين</p>
                </div>
                
                <div className="flex items-center gap-2">
                   <Button variant="outline" className="h-9 px-4 rounded-xl border-white/5 bg-slate-900/40 text-[10px] font-bold gap-2 hover:bg-white/5 flex-row-reverse">
                      <History className="size-3.5" /> السجل
                   </Button>
                   <Button variant="outline" onClick={() => addColumn('جديد', 'text')} className="h-9 px-4 rounded-xl border-white/5 bg-slate-900/40 text-[10px] font-bold gap-2 hover:bg-white/5 flex-row-reverse">
                      <LayoutGrid className="size-3.5" /> عمود جديد
                   </Button>
                   <Button onClick={addRow} className="h-9 px-6 rounded-xl bg-primary text-white text-[10px] font-black gap-2 shadow-lg shadow-primary/10 flex-row-reverse">
                      <Plus className="size-4" /> إضافة سجل
                   </Button>
                </div>
             </div>

             {/* Table Container */}
             <div className="flex-1 overflow-hidden flex flex-col rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md shadow-2xl relative">
                <ScrollArea className="flex-1">
                   <Table>
                      <TableHeader className="bg-slate-900/40 border-b border-white/5 sticky top-0 z-20">
                         <TableRow className="border-white/5 hover:bg-transparent h-14">
                            <TableHead className="w-12 text-center border-l border-white/5">
                               <Settings2 className="size-4 mx-auto opacity-40" />
                            </TableHead>
                            {activeTable.columns.slice().reverse().map(col => (
                              <TableHead key={col.id} className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest border-l border-white/5 px-6">
                                <div className="flex items-center justify-end gap-3">
                                   <ArrowUpDown className="size-3 opacity-30" />
                                   {col.name}
                                   {col.type === 'text' && <Type className="size-3 opacity-50" />}
                                   {col.type === 'number' && <Hash className="size-3 opacity-50" />}
                                   {col.type === 'date' && <Calendar className="size-3 opacity-50" />}
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="w-12 border-l border-white/5">
                               <Settings2 className="size-4 mx-auto opacity-40" />
                            </TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {activeTable.rows.map((row) => (
                           <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group h-14">
                              <TableCell className="p-0 border-l border-white/5 text-center">
                                 <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 rounded-lg">
                                    <MoreHorizontal className="size-4 opacity-40" />
                                 </Button>
                              </TableCell>
                              {activeTable.columns.slice().reverse().map(col => (
                                <TableCell key={col.id} className="p-0 border-l border-white/5">
                                   <input 
                                     className="w-full h-14 bg-transparent px-6 text-right text-xs text-white/70 focus:text-white focus:bg-primary/5 focus:outline-none transition-all tabular-nums"
                                     value={row[col.id]}
                                     onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                   />
                                </TableCell>
                              ))}
                              <TableCell className="p-0 border-l border-white/5 text-center">
                                 <DropdownMenu dir="rtl">
                                    <DropdownMenuTrigger asChild>
                                       <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 rounded-lg">
                                          <MoreHorizontal className="size-4 opacity-40" />
                                       </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                                       <DropdownMenuItem onClick={() => {
                                          const updatedRows = activeTable.rows.filter(r => r.id !== row.id);
                                          const updatedTable = { ...activeTable, rows: updatedRows };
                                          setActiveTable(updatedTable);
                                          saveToStorage(tables.map(t => t.id === activeTable.id ? updatedTable : t));
                                       }} className="text-red-400 gap-2 flex-row-reverse text-right">
                                          <Trash2 className="size-4" /> حذف السجل
                                       </DropdownMenuItem>
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                              </TableCell>
                           </TableRow>
                         ))}
                         
                         {/* Placeholder Row */}
                         <TableRow className="border-none opacity-20 h-14">
                            <TableCell></TableCell>
                            {activeTable.columns.map(c => <TableCell key={c.id} className="text-right px-6 text-[10px] font-bold uppercase tracking-tighter">
                               {c.type === 'date' ? 'dd/mm/yyyy' : c.type === 'number' ? '0.00' : 'أضف اسم...'}
                            </TableCell>)}
                            <TableCell></TableCell>
                         </TableRow>
                      </TableBody>
                   </Table>
                </ScrollArea>
                
                {/* Aggregation Footer */}
                <div className="h-10 bg-slate-950/60 border-t border-white/5 flex items-center justify-between px-8 text-[10px] font-bold text-muted-foreground shrink-0 flex-row-reverse">
                   <div className="flex items-center gap-6 flex-row-reverse">
                      {activeTable.columns.filter(c => c.type === 'number').map(col => {
                         const total = activeTable.rows.reduce((sum, r) => sum + (Number(r[col.id]) || 0), 0);
                         return (
                            <div key={col.id} className="flex items-center gap-2 flex-row-reverse">
                               <span className="text-white tabular-nums font-black">{total.toFixed(2)}</span>
                               <span>المجموع:</span>
                            </div>
                         )
                      })}
                   </div>
                   <div className="flex items-center gap-2 flex-row-reverse">
                      <span className="text-white">{activeTable.rows.length}</span>
                      <span>سجلات</span>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
             <div className="size-32 bg-white/5 rounded-[3rem] flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                <Database className="size-16 text-muted-foreground/20" />
             </div>
             <h2 className="text-3xl font-black text-white/50 mb-3">Nexus Sheets Hub</h2>
             <p className="text-muted-foreground max-w-sm">اختر جدولاً من القائمة الجانبية للبدء، أو أنشئ جدولاً جديداً لإدارة بياناتك بذكاء.</p>
          </div>
        )}

      </main>
    </div>
  );
}

// Minimal Icons for Header
function WalletViewIcon({ className }: { className?: string }) {
   return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <rect x="2" y="5" width="20" height="14" rx="2" />
         <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
   )
}

function BellIcon({ className }: { className?: string }) {
   return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
         <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
   )
}
