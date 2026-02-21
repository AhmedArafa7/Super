
"use client";

import React, { useState, useEffect } from "react";
import { 
  Rocket, Globe, Lock, Play, ArrowLeft, 
  Search, LayoutGrid, Cpu, Code2, ShieldCheck, 
  ExternalLink, Info, Zap, Terminal, Laptop, Plus, Loader2,
  Settings2, Activity, ShieldAlert, X, UserCheck, AlertCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApprovedApps, submitAppRequest, WebProject, AppFramework } from "@/lib/launcher-store";
import { useAuth } from "@/components/auth/auth-provider";
import { useWalletStore } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const FrameworkIcon = ({ framework }: { framework: AppFramework }) => {
  switch (framework) {
    case 'angular': return <div className="size-6 bg-red-600 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">A</div>;
    case 'react': return <div className="size-6 bg-blue-500 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">R</div>;
    case 'nextjs': return <div className="size-6 bg-black border border-white/20 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">N</div>;
    case 'html': return <div className="size-6 bg-orange-500 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">H5</div>;
    default: return <div className="size-6 bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">?</div>;
  }
};

/**
 * [STABILITY_ANCHOR: APP_LAUNCHER_HEADLESS_V2.0]
 * مشغل التطبيقات المطور: يدعم الآن بروتوكول البث السحابي (Neural Stream) لفتح كافة المواقع.
 */
