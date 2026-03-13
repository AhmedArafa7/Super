
"use client";

import React, { useState } from "react";
import { Plus, Upload, Youtube, HardDrive, FileVideo, Zap, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useUploadStore } from "@/lib/upload-store";
import { Progress } from "@/components/ui/progress";

import { VideoProductSelector } from "../wetube/video-product-selector";

/**
 * [STABILITY_ANCHOR: STREAM_UPLOAD_V1.5]
 * واجهة رفع البث - تفعيل جلب عناوين الفيديوهات حقيقياً من يوتيوب.
 */
export function StreamUploadDialog({ onUpload, onOpenVault, user }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<any>('drive');
  const [data, setData] = useState({ 
    title: "", 
    externalUrl: "", 
    file: null as File | null,
    productIds: [] as string[],
    productDisplayMode: 'none' as 'none' | 'specific' | 'all'
  });
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const tasks = useUploadStore(state => state.tasks);
  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Auto-close when the task finishes
  React.useEffect(() => {
    if (activeTaskId && !activeTask) {
      // Task disappeared, likely finished or failed.
      setIsOpen(false);
      setActiveTaskId(null);
      setData({ title: "", externalUrl: "", file: null, productIds: [], productDisplayMode: 'none' });
    } else if (activeTask && activeTask.status === 'completed') {
      setTimeout(() => {
        setIsOpen(false);
        setActiveTaskId(null);
        setData({ title: "", externalUrl: "", file: null, productIds: [], productDisplayMode: 'none' });
      }, 1000);
    }
  }, [activeTask, activeTaskId]);

  const fetchVideoTitle = async (url: string) => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
    setIsFetchingMetadata(true);
    try {
      // استخدام oembed العام لجلب عنوان الفيديو بدقة
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);
      if (response.ok) {
        const json = await response.json();
        if (json.title) {
          setData(prev => ({ ...prev, title: json.title }));
        }
      } else {
        // محاولة بديلة عبر البروكسي إذا فشل oembed
        const proxiedResponse = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
        const html = await proxiedResponse.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent;
        if (title) {
          setData(prev => ({ ...prev, title: title.replace(' - YouTube', '').trim() }));
        }
      }
    } catch (e) {
      console.error("Video Metadata Fetch Error", e);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setData(prev => ({ ...prev, externalUrl: url }));
    if (url.length > 15 && source === 'youtube') {
      fetchVideoTitle(url);
    }
  };

  const handleFinalize = () => {
    if (typeof onUpload !== 'function') {
      console.warn('onUpload is not a function or not provided');
      setIsOpen(false);
      setData({ title: "", externalUrl: "", file: null, productIds: [], productDisplayMode: 'none' });
      return;
    }

    if (source === 'local' && data.file) {
      const taskId = onUpload(source, data);
      if (taskId) {
        setActiveTaskId(taskId);
      } else {
        setIsOpen(false);
        setData({ title: "", externalUrl: "", file: null, productIds: [], productDisplayMode: 'none' });
      }
    } else {
      onUpload(source, data);
      setIsOpen(false);
      setData({ title: "", externalUrl: "", file: null, productIds: [], productDisplayMode: 'none' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90 rounded-2xl px-8 h-14 shadow-xl shadow-primary/20 font-bold text-base">
          <Plus className="mr-2 size-6" /> بث جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-slate-950 border-white/10 rounded-[2.5rem] p-8">
        <DialogHeader>
          <DialogTitle className="text-3xl font-headline font-bold text-white text-right">إرسال عصبي جديد</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm text-right">استخدم Nexus Vault للمساحات الكبيرة، أو يوتيوب للبث العام.</DialogDescription>
        </DialogHeader>

        {activeTask ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="size-16 rounded-full border-4 border-t-primary border-white/10 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-white text-center">جارِ التشفير والرفع...</h3>
            <p className="text-muted-foreground text-sm text-center">يتم الآن رفع الفيديو إلى الخوادم السحابية المؤمّنة الخاصة بتيليجرام. يرجى عدم إغلاق هذه النافذة.</p>
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-300 px-1">
                <span>{Math.round(activeTask.progress)}%</span>
                <span>{activeTask.fileName}</span>
              </div>
              <Progress value={activeTask.progress} className="h-2 w-full bg-white/10" />
            </div>
            {activeTask.status === 'failed' && (
              <p className="text-red-500 font-bold text-sm mt-4">فشل الرفع. الرجاء المحاولة مرة أخرى.</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 py-6">
              {source === 'drive' && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-300">خزنة نكسوس المركزية</p>
                    <p className="text-[10px] text-muted-foreground">ارفع ملفك هنا أولاً ثم انسخ الرابط</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 text-indigo-400 font-bold" onClick={onOpenVault}><ExternalLink className="size-3" /> فتح الخزنة</Button>
                </div>
              )}

              <Tabs value={source} onValueChange={(v: any) => { setSource(v); setData(prev => ({ ...prev, title: "" })); }} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 rounded-xl flex-row-reverse">
                  <TabsTrigger value="drive" className="rounded-lg gap-2 text-[10px] sm:text-sm"><HardDrive className="size-3" /> Vault</TabsTrigger>
                  <TabsTrigger value="youtube" className="rounded-lg gap-2 text-[10px] sm:text-sm"><Youtube className="size-3" /> YouTube</TabsTrigger>
                  <TabsTrigger value="local" className="rounded-lg gap-2 text-[10px] sm:text-sm"><FileVideo className="size-3" /> محلي</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-2">
                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">عنوان البث</Label>
                <div className="relative">
                  <Input dir="auto" placeholder="صف موضوع البث..." className="bg-white/5 border-white/10 rounded-xl h-12 text-right pr-4" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
                  {isFetchingMetadata && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />}
                </div>
              </div>

              {source !== 'local' ? (
                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">رابط المصدر</Label>
                  <Input placeholder="رابط فيديو من الخزنة أو اليوتيوب..." className="bg-white/5 border-white/10 rounded-xl h-12 text-right" value={data.externalUrl} onChange={(e) => handleUrlChange(e.target.value)} />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">اختر الوسائط</Label>
                  <div className="relative h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setData({ ...data, file, title: file ? file.name.split('.')[0] : "" });
                    }} accept="video/*" />
                    {data.file ? (
                      <div className="text-center">
                        <CheckCircle2 className="size-8 text-green-400 mx-auto mb-2" />
                        <p className="text-xs text-white font-bold">{data.file.name}</p>
                      </div>
                    ) : (
                      <><Upload className="size-8 text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground font-bold">اضغط لمزامنة ملف محلي</p></>
                    )}
                  </div>
                </div>
              )}

              {/* رف المنتجات (Merchandise) - يظهر فقط في حالة الرفع المباشر أو من الخزنة */}
              {user && (source === 'local' || source === 'drive') && (
                <VideoProductSelector 
                  userId={user.id} 
                  selectedProductIds={data.productIds}
                  displayMode={data.productDisplayMode}
                  onChange={(productData) => setData(prev => ({ ...prev, ...productData }))}
                />
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleFinalize} className="w-full bg-primary h-14 rounded-2xl font-bold" disabled={!data.title || (source === 'local' && !data.file) || (source !== 'local' && !data.externalUrl) || isFetchingMetadata}><Zap className="mr-2 size-5" /> بدء المزامنة</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
