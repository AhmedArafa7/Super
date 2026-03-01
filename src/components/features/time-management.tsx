'use client';

import React from "react";
import { Clock, Timer, LayoutGrid, Zap } from "lucide-react";
import { TaskList } from "./time/task-list";
import { PomodoroTimer } from "./time/pomodoro-timer";
import { Badge } from "@/components/ui/badge";

/**
 * [STABILITY_ANCHOR: TIME_MANAGEMENT_V1.0]
 * المنسق الرئيسي لقسم إدارة الوقت والتركيز.
 */
export function TimeManagement() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 font-sans min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-row-reverse text-right">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 border border-primary/20 rounded-full mb-2">
            <Zap className="size-3 text-primary" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Neural Productivity Core</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            تنظيم الوقت والتركيز
            <Clock className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">أدوات ذكية مصممة لرفع كفاءة أدائك اليومي من خلال تقنيات التركيز العصبي.</p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-20">
        <div className="lg:col-span-3">
          <PomodoroTimer />
        </div>
        <div className="lg:col-span-2">
          <TaskList />
        </div>
      </main>

      <footer className="p-8 glass rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 flex-row-reverse">
        <div className="text-right">
          <h4 className="font-bold text-white text-sm">لماذا تنظيم الوقت في نكسوس؟</h4>
          <p className="text-xs text-muted-foreground mt-1">المزامنة مع الساعة البيولوجية العصبية تضمن استهلاك طاقة أقل وإنتاجية أعلى.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="border-white/10 px-4 py-1 text-[10px] uppercase font-bold">Deep Work Protocol</Badge>
          <Badge variant="outline" className="border-white/10 px-4 py-1 text-[10px] uppercase font-bold">Local Sync Ready</Badge>
        </div>
      </footer>
    </div>
  );
}
