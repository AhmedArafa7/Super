'use client';

import React from "react";
import { Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { IconSafe } from "@/components/ui/icon-safe";

export function UploadMonitor({ tasks }: any) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="px-1 space-y-3">
      <div className="flex items-center gap-2 justify-end opacity-50">
        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.2em]">مراقب الرفع</p>
        <IconSafe icon={Zap} className="size-3 text-indigo-400 animate-pulse" />
      </div>
      {tasks.map((task: any) => (
        <div key={task.id} className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
          <div className="flex items-center justify-between gap-2 flex-row-reverse">
            <p className="text-[9px] text-white font-bold truncate flex-1 text-right">{task.fileName}</p>
            <span className="text-[8px] text-primary font-black">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-1 bg-white/5" />
        </div>
      ))}
    </div>
  );
}
