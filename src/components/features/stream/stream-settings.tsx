
"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function StreamSettings({ quality, setQuality, backgroundPlayback, setBackgroundPlayback, autoFloat, setAutoFloat }: any) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 relative">
          <Settings2 className="size-6 text-indigo-400" />
          <Badge className="absolute -top-2 -right-2 bg-primary text-[8px] h-4 px-1">{quality}p</Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-slate-900 border-white/10 p-6 rounded-[2rem] shadow-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-row-reverse">
            <h4 className="font-bold text-sm text-white">تخصيص تجربة البث</h4>
            <Settings2 className="size-4 text-indigo-400" />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block text-right">جودة الفيديو الافتراضية</Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                  <SelectItem value="240">240p (حفظ البيانات)</SelectItem>
                  <SelectItem value="360">360p (متوازن)</SelectItem>
                  <SelectItem value="480">480p (جودة متوسطة)</SelectItem>
                  <SelectItem value="720">720p (عالية HD)</SelectItem>
                  <SelectItem value="1080">1080p (فائقة FHD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-xs font-bold text-white">التشغيل في الخلفية</p>
                  <p className="text-[9px] text-muted-foreground">استمرار الصوت عند مغادرة الصفحة</p>
                </div>
                <Switch checked={backgroundPlayback} onCheckedChange={setBackgroundPlayback} />
              </div>

              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-xs font-bold text-white">العقدة العائمة (PIP)</p>
                  <p className="text-[9px] text-muted-foreground">عرض الفيديو فوق الصفحات الأخرى</p>
                </div>
                <Switch checked={autoFloat} onCheckedChange={setAutoFloat} />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
