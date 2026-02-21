
"use client";

import React, { useState, useEffect } from "react";
import { 
  Rocket, Globe, Lock, Play, ArrowLeft, 
  Search, LayoutGrid, Cpu, Code2, ShieldCheck, 
  ExternalLink, Info, Zap, Terminal, Laptop, Plus, Loader2,
  Settings2, Activity, ShieldAlert, X, UserCheck, AlertCircle, RefreshCw, Bug
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

/**
 * [STABILITY_ANCHOR: APP_LAUNCHER_HEADLESS_V5.5]
 * مشغل التطبيقات المطور: تفعيل بروتوكول التشخيص (Spy Protocol) لرصد أخطاء الأزرار.
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
  const [isHeadlessStream, setIsHeadlessStream] = useState(true); 

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

  const handleLaunch = async (project: WebProject) => {
    if (project.access === 'paid' && project.price > 0) {
      if ((wallet?.balance || 0) < project.price) {
        toast({ variant: "destructive", title: "رصيد غير كافٍ" });
        return;
      }
      const confirmed = window.confirm(`استهلاك ${project.price} Credits؟`);
      if (confirmed && user) {
        const success = await adjustFunds(user.id, project.price, 'withdrawal');
        if (!success) return;
      } else return;
    }
    setActiveProject(project);
  };

  if (activeProject) {
    const finalFrameUrl = isHeadlessStream 
      ? `/api/proxy?url=${encodeURIComponent(activeProject.url)}`
      : activeProject.url;

    return (
      <div className="flex flex-col h-full bg-black animate-in fade-in duration-500">
        <header className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 z-20 flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse">
            <Button variant="ghost" size="icon" onClick={() => setActiveProject(null)} className="rounded-full text-white"><ArrowLeft className="size-5 rotate-180" /></Button>
            <div className="text-right">
              <h2 className="text-sm font-bold text-white">{activeProject.title}</h2>
              <div className="flex items-center gap-2 justify-end">
                <span className={cn("size-1.5 rounded-full animate-pulse", isHeadlessStream ? "bg-amber-500" : "bg-green-500")} />
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                  {isHeadlessStream ? 'Neural Spy Protocol V28' : 'Direct Session Active'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-2xl border border-white/10">
              <div className="text-right">
                <Label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block text-right">وضع التشخيص</Label>
                <p className="text-[7px] text-amber-500 font-bold uppercase text-right">رصد أخطاء الأزرار</p>
              </div>
              <Switch checked={isHeadlessStream} onCheckedChange={setIsHeadlessStream} />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-white/10 text-[10px] font-bold bg-white/5 hover:bg-primary" onClick={() => window.open(activeProject.url, '_blank')}>
              <ExternalLink className="size-3 mr-1.5" /> فتح الرابط الأصلي
            </Button>
          </div>
        </header>
        
        <div className="flex-1 relative bg-white">
          <iframe 
            src={finalFrameUrl} 
            className="absolute inset-0 size-full border-none" 
            title={activeProject.title} 
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Neural Diagnostics Mode</Badge>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            منصة التطبيقات
            <Rocket className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground text-lg">شغل أي موقع مع نظام "العميل الجاسوس" لتحديد وحل مشكلات استجابة الأزرار برمجياً.</p>
        </div>
        <Button onClick={() => setIsSubmitModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-14 shadow-xl font-bold gap-3 flex-row-reverse">
          <Plus className="size-6" /> اقتراح تطبيق
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {apps.map((project) => (
          <Card key={project.id} className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-primary/40 transition-all duration-500 shadow-2xl relative">
            <div className="relative aspect-video overflow-hidden bg-slate-900">
              <img src={project.thumbnail} className="size-full object-cover opacity-80" alt={project.title} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Button onClick={() => handleLaunch(project)} className="rounded-full size-16 bg-primary/20 backdrop-blur-md border border-white/20 shadow-2xl"><Play className="text-white size-8 fill-white" /></Button>
              </div>
            </div>
            <CardContent className="p-8 text-right">
              <h3 dir="auto" className="text-xl font-bold text-white mb-2">{project.title}</h3>
              <p dir="auto" className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">{project.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
