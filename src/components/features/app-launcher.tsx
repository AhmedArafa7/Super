
"use client";

import React, { useState } from "react";
import { 
  Rocket, Globe, Lock, Play, ArrowLeft, 
  Search, LayoutGrid, Cpu, Code2, ShieldCheck, 
  ExternalLink, Info, Zap, Terminal, Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PROJECTS_DATA, WebProject, AppFramework } from "@/lib/launcher-store";
import { useAuth } from "@/components/auth/auth-provider";
import { useWalletStore } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const FrameworkIcon = ({ framework }: { framework: AppFramework }) => {
  switch (framework) {
    case 'angular': return <div className="size-6 bg-red-600 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">A</div>;
    case 'react': return <div className="size-6 bg-blue-500 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">R</div>;
    case 'html': return <div className="size-6 bg-orange-500 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg">H5</div>;
    default: return <Code2 className="size-4" />;
  }
};

export function AppLauncher() {
  const { user } = useAuth();
  const wallet = useWalletStore(state => state.wallet);
  const adjustFunds = useWalletStore(state => state.adjustFunds);
  
  const [activeProject, setActiveProject] = useState<WebProject | null>(null);
  const [search, setSearch] = useState("");

  const handleLaunch = async (project: WebProject) => {
    if (project.access === 'paid' && project.price) {
      if ((wallet?.balance || 0) < project.price) {
        toast({ 
          variant: "destructive", 
          title: "رصيد غير كافٍ", 
          description: "تحتاج إلى المزيد من Credits لفتح هذه العقدة البرمجية." 
        });
        return;
      }
      
      const confirmed = window.confirm(`هل تريد استهلاك ${project.price} Credits لفتح هذا المشروع؟`);
      if (confirmed && user) {
        const success = await adjustFunds(user.id, project.price, 'withdrawal');
        if (!success) return;
      } else {
        return;
      }
    }
    setActiveProject(project);
  };

  const filteredProjects = PROJECTS_DATA.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  if (activeProject) {
    return (
      <div className="flex flex-col h-full bg-black animate-in fade-in duration-500">
        <header className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 z-20 flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse">
            <Button variant="ghost" size="icon" onClick={() => setActiveProject(null)} className="rounded-full text-white">
              <ArrowLeft className="size-5 rotate-180" />
            </Button>
            <div className="text-right">
              <h2 dir="auto" className="text-sm font-bold text-white">{activeProject.title}</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2 justify-end">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Neural Instance
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-white/10 text-indigo-400 capitalize">{activeProject.framework} Node</Badge>
            <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10 text-[10px] font-bold" onClick={() => window.open(activeProject.url, '_blank')}>
              <ExternalLink className="size-3 mr-1" /> Open in New Tab
            </Button>
          </div>
        </header>

        <div className="flex-1 relative bg-white">
          <iframe 
            src={activeProject.url} 
            className="absolute inset-0 size-full border-none"
            title={activeProject.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Neural Sandbox</Badge>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            منصة التطبيقات
            <Rocket className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground text-lg">شغل تطبيقات Angular, React و HTML مباشرة داخل بيئتك الخاصة.</p>
        </div>
      </header>

      <div className="relative max-w-2xl ml-auto">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input 
          dir="auto"
          placeholder="ابحث عن تطبيق أو تقنية..." 
          className="w-full h-14 bg-white/5 border-white/10 rounded-2xl pr-12 pl-6 text-right focus-visible:ring-primary shadow-2xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-primary/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl relative">
            <div className="absolute top-4 left-4 z-10">
              <Badge className={cn(
                "bg-black/60 backdrop-blur-md border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                project.access === 'free' ? "text-green-400" : project.access === 'trial' ? "text-amber-400" : "text-indigo-400"
              )}>
                {project.access}
              </Badge>
            </div>
            
            <div className="relative aspect-video overflow-hidden bg-slate-900">
              <img src={project.thumbnail} alt={project.title} className="size-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Button onClick={() => handleLaunch(project)} className="rounded-full size-16 bg-primary/20 backdrop-blur-md border border-white/20 shadow-2xl group/btn">
                  <Play className="text-white size-8 fill-white group-hover/btn:scale-110 transition-transform" />
                </Button>
              </div>
            </div>

            <CardContent className="p-8 text-right">
              <div className="flex justify-between items-center mb-4 flex-row-reverse">
                <h3 dir="auto" className="text-xl font-bold text-white group-hover:text-primary transition-colors">{project.title}</h3>
                <FrameworkIcon framework={project.framework} />
              </div>
              <p dir="auto" className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-8 h-10">{project.description}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Laptop className="size-4 text-indigo-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">المطور</p>
                    <p className="text-xs font-bold text-white">@{project.author}</p>
                  </div>
                </div>
                
                {project.access === 'paid' ? (
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-400">{project.price}</span>
                    <span className="text-[10px] text-muted-foreground ml-1 font-bold">CREDITS</span>
                  </div>
                ) : (
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-xl font-bold gap-2 flex-row-reverse px-4" onClick={() => handleLaunch(project)}>
                    <Zap className="size-4" /> تشغيل الآن
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-12 glass rounded-[3rem] border-white/5 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 size-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
        <ShieldCheck className="size-12 text-primary mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-white mb-4">بيئة تشغيل آمنة E2EE</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          يتم تشغيل كافة التطبيقات داخل "عقدة معزولة" (Sandboxed Node) لضمان أمان بياناتك وخصوصية تصفحك أثناء تجربة المشاريع البرمجية.
        </p>
      </div>
    </div>
  );
}
