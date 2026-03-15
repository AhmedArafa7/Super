'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Book as BookIcon, Filter, 
  ArrowRight, Download, Eye, Clock, Upload,
  ShieldCheck, Trash2, X, Check, Loader2
} from 'lucide-react';
import { useLibraryStore, Book } from '@/lib/library-store';
import { useAuth } from '@/components/auth/auth-provider';
import { UploadBookDialog } from './upload-book-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Separate component for the Book Card to keep things clean
function BookCard({ book, isAdmin, onApprove, onReject, onDelete }: { 
  book: Book, 
  isAdmin?: boolean,
  onApprove?: (id: string) => void,
  onReject?: (id: string) => void,
  onDelete?: (id: string) => void
}) {
  const { incrementDownload } = useLibraryStore();

  const handleDownload = () => {
    incrementDownload(book.id);
    window.open(book.fileUrl, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 shadow-xl flex flex-col h-full"
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={book.coverUrl} 
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
           <Button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl gap-2">
             <Download className="size-4" />
             تحميل
           </Button>
        </div>
        <div className="absolute top-2 right-2">
           <Badge className="bg-black/60 backdrop-blur-md text-white border-white/10">{book.category}</Badge>
        </div>
        {book.status === 'pending' && (
           <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500/80 text-white border-none animate-pulse">قيد المراجعة</Badge>
           </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4 flex flex-col flex-1 text-right">
        <h3 className="font-bold text-lg text-white line-clamp-1 mb-1">{book.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
        
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/5 pt-3">
           <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
             <Download className="size-3" />
             <span>{book.downloadCount}</span>
           </div>
           <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
             <span>{book.fileSize}</span>
             <Clock className="size-3" />
           </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && book.status === 'pending' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onApprove?.(book.id)}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10 rounded-lg"
            >
              <Check className="size-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onReject?.(book.id)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        
        {isAdmin && book.status === 'approved' && (
           <Button 
             size="sm" 
             variant="ghost" 
             onClick={() => onDelete?.(book.id)}
             className="mt-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg w-full"
           >
             <Trash2 className="size-4 ml-2" />
             حذف الكتاب
           </Button>
        ) }
      </div>
    </motion.div>
  );
}

export function LibraryView() {
  const { books, isLoading, categories, fetchBooks, approveBook, rejectBook, deleteBook } = useLibraryStore();
  const { user } = useAuth();
  const managementRoles = ['founder', 'cofounder', 'admin', 'management'];
  const isAdmin = !!(user && managementRoles.includes(user.role));
  
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    fetchBooks('approved', activeCategory);
  }, [activeCategory]);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-10">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 text-right">
          <div className="order-2 md:order-1">
             <div className="flex items-center gap-4 mb-4 justify-end">
                <div className="relative">
                  <Input 
                    placeholder="ابحث عن كتاب..." 
                    className="w-full md:w-80 bg-white/5 border-white/10 rounded-2xl pr-10 text-right h-12"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                </div>
                {isAdmin && (
                   <Button 
                     variant="outline" 
                     onClick={() => fetchBooks('pending')}
                     className="rounded-2xl h-12 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-2"
                   >
                     <ShieldCheck className="size-5" />
                     طلبات المراجعة
                   </Button>
                )}
             </div>
          </div>
          <div className="order-1 md:order-2">
            <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-l from-white to-indigo-400 bg-clip-text text-transparent">المكتبة العامة</h1>
            <p className="text-muted-foreground text-lg">اكتشف آلاف الكتب، واقرأ ما يغذي عقلك وروحك.</p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2 justify-end mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {["الكل", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
                activeCategory === cat 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <Loader2 className="size-12 text-indigo-500 animate-spin" />
             <p className="text-muted-foreground">جاري تحميل الكتب...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  isAdmin={isAdmin}
                  onApprove={approveBook}
                  onReject={rejectBook}
                  onDelete={deleteBook}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-[3rem]">
             <div className="size-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
                <BookIcon className="size-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-bold mb-2">لا توجد كتب حالياً</h3>
             <p className="text-muted-foreground mb-8">كن أول من يثري المكتبة ويرفع كتاباً نافعاً!</p>
             <Button onClick={() => setIsUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-12 px-8 gap-2">
                <Upload className="size-5" />
                إضافة كتاب جديد
             </Button>
          </div>
        )}
      </div>

      {/* Floating Upload Button */}
      <Button 
        onClick={() => setIsUploadOpen(true)}
        className="fixed bottom-10 right-10 size-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/40 z-50 flex items-center justify-center group"
      >
        <Plus className="size-8 transition-transform duration-300 group-hover:rotate-90" />
      </Button>

      {/* Upload Dialog */}
      {isUploadOpen && (
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
           <UploadBookDialog onClose={() => setIsUploadOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
