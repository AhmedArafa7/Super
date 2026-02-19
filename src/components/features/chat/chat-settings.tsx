
"use client";

import React from "react";
import { Settings2, Cpu, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ChatSettingsProps {
  availableModels: any[];
  selectedModel: string;
  autoRead: boolean;
  onModelChange: (id: string) => void;
  onAutoReadChange: (val: boolean) => void;
}

/**
 * [STABILITY_ANCHOR: CHAT_SETTINGS_NODE_V1]
 * عقدة الإعدادات المستقلة - تدعم تخصيص النخاع ومزايا الصوت.
 */
export function ChatSettings({ 
  availableModels, 
  selectedModel, 
  autoRead, 
  onModelChange, 
  onAutoReadChange 
}: ChatSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 relative">
          <Settings2 className="size-6 text-indigo-400" />
          {autoRead && <div className="absolute -top-1 -right-1 size-3 bg-primary rounded-full border-2 border-slate-900 animate-pulse" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-slate-950 border-white/10 p-6 rounded-[2.5rem] shadow-2xl">
        <div className="space-y-6 text-right">
          <div className="flex items-center justify-between flex-row-reverse">
            <h4 className="font-bold text-sm text-white">إعدادات النخاع</h4>
            <Settings2 className="size-4 text-indigo-400" />
          </div>

          {/* التفضيلات الصوتية */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between flex-row-reverse">
            <div className="text-right">
              <Label className="text-xs font-bold text-white flex items-center gap-2 justify-end">
                القراءة التلقائية
                <Volume2 className="size-3 text-primary" />
              </Label>
              <p className="text-[9px] text-muted-foreground">نطق الرد فور وصوله عصبياً</p>
            </div>
            <Switch checked={autoRead} onCheckedChange={onAutoReadChange} />
          </div>

          <div className="grid gap-2">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">المحرك المفضل</p>
            {availableModels.map(m => (
              <Button 
                key={m.id} 
                variant="ghost" 
                onClick={() => onModelChange(m.id)}
                className={cn(
                  "justify-between flex-row-reverse h-14 rounded-xl px-4 transition-all", 
                  selectedModel === m.id ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5"
                )}
                disabled={m.id === 'googleai/gemini-1.5-pro' && (m.count || 0) <= 0}
              >
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="text-right">
                    <span className="font-bold text-xs block">{m.label}</span>
                    <span className="text-[8px] text-muted-foreground block">{m.desc}</span>
                  </div>
                  {m.count !== undefined && (
                    <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-inner">
                      {m.count}
                    </div>
                  )}
                </div>
                {selectedModel === m.id && <Check className="size-4 text-primary" />}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
