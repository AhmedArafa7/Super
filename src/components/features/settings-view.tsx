
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Settings, Volume2, ShieldAlert, Cpu, 
  Trash2, Save, Play, Square, Download, 
  Globe, Moon, Sparkles, Zap, Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore, PREMIUM_VOICES } from "@/lib/settings-store";
import { useProStore } from "@/lib/wetube-pro-engine";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/**
 * [STABILITY_ANCHOR: SETTINGS_ORCHESTRATOR_V1.0]
 * واجهة الإعدادات المركزية - تتضمن مختبر الصوت العصبي (TTS Lab).
 */
export function SettingsView() {
  const { settings, updateVoiceSettings, updateGeneralSettings, downloadVoice, isLoading } = useSettingsStore();
  const { usageLog, totalSavedMB, clearLog } = useProStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);
  const [testText, setTestText] = useState("مرحباً بك في نظام نكسوس الذكي. هذا اختبار للصوت العصبي.");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      if (!synth) return;
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  const handleTestVoice = () => {
    if (!synth || !testText) return;
    
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(testText);
    
    // Find selected voice
    const voice = voices.find(v => v.name === settings.voice.preferredVoice);
    if (voice) utterance.voice = voice;
    
    utterance.rate = settings.voice.rate;
    utterance.pitch = settings.voice.pitch;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const handleDownloadPreview = async (voiceId: string) => {
    setDownloadingIds(prev => [...prev, voiceId]);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 2000));
    await downloadVoice(voiceId);
    setDownloadingIds(prev => prev.filter(id => id !== voiceId));
    toast({
      title: "تم التحميل بنجاح",
      description: "المحرك الصوتي متاح الآن للاستخدام الأساسي.",
    });
  };

  const stopTestVoice = () => {
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Cpu className="size-12 animate-pulse text-primary" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">تحميل بروتوكولات الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans pb-32">
      <header className="text-right space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 border border-primary/20 rounded-full mb-2">
          <Sparkles className="size-3 text-primary animate-pulse" />
          <span className="text-[10px] uppercase font-black text-primary tracking-widest">System Preferences v2.0</span>
        </div>
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
          الإعدادات المركزية
          <Settings className="text-primary size-10" />
        </h1>
        <p className="text-muted-foreground text-lg">تحكم في بروتوكولات النظام، الواجهة، والمحركات العصبية.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الجانبي للإعدادات العامة */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass border-white/5 p-6 rounded-[2rem] space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
              الواجهة واللغة
              <Globe className="size-5 text-indigo-400" />
            </h3>
            
            <div className="space-y-4 text-right">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">لغة النظام</Label>
                <Select value={settings.general.language} onValueChange={(v: 'ar' | 'en') => updateGeneralSettings({ language: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl flex-row-reverse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-white/10 text-white">
                    <SelectItem value="ar">العربية (Default)</SelectItem>
                    <SelectItem value="en">English (Neural Translation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">نمط التصميم</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={settings.general.theme === 'dark' ? 'default' : 'outline'}
                    className="rounded-xl h-20 flex flex-col gap-2"
                    onClick={() => updateGeneralSettings({ theme: 'dark' })}
                  >
                    <Moon className="size-4" />
                    <span className="text-[10px] font-bold">Dark</span>
                  </Button>
                  <Button 
                    variant={settings.general.theme === 'neural' ? 'default' : 'outline'}
                    className="rounded-xl h-20 flex flex-col gap-2 border-primary/50"
                    onClick={() => updateGeneralSettings({ theme: 'neural' })}
                  >
                    <Zap className="size-4 text-primary" />
                    <span className="text-[10px] font-bold">Neural</span>
                  </Button>
                  <Button 
                    variant={settings.general.theme === 'light' ? 'default' : 'outline'}
                    className="rounded-xl h-20 flex flex-col gap-2"
                    onClick={() => updateGeneralSettings({ theme: 'light' })}
                  >
                    <div className="size-4 rounded-full border border-current" />
                    <span className="text-[10px] font-bold">Light</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass border-red-500/20 bg-red-500/5 p-6 rounded-[2rem] space-y-4">
             <div className="flex items-center justify-between flex-row-reverse">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  منطقة الخطر
                  <ShieldAlert className="size-4" />
                </h3>
                <Badge variant="outline" className="text-[8px] border-red-500/30 text-red-500">Destructive</Badge>
             </div>
             <p className="text-[10px] text-red-400/60 text-right">سيتم حذف جميع الإعدادات المحلية والمؤقتة المخزنة في المتصفح.</p>
             <Button variant="destructive" className="w-full rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 gap-2">
                <Trash2 className="size-4" />
                مسح البيانات المؤقتة
             </Button>
          </Card>
        </div>

        {/* مختبر الصوت العصبي - الجزء الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3 justify-end">
                    مختبر الصوت العصبي
                    <Volume2 className="text-primary size-7" />
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 text-right">إعداد وتحميل محركات الكلام Offline (TTS Lab).</p>
                </div>
                <div className="bg-primary text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full">Neural Engine</div>
              </div>

              {/* قسم تجربة النصوص */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-row-reverse">
                  <Label className="text-[10px] uppercase font-black text-primary tracking-widest">منصة اختبار النطق</Label>
                  <span className="text-[8px] text-muted-foreground font-mono uppercase">Neural Buffer: 4096 octets</span>
                </div>
                <div className="relative">
                  <textarea 
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-right text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                    placeholder="ضع النص الذي تريد سماعه هنا..."
                  />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {isSpeaking ? (
                      <Button size="sm" onClick={stopTestVoice} className="rounded-lg h-10 px-4 bg-red-500 hover:bg-red-600 gap-2 font-bold animate-pulse">
                        <Square className="size-3 fill-current" /> إيقاف
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleTestVoice} className="rounded-lg h-10 px-4 bg-primary hover:bg-primary/80 gap-2 font-bold shadow-lg shadow-primary/20">
                        <Play className="size-3 fill-current" /> استماع للتجربة
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* اختيار الصوت والحمولة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground">المحرك الصوتي المختار</Label>
                    <Select value={settings.voice.preferredVoice} onValueChange={(v: string) => updateVoiceSettings({ preferredVoice: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-xl flex-row-reverse font-mono text-xs">
                        <SelectValue placeholder="اختر المحرك" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white max-h-[300px]">
                        {voices.map((v, i) => (
                          <SelectItem key={i} value={v.name} className="flex-row-reverse gap-2">
                            <span className="font-bold">{v.name}</span>
                            <span className="text-[8px] opacity-40">[{v.lang}]</span>
                          </SelectItem>
                        ))}
                        {PREMIUM_VOICES.filter(pv => settings.voice.downloadedVoices?.includes(pv.id)).map((v) => (
                          <SelectItem key={v.id} value={v.name} className="flex-row-reverse gap-2 border-primary/20 bg-primary/5">
                            <span className="font-bold text-primary">{v.name} (Neural)</span>
                            <span className="text-[8px] opacity-40">[{v.lang}]</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center gap-2">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <span className="text-[10px] font-bold text-white uppercase">استهلاك الموارد</span>
                      <Info className="size-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-end gap-1 justify-end">
                       <span className="text-2xl font-black text-primary">0.0</span>
                       <span className="text-[8px] text-muted-foreground font-mono mb-1 uppercase">MB (Client Service)</span>
                    </div>
                    <p className="text-[8px] text-muted-foreground text-right italic">معظم الأصوات متوفرة في النظام ولا تستهلك باقة إضافية.</p>
                 </div>
              </div>

              {/* أشرطة التحكم الدقيقة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4 text-right">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <Label className="text-[10px] uppercase font-black text-white">سرعة الكلام (Rate)</Label>
                      <span className="text-[10px] font-mono text-primary">{settings.voice.rate.toFixed(1)}x</span>
                    </div>
                    <Slider 
                      value={[settings.voice.rate]} 
                      min={0.5} 
                      max={2} 
                      step={0.1} 
                      onValueChange={(v: number[]) => updateVoiceSettings({ rate: v[0] })} 
                      className="py-4"
                    />
                 </div>
                 <div className="space-y-4 text-right">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <Label className="text-[10px] uppercase font-black text-white">درجة الصوت (Pitch)</Label>
                      <span className="text-[10px] font-mono text-primary">{settings.voice.pitch.toFixed(1)}</span>
                    </div>
                    <Slider 
                      value={[settings.voice.pitch]} 
                      min={0} 
                      max={2} 
                      step={0.1} 
                      onValueChange={(v: number[]) => updateVoiceSettings({ pitch: v[0] })} 
                      className="py-4"
                    />
                 </div>
              </div>

              {/* خيار الطوارئ */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between flex-row-reverse">
                 <div className="text-right">
                    <h4 className="text-sm font-bold text-white">وضع الطوارئ (Emergency Mode)</h4>
                    <p className="text-[10px] text-muted-foreground">استخدام هذا الصوت فقط كبديل في حالة فشل المحركات السحابية.</p>
                 </div>
                 <Switch 
                  checked={settings.voice.isEmergencyOnly} 
                  onCheckedChange={(v: boolean) => updateVoiceSettings({ isEmergencyOnly: v })} 
                 />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                 <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-white/10 hover:bg-white/5 gap-2">
                    <Download className="size-4" /> تحميل محرك خارجي
                 </Button>
                 <Button className="rounded-xl h-12 px-8 font-bold bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
                    <Save className="size-4" /> حفظ البروتوكول
                 </Button>
              </div>
            </div>
          </Card>

          {/* متجر أصوات نكسوس العصبية */}
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-row-reverse px-2">
               <h2 className="text-xl font-black text-white flex items-center gap-3">
                  متجر أصوات نكسوس العصبية
                  <Sparkles className="text-yellow-400 size-5" />
               </h2>
               <div className="border border-white/10 text-muted-foreground text-[10px] px-2 py-1 rounded-full text-right">5 محركات جديدة متوفرة</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {PREMIUM_VOICES.map((v) => {
                 const isDownloaded = settings.voice.downloadedVoices?.includes(v.id);
                 const isDownloading = downloadingIds.includes(v.id);

                 return (
                   <Card key={v.id} className={cn(
                     "glass p-6 rounded-[2rem] border-white/5 relative overflow-hidden group transition-all hover:scale-[1.02] hover:border-primary/30",
                     isDownloaded && "border-green-500/20 bg-green-500/5"
                   )}>
                      <div className="absolute top-2 left-2 flex gap-1">
                         <div className="bg-white/10 text-white text-[8px] px-1.5 py-0.5 rounded-sm">{v.provider}</div>
                         <div className="bg-primary/20 text-primary text-[8px] px-1.5 py-0.5 rounded-sm">{v.quality}</div>
                      </div>

                      <div className="pt-4 text-right space-y-4">
                         <div>
                            <h3 className="font-black text-lg text-white">{v.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase">{v.lang}</p>
                         </div>

                         <div className="flex items-end justify-between flex-row-reverse">
                            <div className="text-right">
                               <span className="text-[8px] text-muted-foreground block uppercase">حجم المحرك</span>
                               <span className="text-lg font-mono font-bold text-white">{v.sizeMB}MB</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant={isDownloaded ? "outline" : "default"}
                              className={cn(
                                "rounded-xl font-bold gap-2",
                                isDownloaded ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "bg-primary shadow-lg shadow-primary/20"
                              )}
                              disabled={isDownloading}
                              onClick={() => !isDownloaded && handleDownloadPreview(v.id)}
                            >
                               {isDownloading ? (
                                 <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                               ) : isDownloaded ? (
                                 <ShieldAlert className="size-3" />
                               ) : (
                                 <Download className="size-3" />
                               )}
                               {isDownloading ? "جاري التحميل..." : isDownloaded ? "نمط الطوارئ متاح" : "تحميل واستخدام"}
                            </Button>
                         </div>
                      </div>
                   </Card>
                 );
               })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

