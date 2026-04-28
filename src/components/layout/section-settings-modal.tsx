"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSectionSettingsStore } from "@/lib/section-settings-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Database, RefreshCw, MonitorPlay, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function SectionSettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  
  const { streamSettings, updateStreamSettings } = useSectionSettingsStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleOpen = (e: any) => {
      setActiveSectionId(e.detail.sectionId);
      setIsOpen(true);
    };

    window.addEventListener('open-section-settings', handleOpen);
    
    // Listen for other actions to show toast since they are placeholders for now
    const showPlaceholderToast = (e: any, action: string) => {
      toast({
        title: `تم النقر على ${action}`,
        description: `هذه الخاصية (لقسم ${e.detail.sectionId}) سيتم تفعيلها قريباً!`,
      });
    };

    const handleDesign = (e: any) => showPlaceholderToast(e, 'تعديل التصميم');
    const handleFeature = (e: any) => showPlaceholderToast(e, 'إضافة فيتشر جديدة');
    const handlePreload = (e: any) => showPlaceholderToast(e, 'تحميل القسم مسبقاً');

    window.addEventListener('open-section-design', handleDesign);
    window.addEventListener('open-section-feature', handleFeature);
    window.addEventListener('open-section-preload', handlePreload);

    return () => {
      window.removeEventListener('open-section-settings', handleOpen);
      window.removeEventListener('open-section-design', handleDesign);
      window.removeEventListener('open-section-feature', handleFeature);
      window.removeEventListener('open-section-preload', handlePreload);
    };
  }, [toast]);

  if (!isOpen || !activeSectionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold flex items-center gap-2">
            <SettingsIcon sectionId={activeSectionId} />
            إعدادات قسم: {getSectionName(activeSectionId)}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 flex flex-col gap-6">
          {activeSectionId === 'stream' ? (
            <>
              {/* Background Playback */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex flex-col gap-1 w-3/4">
                  <div className="flex items-center gap-2">
                    <Play className="size-4 text-primary" />
                    <Label className="font-bold text-white text-sm cursor-pointer">التشغيل في الخلفية</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    استمر في تشغيل الفيديو أو الـ Shorts حتى لو قمت بتغيير التبويب أو فتحت قسماً آخر (كالمحادثات).
                  </p>
                </div>
                <Switch 
                  checked={streamSettings.backgroundPlay} 
                  onCheckedChange={(c) => updateStreamSettings({ backgroundPlay: c })} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Auto Sync */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex flex-col gap-1 w-3/4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 text-indigo-400" />
                    <Label className="font-bold text-white text-sm cursor-pointer">التنزيل التلقائي</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    السماح للنظام بجلب الفيديوهات الجديدة للقنوات التي تتابعها وتخزينها محلياً في الخلفية.
                  </p>
                </div>
                <Switch 
                  checked={streamSettings.autoSync} 
                  onCheckedChange={(c) => updateStreamSettings({ autoSync: c })} 
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>

              {/* Storage Limit */}
              <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-emerald-400" />
                    <Label className="font-bold text-white text-sm">مساحة التخزين المؤقت (Cache)</Label>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                    {streamSettings.storageLimitGB} GB
                  </span>
                </div>
                <Slider 
                  value={[streamSettings.storageLimitGB]} 
                  min={1} max={50} step={1}
                  onValueChange={(val) => updateStreamSettings({ storageLimitGB: val[0] })}
                  className="py-2"
                />
                <p className="text-[10px] text-muted-foreground">
                  الحد الأقصى للمساحة التي يمكن أن يستخدمها القسم لتسريع الفيديوهات.
                </p>
              </div>

              {/* Default Quality */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="size-4 text-amber-400" />
                  <Label className="font-bold text-white text-sm">الجودة الافتراضية</Label>
                </div>
                <Select value={streamSettings.defaultQuality} onValueChange={(v) => updateStreamSettings({ defaultQuality: v })}>
                  <SelectTrigger className="w-[120px] bg-black/40 border-white/10 h-8 text-xs rounded-xl">
                    <SelectValue placeholder="اختر الجودة" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                    <SelectItem value="Auto (720p)" className="text-xs">تلقائي (720p)</SelectItem>
                    <SelectItem value="1080p" className="text-xs">عالي (1080p)</SelectItem>
                    <SelectItem value="480p" className="text-xs">توفير (480p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
             <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
                <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <SettingsIcon sectionId={activeSectionId} className="size-8 text-muted-foreground opacity-50" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-lg">لا توجد إعدادات مخصصة</h3>
                  <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                    هذا القسم لا يملك إعدادات مخصصة حتى الآن. سيتم إضافة خيارات تحكم قريباً.
                  </p>
                </div>
             </div>
          )}
        </div>

        <div className="pt-2 border-t border-white/10 flex justify-start">
           <Button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-10 px-6 gap-2">
              <Save className="size-4" />
              تم حفظ الإعدادات
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getSectionName(id: string) {
  const map: Record<string, string> = {
    'stream': 'WeTube (الترفيه)',
    'vault': 'خزنة الملفات',
    'chat': 'الدردشة الذكية',
    'dashboard': 'لوحة التحكم'
  };
  return map[id] || id;
}

function SettingsIcon({ sectionId, className = "size-5 text-indigo-400" }: { sectionId: string, className?: string }) {
  if (sectionId === 'stream') return <MonitorPlay className={className} />;
  return <Database className={className} />;
}
