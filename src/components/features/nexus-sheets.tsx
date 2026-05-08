'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, Plus, Trash2, Edit3, Save, Download, 
  Search, Filter, MoreHorizontal, ArrowUpDown, ChevronDown,
  LayoutGrid, List, FileSpreadsheet, PlusCircle, Database,
  Calendar, Hash, Type, CheckCircle2, History, Settings2
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
      setTables(JSON.parse(saved));
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
      ],
      rows: [
        { id: 'row1', col1: 'مثال 1', col2: 50 },
      ]
    };

    const updated = [...tables, newTable];
    saveToStorage(updated);
    setIsCreateModalOpen(false);
    setNewTableName('');
    setNewTableDesc('');
    setActiveTable(newTable);
    toast({ title: "تم إنشاء الجدول", description: "يمكنك الآن البدء في إضافة البيانات." });
  };

  const deleteTable = (id: string) => {
    const updated = tables.filter(t => t.id !== id);
    saveToStorage(updated);
    if (activeTable?.id === id) setActiveTable(null);
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
    <div className="h-full flex flex-col bg-slate-950/40 animate-in fade-in duration-700">
      {/* Universal Section Header */}
      <header className="px-8 py-8 border-b border-white/5 bg-slate-900/60 backdrop-blur-3xl flex items-center justify-between shrink-0 flex-row-reverse relative overflow-hidden">
        <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-6 flex-row-reverse relative z-10">
          <div className="size-14 bg-gradient-to-br from-primary to-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-primary/20 shrink-0">
            <FileSpreadsheet className="size-7" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-2">Nexus Sheets</h1>
            <div className="flex items-center gap-2 justify-end opacity-60">
               <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">إدارة الجداول الذكية</span>
               <div className="size-1 rounded-full bg-indigo-500" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tables.length} جداول نشطة</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          {!activeTable && (
            <>
              <div className="relative w-72 group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="البحث عن جدول بيانات..." 
                  className="pr-12 bg-white/5 border-white/10 rounded-2xl h-12 text-sm text-right focus:ring-primary/20 focus:border-primary/30 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl h-12 px-8 font-black gap-3 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 text-white">
                    <Plus className="size-5" /> إنشاء جدول
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2.5rem] sm:max-w-[425px] overflow-hidden">
                  <div className="absolute top-0 right-0 size-32 bg-primary/10 blur-3xl" />
                  <DialogHeader className="relative z-10">
                    <DialogTitle className="text-right text-2xl font-black mb-1">جدول بيانات جديد</DialogTitle>
                    <DialogDescription className="text-right text-muted-foreground">قم بتنظيم بياناتك في بيئة Nexus الذكية.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-6 relative z-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-right text-primary uppercase tracking-[0.2em] px-1">اسم الجدول</p>
                      <Input 
                        value={newTableName} 
                        onChange={(e) => setNewTableName(e.target.value)}
                        placeholder="مثال: مبيعات المتجر" 
                        className="bg-white/5 border-white/10 text-right h-14 rounded-2xl focus:ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-right text-primary uppercase tracking-[0.2em] px-1">وصف الجدول</p>
                      <Input 
                        value={newTableDesc} 
                        onChange={(e) => setNewTableDesc(e.target.value)}
                        placeholder="سجل العمليات اليومية..." 
                        className="bg-white/5 border-white/10 text-right h-14 rounded-2xl focus:ring-primary/20" 
                      />
                    </div>
                  </div>
                  <DialogFooter className="relative z-10">
                    <Button onClick={createTable} className="w-full h-14 rounded-2xl font-black bg-primary text-white shadow-lg shadow-primary/20">تأكيد الإنشاء</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {activeTable && (
             <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl border-white/10 h-11 px-5 font-bold gap-2 hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                  <History className="size-4" /> السجل
                </Button>
                <Button variant="outline" className="rounded-xl border-white/10 h-11 px-5 font-bold gap-2 hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                  <Settings2 className="size-4" /> الإعدادات
                </Button>
                <Button onClick={() => setActiveTable(null)} className="rounded-xl h-11 px-5 font-black bg-white/5 hover:bg-white/10 text-white border border-white/10">خروج</Button>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTable ? (
          /* Table Editor View */
          <div className="h-full flex flex-col animate-in slide-in-from-left-4 duration-500">
            <div className="px-8 py-4 bg-slate-900/20 border-b border-white/5 flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                   <Database className="size-5" />
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-black text-white">{activeTable.name}</h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">قيد التعديل الآن</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={addRow} className="rounded-xl h-10 px-6 bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/10">
                  <PlusCircle className="size-4" /> إضافة سجل
                </Button>
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-xl h-10 px-4 border-white/10 text-muted-foreground hover:text-white gap-2">
                      <Plus className="size-4" /> إضافة عمود
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-white/10 text-white w-48 rounded-2xl p-2 shadow-2xl">
                    <DropdownMenuLabel className="text-right text-[10px] uppercase font-black text-primary p-2">نوع البيانات</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => addColumn('نص جديد', 'text')} className="flex-row-reverse text-right gap-3 p-3 rounded-xl hover:bg-white/5"><Type className="size-4 text-blue-400" /> نص</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addColumn('رقم جديد', 'number')} className="flex-row-reverse text-right gap-3 p-3 rounded-xl hover:bg-white/5"><Hash className="size-4 text-emerald-400" /> رقم</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addColumn('تاريخ جديد', 'date')} className="flex-row-reverse text-right gap-3 p-3 rounded-xl hover:bg-white/5"><Calendar className="size-4 text-amber-400" /> تاريخ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8 pb-32">
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        {activeTable.columns.map(col => (
                          <TableHead key={col.id} className="text-right text-indigo-300 font-black text-[10px] uppercase tracking-[0.15em] h-16 border-l border-white/5 px-6">
                            <div className="flex items-center justify-end gap-3">
                              {col.type === 'text' && <Type className="size-3.5 opacity-40" />}
                              {col.type === 'number' && <Hash className="size-3.5 opacity-40" />}
                              {col.type === 'date' && <Calendar className="size-3.5 opacity-40" />}
                              {col.name}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="w-20 h-16 bg-white/5"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTable.rows.map((row) => (
                        <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                          {activeTable.columns.map(col => (
                            <TableCell key={col.id} className="p-0 border-l border-white/5">
                              <input 
                                className="w-full h-14 bg-transparent px-6 text-right text-sm text-white/80 focus:text-white focus:bg-primary/5 focus:outline-none transition-all placeholder:text-white/10 font-medium"
                                value={row[col.id]}
                                type={col.type === 'number' ? 'number' : 'text'}
                                onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="p-0">
                             <div className="flex items-center justify-center h-14">
                               <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-9 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all rounded-xl"
                                onClick={() => {
                                  const updatedRows = activeTable.rows.filter(r => r.id !== row.id);
                                  const updatedTable = { ...activeTable, rows: updatedRows };
                                  setActiveTable(updatedTable);
                                  saveToStorage(tables.map(t => t.id === activeTable.id ? updatedTable : t));
                                }}
                              >
                                 <Trash2 className="size-4" />
                               </Button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {activeTable.rows.length === 0 && (
                    <div className="py-24 text-center">
                      <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plus className="size-10 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-bold">لا توجد بيانات حالياً في هذا الجدول</p>
                      <Button variant="ghost" className="mt-4 text-primary font-black hover:bg-primary/10 rounded-2xl h-12 px-8" onClick={addRow}>إضافة أول سجل</Button>
                    </div>
                  )}
                </div>
                
                {/* Aggregations */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                   {activeTable.columns.filter(c => c.type === 'number').map(col => {
                     const total = activeTable.rows.reduce((sum, r) => sum + (Number(r[col.id]) || 0), 0);
                     return (
                       <Card key={col.id} className="bg-slate-900/60 border-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                         <CardContent className="p-7 flex items-center justify-between flex-row-reverse">
                           <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                             <Database className="size-7" />
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1 opacity-60">إجمالي {col.name}</p>
                             <p className="text-2xl font-black text-white tabular-nums">{total.toLocaleString()}</p>
                           </div>
                         </CardContent>
                       </Card>
                     )
                   })}
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          /* Dashboard View */
          <ScrollArea className="h-full">
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Stats Summary */}
                <Card className="bg-gradient-to-br from-primary/30 to-indigo-600/30 border-primary/20 backdrop-blur-3xl rounded-[3rem] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 cursor-default shadow-2xl shadow-primary/10">
                  <div className="absolute top-0 left-0 size-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)]" />
                  <CardContent className="p-10 flex flex-col items-center text-center relative z-10">
                     <div className="size-20 bg-white/20 rounded-[2rem] flex items-center justify-center mb-6 border border-white/20 group-hover:rotate-12 transition-transform duration-500 shadow-xl">
                        <FileSpreadsheet className="size-10 text-white" />
                     </div>
                     <h3 className="text-5xl font-black text-white mb-2 tabular-nums">{tables.length}</h3>
                     <p className="text-xs font-black text-white/70 uppercase tracking-[0.2em]">قاعدة بيانات نشطة</p>
                  </CardContent>
                </Card>

                {/* Table Cards */}
                {filteredTables.map((table) => (
                  <Card 
                    key={table.id} 
                    className="bg-slate-900/40 border-white/5 backdrop-blur-2xl rounded-[3rem] hover:bg-slate-900/60 transition-all group relative overflow-hidden flex flex-col shadow-xl hover:shadow-primary/5 hover:border-primary/20"
                  >
                    <CardHeader className="p-8 pb-4 text-right relative z-10">
                      <div className="flex items-center justify-between mb-6 flex-row-reverse">
                         <Badge className="bg-white/5 text-muted-foreground border-white/10 rounded-full px-4 py-1 font-bold text-[10px] uppercase tracking-tighter">{table.category}</Badge>
                         <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/5 size-10">
                                  <MoreHorizontal className="size-5" />
                               </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-white/10 text-white w-48 rounded-2xl p-2 shadow-2xl">
                               <DropdownMenuLabel className="text-right text-[10px] font-black text-muted-foreground p-2 uppercase">خيارات الجدول</DropdownMenuLabel>
                               <DropdownMenuSeparator className="bg-white/10" />
                               <DropdownMenuItem onClick={() => setActiveTable(table)} className="flex-row-reverse text-right gap-4 p-3 rounded-xl hover:bg-white/5 font-bold"><Edit3 className="size-4" /> تعديل البيانات</DropdownMenuItem>
                               <DropdownMenuItem className="flex-row-reverse text-right gap-4 p-3 rounded-xl hover:bg-white/5 font-bold"><Download className="size-4" /> تصدير PDF</DropdownMenuItem>
                               <DropdownMenuSeparator className="bg-white/10" />
                               <DropdownMenuItem onClick={() => deleteTable(table.id)} className="flex-row-reverse text-right gap-4 p-3 rounded-xl hover:bg-red-500/10 text-red-400 font-bold"><Trash2 className="size-4" /> حذف نهائي</DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                      <CardTitle className="text-2xl font-black text-white mb-2 leading-tight">{table.name}</CardTitle>
                      <CardDescription className="text-sm font-medium line-clamp-1 opacity-60">{table.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 mt-auto relative z-10">
                      <div className="flex items-center justify-between border-t border-white/5 pt-6 flex-row-reverse">
                         <div className="flex items-center gap-2 flex-row-reverse opacity-50">
                            <Database className="size-3.5" />
                            <span className="text-xs font-black tabular-nums">{table.rows.length}</span>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">سجل</span>
                         </div>
                         <Button 
                          onClick={() => setActiveTable(table)} 
                          className="rounded-2xl font-black text-xs bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all px-6 h-11 shadow-inner"
                         >
                           فتح الجدول
                         </Button>
                      </div>
                    </CardContent>
                    <div className="absolute bottom-0 right-0 size-32 bg-primary/5 blur-3xl rounded-full" />
                  </Card>
                ))}

                {/* Empty State */}
                {tables.length === 0 && !searchQuery && (
                  <div 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="col-span-full border-2 border-dashed border-white/10 rounded-[4rem] h-80 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] hover:border-primary/30 transition-all group"
                  >
                     <div className="size-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl">
                        <Plus className="size-10 text-muted-foreground group-hover:text-primary transition-colors" />
                     </div>
                     <h3 className="text-xl font-black text-white/50 group-hover:text-white transition-colors mb-2">ابدأ رحلتك مع Nexus Sheets</h3>
                     <p className="text-sm text-muted-foreground/60 font-bold">اضغط هنا لإنشاء أول قاعدة بيانات ذكية لك</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
