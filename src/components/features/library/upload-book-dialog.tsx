'use client';

import React, { useState } from 'react';
import { 
  DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useLibraryStore } from '@/lib/library-store';
import { useAuth } from '@/components/auth/auth-provider';
import { initializeFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Upload, X, Loader2, BookOpen, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadBookDialogProps {
  onClose: () => void;
}

export function UploadBookDialog({ onClose }: UploadBookDialogProps) {
  const { categories, uploadBook } = useLibraryStore();
  const { user } = useAuth();
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
  });

  const [files, setFiles] = useState<{
    book: File | null;
    cover: File | null;
  }>({
    book: null,
    cover: null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'book' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { storage } = initializeFirebase();
    const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (path === 'books') setProgress(p); // Only track book progress for UI
        },
        (error) => reject(error),
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.book || !files.cover || !formData.category || !user) {
      toast({ title: "بيانات ناقصة", description: "يرجى ملء جميع الحقول ورفع الملفات المطلوبة.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload Cover
      const coverUrl = await uploadFile(files.cover, 'covers');
      // 2. Upload Book
      const fileUrl = await uploadFile(files.book, 'books');

      // 3. Save to Firestore
      await uploadBook({
        title: formData.title,
        author: formData.author,
        description: formData.description,
        category: formData.category,
        coverUrl,
        fileUrl,
        uploaderId: user.id,
        uploaderName: user.name || 'مستخدم مجهول',
        fileSize: `${(files.book.size / (1024 * 1024)).toFixed(1)} MB`
      });

      toast({ 
        title: "تم الرفع بنجاح", 
        description: "تم إرسال الكتاب للمراجعة. سيظهر في المكتبة فور موافقة الإدارة." 
      });
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "فشل الرفع", description: "حدث خطأ أثناء رفع الكتاب، يرجى المحاولة لاحقاً.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <DialogContent className="bg-[#121216] border-white/10 text-white max-w-2xl rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
        <div className="p-8 pb-4">
          <DialogHeader className="flex flex-row items-center justify-between mb-6">
            <DialogTitle className="text-2xl font-black bg-gradient-to-l from-white to-indigo-400 bg-clip-text text-transparent">إضافة كتاب جديد</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar max-h-[60vh] text-right">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mr-2">اسم المؤلف</label>
                <Input 
                  required
                  placeholder="محمد الغزالي..."
                  className="bg-white/5 border-white/10 rounded-2xl h-12 text-right"
                  value={formData.author}
                  onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mr-2">عنوان الكتاب</label>
                <Input 
                  required
                  placeholder="جدد حياتك..."
                  className="bg-white/5 border-white/10 rounded-2xl h-12 text-right font-bold"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground mr-2">تصنيف الكتاب</label>
              <Select onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12 flex-row-reverse">
                  <SelectValue placeholder="اختر التصنيف الرئيسي" />
                </SelectTrigger>
                <SelectContent className="bg-[#121216] border-white/10 text-white text-right">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="flex-row-reverse">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground mr-2">وصف قصير</label>
              <Textarea 
                required
                placeholder="نبذة عن محتوى الكتاب..."
                className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] text-right"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cover Upload */}
              <div className="relative group">
                <label className="block p-6 border-2 border-dashed border-white/10 rounded-[2rem] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'cover')} />
                  <div className="flex flex-col items-center gap-3">
                    {files.cover ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <ImageIcon className="size-6" />
                        <span className="text-sm font-medium truncate max-w-[150px]">{files.cover.name}</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="size-8 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                        <span className="text-sm text-muted-foreground">صورة الغلاف (PNG/JPG)</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* PDF Upload */}
              <div className="relative group">
                <label className="block p-6 border-2 border-dashed border-white/10 rounded-[2rem] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                  <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileChange(e, 'book')} />
                  <div className="flex flex-col items-center gap-3">
                    {files.book ? (
                      <div className="flex items-center gap-2 text-indigo-400">
                        <FileText className="size-6" />
                        <span className="text-sm font-medium truncate max-w-[150px]">{files.book.name}</span>
                      </div>
                    ) : (
                      <>
                        <BookOpen className="size-8 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                        <span className="text-sm text-muted-foreground">ملف الكتاب (PDF)</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-4 flex items-center justify-between gap-4 border-t border-white/5 bg-white/[0.02]">
           <Button 
             type="button" 
             variant="ghost" 
             onClick={onClose} 
             disabled={isUploading}
             className="rounded-2xl h-14 px-8 hover:bg-white/5"
           >
             إلغاء
           </Button>
           <Button 
             type="submit" 
             disabled={isUploading}
             className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 text-lg font-bold shadow-xl shadow-indigo-600/20 gap-3"
           >
             {isUploading ? (
               <>
                 <Loader2 className="size-5 animate-spin" />
                 جاري الرفع... {Math.round(progress)}%
               </>
             ) : (
               <>
                 <Upload className="size-6" />
                 إرسال للمراجعة
               </>
             )}
           </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
