"use client";

import React, { useState } from "react";
import { 
  X, 
  Upload, 
  Video, 
  FileVideo, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("unlisted");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Auto-fill title from filename
      if (!title) {
        setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id) return;

    try {
      setIsUploading(true);
      setError(null);
      setProgress(10);

      // 1. Initiate Upload (Get resumable URL from our API)
      const initRes = await fetch("/api/auth/youtube/upload/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title,
          description,
          privacyStatus: privacy
        })
      });

      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "Failed to initiate upload");

      const uploadUrl = initData.uploadUrl;
      setProgress(30);

      // 2. Perform the actual upload to Google's server
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 70) + 30;
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setIsSuccess(true);
          setIsUploading(false);
          setTimeout(() => {
            onSuccess();
            onClose();
            resetForm();
          }, 2000);
        } else {
          setError("خطأ أثناء رفع الفيديو لسيرفرات جوجل");
          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        setError("فشل الاتصال بالإنترنت أثناء الرفع");
        setIsUploading(false);
      };

      xhr.send(file);

    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setPrivacy("unlisted");
    setIsSuccess(false);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Upload className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">رفع فيديو جديد</h2>
              <p className="text-xs text-slate-400 font-medium">سيتم الرفع مباشرة لقناتك المربوطة</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
            <X className="size-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="size-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="size-10" />
              </div>
              <h3 className="text-2xl font-black text-white">تم الرفع بنجاح!</h3>
              <p className="text-slate-400">جاري معالجة الفيديو على يوتيوب، سيظهر في الاستوديو قريباً.</p>
            </div>
          ) : isUploading ? (
            <div className="space-y-8 py-10">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="size-12 text-indigo-500 animate-spin" />
                <p className="font-bold text-lg">جاري رفع "{file?.name}"...</p>
                <span className="text-3xl font-black text-indigo-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <p className="text-center text-xs text-slate-500 italic">يرجى عدم إغلاق النافذة حتى اكتمال الرفع</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="size-5 shrink-0" />
                  <p className="font-bold">{error}</p>
                </div>
              )}

              {/* File Dropzone */}
              {!file ? (
                <div 
                  onClick={() => document.getElementById('video-upload')?.click()}
                  className="border-2 border-dashed border-white/10 rounded-[2rem] py-16 flex flex-col items-center justify-center gap-4 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <input type="file" id="video-upload" accept="video/*" className="hidden" onChange={handleFileChange} />
                  <div className="size-16 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-indigo-400 transition-all">
                    <FileVideo className="size-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white">اضغط هنا أو اسحب ملف الفيديو</p>
                    <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI (أقصى حجم مسموح به لقناتك)</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                      <Video className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">تغيير</Button>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">عنوان الفيديو</Label>
                  <Input 
                    placeholder="أدخل عنواناً جذاباً لفيديوهاتك..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-indigo-500 transition-all text-right"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">الوصف</Label>
                  <Textarea 
                    placeholder="ماذا يدور في هذا الفيديو؟"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] focus:border-indigo-500 transition-all text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">الخصوصية</Label>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl flex-row-reverse">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="public">علني (Public)</SelectItem>
                      <SelectItem value="unlisted">غير مدرج (Unlisted)</SelectItem>
                      <SelectItem value="private">خاص (Private)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isUploading && !isSuccess && (
          <div className="p-6 border-t border-white/5 bg-slate-900/50 flex gap-3">
             <Button 
               className="flex-1 h-12 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
               disabled={!file || !title}
               onClick={handleUpload}
             >
                بدء الرفع الآن
             </Button>
             <Button variant="ghost" onClick={onClose} className="h-12 px-8 rounded-2xl font-bold hover:bg-white/5">إلغاء</Button>
          </div>
        )}
      </div>
    </div>
  );
}
