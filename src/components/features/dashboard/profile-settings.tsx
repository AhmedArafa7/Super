"use client";

import React, { useState, useRef } from "react";
import { User, Loader2, CheckCircle2, Camera, ImageIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { updateUserProfile, uploadAvatar } from "@/lib/auth-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: PROFILE_SETTINGS_V3.5]
 * واجهة إعدادات الهوية المحدثة - تدعم الضغط التلقائي للصور والمزامنة العصبية.
 */
export function ProfileSettings({ user }: any) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async () => {
    if (!user?.id || !displayName.trim()) return;
    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { name: displayName });
      toast({ title: "تم تحديث الملف", description: "تمت مزامنة هويتك العصبية مع السجل العالمي." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التحديث", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // التحقق من النوع
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "نوع غير مدعوم", description: "يرجى اختيار صورة صالحة (JPG, PNG, WEBP)." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // سيتم الضغط تلقائياً داخل uploadAvatar
      const url = await uploadAvatar(file, (pct) => setUploadProgress(pct));
      await updateUserProfile(user.id, { avatar_url: url });
      toast({ title: "تمت المزامنة البصرية", description: "تم ضغط الصورة ورفعها بنجاح." });
    } catch (err: any) {
      console.error("Upload Error:", err);
      toast({ 
        variant: "destructive", 
        title: "فشل الرفع السحابي", 
        description: err.message?.includes('permission') 
          ? "تم رفض العملية من قبل بروتوكول الأمان (الحجم أو النوع غير مسموح)." 
          : "حدث اضطراب في الاتصال بحاوية التخزين." 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 font-sans">
      <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 size-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
        
        <div className="relative group mb-6">
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={cn(
              "size-32 rounded-[2.5rem] bg-indigo-500/10 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 cursor-pointer relative shadow-inner",
              isUploading && "cursor-wait"
            )}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} className="size-full object-cover group-hover:opacity-40 transition-opacity" alt="avatar" />
            ) : (
              <User className="size-12 text-muted-foreground group-hover:opacity-40 transition-opacity" />
            )}
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <Camera className="size-8 text-white" />
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 gap-2">
                <Loader2 className="size-8 text-primary animate-spin" />
                <span className="text-[10px] font-black text-white">{Math.round(uploadProgress)}%</span>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*" 
          />
        </div>

        {isUploading && (
          <div className="w-full space-y-2 mb-4 animate-in fade-in">
            <Progress value={uploadProgress} className="h-1 bg-white/5" />
            <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
              {uploadProgress < 10 ? "جاري المعالجة العصبية (الضغط)..." : "جاري المزامنة السحابية..."}
            </p>
          </div>
        )}

        <h3 dir="auto" className="text-xl font-bold text-white mb-1">{user?.name}</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-mono">@{user?.username}</p>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-6 text-[10px] uppercase font-bold text-indigo-400 hover:bg-indigo-500/10 rounded-xl h-9 px-6 border-white/5 bg-white/5"
        >
          {user?.avatar_url ? "تغيير أيقونة الهوية" : "رفع أيقونة الهوية"}
        </Button>
      </Card>

      <Card className="lg:col-span-2 glass border-white/5 rounded-[2.5rem] p-8 shadow-xl">
        <CardHeader className="px-0 pt-0 text-right">
          <CardTitle className="text-2xl font-bold text-white">إعدادات الهوية</CardTitle>
          <CardDescription className="text-muted-foreground">تحديث معلومات العقدة العامة الخاصة بك في السجل العالمي.</CardDescription>
        </CardHeader>
        
        <div className="space-y-8 mt-6">
          <div className="grid gap-3">
            <Label htmlFor="displayName" className="text-right text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">الاسم المعروض</Label>
            <Input 
              id="displayName" 
              dir="auto"
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-white/5 border-white/10 h-14 rounded-2xl text-right text-lg focus-visible:ring-primary shadow-inner"
              placeholder="اسمك في الشبكة..."
            />
          </div>

          <div className="grid gap-3 opacity-60">
            <Label htmlFor="username" className="text-right text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">معرف نكسوس (Username)</Label>
            <Input id="username" value={user?.username} disabled className="bg-white/5 border-white/10 h-14 rounded-2xl text-right font-mono" />
            <p className="text-[10px] text-amber-500/70 italic text-right font-bold">لا يمكن تعديل معرفات Nexus بمجرد تثبيتها لضمان سلامة الروابط.</p>
          </div>

          <div className="pt-6 border-t border-white/5">
            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdating || displayName === user?.name}
              className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-10 shadow-xl shadow-primary/20 w-full sm:w-auto font-black text-base transition-all active:scale-95"
            >
              {isUpdating ? <Loader2 className="size-5 animate-spin mr-2" /> : <CheckCircle2 className="size-5 mr-2" />}
              مزامنة بيانات العقدة
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
