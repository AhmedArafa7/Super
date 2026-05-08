'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, Plus, Trash2, Edit3, Save, Download, 
  Search, Filter, MoreHorizontal, ArrowUpDown, ChevronDown,
  LayoutGrid, List, FileSpreadsheet, PlusCircle, Database,
  Calendar, Hash, Type, CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
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
        { id: 'row1', col1: 'مثال 1', col2: 100 },
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
      {/* Header */}
      <header className="px-8 py-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between shrink-0 flex-row-reverse">
        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="size-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/10">
            <FileSpreadsheet className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight text-right">Nexus Sheets</h1>
            <p className="text-xs text-muted-foreground text-right uppercase tracking-widest font-bold opacity-70">إدارة الجداول الذكية</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            <Input 
              placeholder="البحث في الجداول..." 
              className="pr-10 bg-white/5 border-white/10 rounded-xl h-10 text-xs text-right"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-10 px-6 font-bold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Plus className="size-4" /> إنشاء جدول جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-right text-xl font-black">إنشاء جدول بيانات جديد</DialogTitle>
                <DialogDescription className="text-right">قم بتعريف جدولك لتنظيم بياناتك بشكل احترافي.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-right text-indigo-400 uppercase tracking-widest">اسم الجدول</p>
                  <Input 
                    value={newTableName} 
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="مثال: مبيعات شهر مايو" 
                    className="bg-white/5 border-white/10 text-right h-12 rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-right text-indigo-400 uppercase tracking-widest">وصف موجز</p>
                  <Input 
                    value={newTableDesc} 
                    onChange={(e) => setNewTableDesc(e.target.value)}
                    placeholder="سجل مبيعات المحل اليومي..." 
                    className="bg-white/5 border-white/10 text-right h-12 rounded-xl" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createTable} className="w-full h-12 rounded-xl font-black bg-primary">بدء الإنشاء</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTable ? (
          /* Table Editor View */
          <div className="flex-1 flex flex-col animate-in slide-in-from-left-4 duration-500">
            <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-4 flex-row-reverse">
                <Button variant="ghost" size="icon" onClick={() => setActiveTable(null)} className="rounded-full hover:bg-white/10 text-white/50">
                   <ChevronDown className="size-5 rotate-90" />
                </Button>
                <div>
                  <h2 className="text-lg font-bold text-white text-right">{activeTable.name}</h2>
                  <p className="text-xs text-muted-foreground text-right">{activeTable.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addRow} className="rounded-xl h-9 px-4 border-white/10 gap-2 font-bold text-xs bg-white/5 hover:bg-white/10 transition-all">
                  <PlusCircle className="size-3.5 text-primary" /> إضافة سجل جديد
                </Button>
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
                      <Plus className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-white/10 text-white w-48 rounded-xl">
                    <DropdownMenuLabel className="text-right">إضافة عمود جديد</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => addColumn('نص جديد', 'text')} className="flex-row-reverse text-right gap-3"><Type className="size-4 text-blue-400" /> نص</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addColumn('رقم جديد', 'number')} className="flex-row-reverse text-right gap-3"><Hash className="size-4 text-emerald-400" /> رقم</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addColumn('تاريخ جديد', 'date')} className="flex-row-reverse text-right gap-3"><Calendar className="size-4 text-amber-400" /> تاريخ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8">
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        {activeTable.columns.map(col => (
                          <TableHead key={col.id} className="text-right text-indigo-300 font-black text-[10px] uppercase tracking-widest h-14 border-l border-white/5">
                            <div className="flex items-center justify-end gap-2">
                              {col.type === 'text' && <Type className="size-3 opacity-50" />}
                              {col.type === 'number' && <Hash className="size-3 opacity-50" />}
                              {col.type === 'date' && <Calendar className="size-3 opacity-50" />}
                              {col.name}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="w-16 h-14 bg-white/5 border-l border-white/5"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTable.rows.map((row) => (
                        <TableRow key={row.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                          {activeTable.columns.map(col => (
                            <TableCell key={col.id} className="p-0 border-l border-white/5">
                              <input 
                                className="w-full h-12 bg-transparent px-4 text-right text-sm text-white/80 focus:text-white focus:bg-white/5 focus:outline-none transition-all placeholder:text-white/10"
                                value={row[col.id]}
                                type={col.type === 'number' ? 'number' : 'text'}
                                onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="p-0 flex items-center justify-center h-12">
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="size-8 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all rounded-lg"
                              onClick={() => {
                                const updatedRows = activeTable.rows.filter(r => r.id !== row.id);
                                const updatedTable = { ...activeTable, rows: updatedRows };
                                setActiveTable(updatedTable);
                                saveToStorage(tables.map(t => t.id === activeTable.id ? updatedTable : t));
                              }}
                            >
                               <Trash2 className="size-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {activeTable.rows.length === 0 && (
                    <div className="py-20 text-center">
                      <p className="text-muted-foreground text-sm">الجدول فارغ. ابدأ بإضافة سجلات جديدة.</p>
                      <Button variant="ghost" className="mt-4 text-primary font-bold hover:bg-primary/10 rounded-xl" onClick={addRow}>إضافة سجل الآن</Button>
                    </div>
                  )}
                </div>
                
                {/* Summary Section */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                   {activeTable.columns.filter(c => c.type === 'number').map(col => {
                     const total = activeTable.rows.reduce((sum, r) => sum + (Number(r[col.id]) || 0), 0);
                     return (
                       <Card key={col.id} className="bg-slate-900/40 border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                         <CardContent className="p-6 flex items-center justify-between flex-row-reverse">
                           <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                             <Database className="size-6" />
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter mb-1">إجمالي {col.name}</p>
                             <p className="text-2xl font-black text-white">{total.toLocaleString()}</p>
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
          <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* Stats Cards */}
              <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-white/10 backdrop-blur-3xl rounded-[2.5rem] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 cursor-default">
                <div className="absolute top-0 left-0 size-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.15),transparent_70%)]" />
                <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
                   <div className="size-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 border border-white/10 group-hover:rotate-12 transition-transform duration-500">
                      <List className="size-8 text-primary" />
                   </div>
                   <h3 className="text-4xl font-black text-white mb-2">{tables.length}</h3>
                   <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest opacity-80">جداول البيانات النشطة</p>
                </CardContent>
              </Card>

              {/* Table List Cards */}
              {filteredTables.map((table) => (
                <Card 
                  key={table.id} 
                  className="bg-slate-900/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] hover:bg-slate-900/60 transition-all group relative overflow-hidden flex flex-col"
                >
                  <CardHeader className="p-6 pb-2 text-right">
                    <div className="flex items-center justify-between mb-4 flex-row-reverse">
                       <Badge className="bg-primary/20 text-primary border-primary/20 rounded-full px-3">{table.category}</Badge>
                       <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                                <MoreHorizontal className="size-4" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-900 border-white/10 text-white w-40 rounded-xl">
                             <DropdownMenuItem onClick={() => setActiveTable(table)} className="flex-row-reverse text-right gap-3"><Edit3 className="size-4" /> تعديل</DropdownMenuItem>
                             <DropdownMenuItem className="flex-row-reverse text-right gap-3"><Download className="size-4" /> تصدير PDF</DropdownMenuItem>
                             <DropdownMenuSeparator className="bg-white/10" />
                             <DropdownMenuItem onClick={() => deleteTable(table.id)} className="flex-row-reverse text-right gap-3 text-red-400 hover:text-red-300"><Trash2 className="size-4" /> حذف الجدول</DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                    <CardTitle className="text-xl font-bold text-white mb-1">{table.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{table.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 mt-auto">
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2 flex-row-reverse">
                       <div className="flex items-center gap-1.5 flex-row-reverse">
                          <Database className="size-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{table.rows.length} سجل</span>
                       </div>
                       <Button 
                        onClick={() => setActiveTable(table)} 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-xl font-bold text-[10px] bg-white/5 hover:bg-primary hover:text-white transition-all px-4"
                       >
                         عرض الجدول
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Placeholder */}
              {tables.length === 0 && !searchQuery && (
                <div 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="col-span-full border-2 border-dashed border-white/5 rounded-[3rem] h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-primary/20 transition-all group"
                >
                   <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                   </div>
                   <p className="text-muted-foreground font-bold group-hover:text-white transition-colors">اضغط هنا لإنشاء أول جدول بيانات لك</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
