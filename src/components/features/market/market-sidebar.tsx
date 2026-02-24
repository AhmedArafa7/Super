
"use client";

import React, { useState } from "react";
import { 
  LayoutGrid, Laptop, Boxes, Briefcase, Terminal, 
  GraduationCap, MonitorSmartphone, Sofa, Wrench, 
  Sparkles, Plus, Loader2, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainCategory, requestNewCategory } from "@/lib/market-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";

export const MAIN_CATEGORIES = [
  { id: 'all', label: 'كل القطاعات', icon: LayoutGrid },
  { id: 'electronics', label: 'الإلكترونيات', icon: Laptop },
  { id: 'home_lifestyle', label: 'المنزل والشموع', icon: Sofa },
  { id: 'digital_assets', label: 'الأصول الرقمية', icon: Boxes },
  { id: 'services', label: 'الخدمات التقنية', icon: Briefcase },
  { id: 'tools', label: 'أدوات AI', icon: Terminal },
  { id: 'industrial', label: 'المعدات الصناعية', icon: Wrench },
  { id: 'health_beauty', label: 'الصحة والجمال', icon: Sparkles },
  { id: 'education', label: 'المعرفة', icon: GraduationCap },
  { id: 'software', label: 'البرمجيات والعقد', icon: MonitorSmartphone },
];

interface MarketSidebarProps {
  currentCat: MainCategory;
  onSelect: (cat: MainCategory) => void;
}

export function MarketSidebar({ currentCat, onSelect }: MarketSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState({ name: "", parent: "all" as MainCategory });

  const handleRequest = async () => {
    if (!user || !suggestion.name) return;
    setIsSubmitting(true);
    try {
      await requestNewCategory(user.id, user.name, suggestion.name, suggestion.parent);
      toast({ title: "تم إرسال الاقتراح", description: "سيتم مراجعة التصنيف من قبل الإدارة." });
      setIsModalOpen(false);
      setSuggestion({ name: "", parent: "all" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الإرسال" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-slate-900/20 backdrop-blur-xl flex flex-col hidden lg:flex">
      <div className="p-6 border-b border-white/5">
        <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 text-right">نطاقات المتجر</h2>
        <nav className="space-y-1">
          {MAIN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id as MainCategory)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group flex-row-reverse",
                currentCat === cat.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <cat.icon className={cn("size-4 transition-colors", currentCat === cat.id ? "text-white" : "text-indigo-400 group-hover:text-primary")} />
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full border border-dashed border-white/10 rounded-xl text-[10px] uppercase font-bold text-muted-foreground hover:bg-white/5 gap-2 flex-row-reverse">
              <Plus className="size-3" /> اقتراح تصنيف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 rounded-[2rem] p-8 text-right">
            <DialogHeader>
              <DialogTitle className="text-right">اقتراح تصنيف سيادي</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>اسم التصنيف المقترح</Label>
                <Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" placeholder="مثال: بخور، أحذية رياضية..." value={suggestion.name} onChange={e => setSuggestion({...suggestion, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>يندرج تحت قطاع</Label>
                <Select value={suggestion.parent} onValueChange={(v: any) => setSuggestion({...suggestion, parent: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-12 flex-row-reverse"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {MAIN_CATEGORIES.filter(c => c.id !== 'all').map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRequest} disabled={isSubmitting} className="w-full bg-indigo-600 rounded-xl font-bold h-12">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "إرسال للمراجعة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
