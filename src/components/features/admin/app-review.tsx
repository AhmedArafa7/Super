"use client";

import React, { useState } from "react";
import { Rocket, CheckCircle2, XCircle, ExternalLink, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { approveApp, rejectApp, WebProject } from "@/lib/launcher-store";
import { useToast } from "@/hooks/use-toast";

interface AppReviewProps {
  apps: WebProject[];
  onRefresh: () => void;
}

export function AppReview({ apps, onRefresh }: AppReviewProps) {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, { price: number, access: any }>>({});

  const handleApprove = async (app: WebProject) => {
    const settings = config[app.id] || { price: 0, access: 'free' };
    setProcessingId(app.id);
    try {
      await approveApp(app.id, settings.price, settings.access);
      toast({ title: "تم تفعيل العقدة", description: "التطبيق متاح الآن في المنصة." });
      onRefresh();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التفعيل" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    await rejectApp(id);
    toast({ title: "تم الرفض" });
    onRefresh();
    setProcessingId(null);
  };

  if (apps.length === 0) {
    return (
      <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[2.5rem]">
        <Rocket className="size-12 mx-auto mb-4" />
        <p>لا توجد طلبات تطبيقات معلقة حالياً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      {apps.map((app) => (
        <Card key={app.id} className="glass border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex justify-between items-start flex-row-reverse">
            <div className="text-right">
              <h4 className="text-xl font-bold text-white">{app.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">بواسطة: @{app.authorName}</p>
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 mt-2 flex items-center justify-end gap-1">
                {app.url} <ExternalLink className="size-3" />
              </a>
            </div>
            <Badge variant="outline" className="border-amber-500/20 text-amber-400">PENDING REVIEW</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">إعدادات حد الاستهلاك</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">السعر (Credits)</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    className="bg-white/5 border-white/10 h-11 text-center" 
                    value={config[app.id]?.price || ""}
                    onChange={e => setConfig({...config, [app.id]: { ...(config[app.id] || {access: 'free'}), price: Number(e.target.value) }})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">نوع الوصول</Label>
                  <Select 
                    defaultValue="free" 
                    onValueChange={v => setConfig({...config, [app.id]: { ...(config[app.id] || {price: 0}), access: v as any }})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 flex-row-reverse"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white">
                      <SelectItem value="free">مجاني</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="trial">تجريبي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">الوصف المقترح</Label>
              <p className="text-sm text-slate-300 italic">"{app.description}"</p>
            </div>
          </div>

          <div className="flex gap-3 flex-row-reverse pt-4 border-t border-white/5">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl h-12 font-bold"
              onClick={() => handleApprove(app)}
              disabled={processingId === app.id}
            >
              {processingId === app.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
              اعتماد النشر المباشر
            </Button>
            <Button 
              variant="ghost" 
              className="text-red-400 hover:bg-red-500/10 rounded-xl px-8"
              onClick={() => handleReject(app.id)}
              disabled={processingId === app.id}
            >
              <XCircle className="size-4 mr-2" /> رفض الطلب
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