export function AppLauncher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const wallet = useWalletStore(state => state.wallet);
  const adjustFunds = useWalletStore(state => state.adjustFunds);
  
  const [apps, setApps] = useState<WebProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<WebProject | null>(null);
  const [search, setSearch] = useState("");
  const [isHeadlessStream, setIsHeadlessStream] = useState(true); // البث السحابي هو الافتراضي الآن للقوة

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    framework: "other" as AppFramework
  });

  const loadApps = async () => {
    setIsLoading(true);
    const data = await getApprovedApps();
    setApps(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleSubmitRequest = async () => {
    if (!formData.title || !formData.url || !user) return;
    setIsSubmitting(true);
    try {
      await submitAppRequest({
        ...formData,
        authorId: user.id,
        authorName: user.name,
        thumbnail: `https://picsum.photos/seed/${formData.title}/800/450`
      });
      toast({ title: "تم إرسال الطلب", description: "سيتم مراجعة الموقع وتحديد حد الاستهلاك من قبل الأدمن." });
      setIsSubmitModalOpen(false);
      setFormData({ title: "", url: "", description: "", framework: "other" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الإرسال" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunch = async (project: WebProject) => {
    if (project.access === 'paid' && project.price > 0) {
      if ((wallet?.balance || 0) < project.price) {
        toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "تحتاج إلى المزيد من Credits لفتح هذه العقدة." });
        return;
      }
      const confirmed = window.confirm(`استهلاك ${project.price} Credits لتشغيل هذا التطبيق؟`);
      if (confirmed && user) {
        const success = await adjustFunds(user.id, project.price, 'withdrawal');
        if (!success) return;
      } else return;
    }
    setActiveProject(project);
  };

  const filteredProjects = apps.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  if (activeProject) {
    const finalFrameUrl = isHeadlessStream 
      ? `/api/proxy?url=${encodeURIComponent(activeProject.url)}`
      : activeProject.url;

    return (
      <div className="flex flex-col h-full bg-black animate-in fade-in duration-500 font-sans">
        <header className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 z-20 flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse">
            <Button variant="ghost" size="icon" onClick={() => setActiveProject(null)} className="rounded-full text-white"><ArrowLeft className="size-5 rotate-180" /></Button>
            <div className="text-right">
              <h2 className="text-sm font-bold text-white">{activeProject.title}</h2>
              <div className="flex items-center gap-2 justify-end">
                <span className={cn("size-1.5 rounded-full animate-pulse", isHeadlessStream ? "bg-amber-500" : "bg-green-500")} />
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                  {isHeadlessStream ? 'Neural Stream Node (Headless)' : 'Direct Session Node (Personal)'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-2xl border border-white/10">
                <div className="text-right">
                  <Label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">بث عصبي شامل</Label>
                  <p className="text-[7px] text-amber-500 font-bold uppercase tracking-tighter">فتح كافة المواقع</p>
                </div>
                <Switch checked={isHeadlessStream} onCheckedChange={setIsHeadlessStream} />
                <Zap className={cn("size-3", isHeadlessStream ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
              </div>
            </div>
            
            <div className="h-8 w-px bg-white/10" />
            
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-white/10 text-[10px] font-bold bg-white/5 hover:bg-primary" onClick={() => window.open(activeProject.url, '_blank')}>
              <ExternalLink className="size-3 mr-1.5" /> فتح الرابط الأصلي
            </Button>
          </div>
        </header>
        
        {isHeadlessStream && (
          <div className="bg-amber-600/90 text-white px-6 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top-full duration-300 z-30">
            <RefreshCw className="size-4 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-center">
              بروتوكول البث نشط: يتم تجاوز قيود الأمان الآن لتشغيل الموقع بشكل كامل. لا تقم بتسجيل الدخول في هذا الوضع.
            </p>
          </div>
        )}

        <div className="flex-1 relative bg-white">
          <iframe 
            key={isHeadlessStream ? 'headless' : 'direct'}
            src={finalFrameUrl} 
            className="absolute inset-0 size-full border-none" 
            title={activeProject.title} 
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" 
          />
          {!isHeadlessStream && (
            <div className="absolute top-4 right-4 pointer-events-none">
              <Badge className="bg-green-600 text-white border-none text-[8px] font-black uppercase py-1 shadow-lg flex items-center gap-1">
                <UserCheck className="size-2" /> Personal Session Active
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Neural Stream Protocol v2.0</Badge>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            منصة التطبيقات
            <Rocket className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground text-lg">شغل أي موقع في العالم دون استثناء عبر بروتوكول البث السحابي العابر للقيود.</p>
        </div>
        <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-14 shadow-xl font-bold gap-3 flex-row-reverse">
              <Plus className="size-6" /> اقتراح تطبيق جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] p-8 text-right">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة عقدة سحابية</DialogTitle>
              <DialogDescription className="text-right text-xs">سيقوم الأدمن بمراجعة الرابط وتحديد رصيد الاستهلاك المطلوب حفاظاً على موارد النظام.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-6">
              <div className="grid gap-2"><Label>اسم التطبيق</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div className="grid gap-2"><Label>رابط الموقع (Live URL)</Label><Input placeholder="https://..." className="bg-white/5 border-white/10 text-right h-12" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} /></div>
              <div className="grid gap-2"><Label>الوصف</Label><Textarea dir="auto" className="bg-white/5 border-white/10 text-right" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="grid gap-2">
                <Label>التقنية المستخدمة</Label>
                <Select value={formData.framework} onValueChange={(v: any) => setFormData({...formData, framework: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white"><SelectItem value="react">React</SelectItem><SelectItem value="angular">Angular</SelectItem><SelectItem value="nextjs">Next.js</SelectItem><SelectItem value="html">Static HTML</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSubmitRequest} disabled={isSubmitting} className="w-full bg-primary h-14 rounded-2xl font-bold">إرسال للمراجعة</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative max-w-2xl ml-auto">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input 
          dir="auto" placeholder="ابحث عن تطبيق أو تقنية..." 
          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pr-12 pl-6 text-right focus:outline-none focus:ring-2 focus:ring-primary shadow-2xl text-white"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">جاري استدعاء العقد السحابية...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-primary/40 transition-all duration-500 shadow-2xl relative">
              <div className="absolute top-4 left-4 z-10">
                <Badge className={cn(
                  "bg-black/60 backdrop-blur-md border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  project.access === 'free' ? "text-green-400" : "text-indigo-400"
                )}>
                  {project.access}
                </Badge>
              </div>
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img src={project.thumbnail} className="size-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40">
                  <Button onClick={() => handleLaunch(project)} className="rounded-full size-16 bg-primary/20 backdrop-blur-md border border-white/20 shadow-2xl"><Play className="text-white size-8 fill-white" /></Button>
                </div>
              </div>
              <CardContent className="p-8 text-right">
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h3 dir="auto" className="text-xl font-bold text-white">{project.title}</h3>
                  <FrameworkIcon framework={project.framework} />
                </div>
                <p dir="auto" className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-8 h-10">{project.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">المالك</p>
                    <p className="text-xs font-bold text-indigo-400">@{project.authorName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.price > 0 ? (
                      <div className="text-right">
                        <span className="text-2xl font-black text-indigo-400">{project.price}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-bold">CREDITS</span>
                      </div>
                    ) : (
                      <Button variant="ghost" className="text-green-400 hover:bg-green-400/10 rounded-xl font-bold gap-2 flex-row-reverse" onClick={() => handleLaunch(project)}>
                        <Zap className="size-4" /> تشغيل مجاني
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
