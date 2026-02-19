
"use client";

import React, { useState } from "react";
import { Plus, Upload, Youtube, HardDrive, FileVideo, Zap, ExternalLink, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function StreamUploadDialog({ onUpload, onOpenVault }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<any>('drive');
  const [data, setData] = useState({ title: "", externalUrl: "", file: null as File | null });

  const handleFinalize = () => {
    onUpload(source, data);
    setIsOpen(false);
    setData({ title: "", externalUrl: "", file: null });
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

          <Tabs value={source} onValueChange={(v: any) => setSource(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 rounded-xl flex-row-reverse">
              <TabsTrigger value="drive" className="rounded-lg gap-2 text-[10px] sm:text-sm"><HardDrive className="size-3" /> Vault</TabsTrigger>
              <TabsTrigger value="youtube" className="rounded-lg gap-2 text-[10px] sm:text-sm"><Youtube className="size-3" /> YouTube</TabsTrigger>
              <TabsTrigger value="local" className="rounded-lg gap-2 text-[10px] sm:text-sm"><FileVideo className="size-3" /> محلي</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-2">
            <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">عنوان البث</Label>
            <Input dir="auto" placeholder="صف موضوع البث..." className="bg-white/5 border-white/10 rounded-xl h-12 text-right" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
          </div>

          {source !== 'local' ? (
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">رابط المصدر</Label>
              <Input placeholder="رابط فيديو من الخزنة أو اليوتيوب..." className="bg-white/5 border-white/10 rounded-xl h-12 text-right" value={data.externalUrl} onChange={(e) => setData({ ...data, externalUrl: e.target.value })} />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">اختر الوسائط</Label>
              <div className="relative h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setData({...data, file: e.target.files?.[0] || null})} accept="video/*" />
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
        </div>

        <DialogFooter>
          <Button onClick={handleFinalize} className="w-full bg-primary h-14 rounded-2xl font-bold" disabled={!data.title || (source === 'local' && !data.file) || (source !== 'local' && !data.externalUrl)}><Zap className="mr-2 size-5" /> بدء المزامنة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
