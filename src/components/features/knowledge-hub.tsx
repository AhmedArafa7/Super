"use client";

import React from "react";
import { FileText, Calendar, MoreVertical, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WeekData {
  id: number;
  number: string;
  date: string;
  isActive: boolean;
  lectureFile: string | null;
  practicalFile: string | null;
}

const WEEKS: WeekData[] = [
  {
    id: 1,
    number: "01",
    date: "February 7, 2026",
    isActive: true,
    lectureFile: null,
    practicalFile: "Practical_Manual_v1.pdf"
  },
  {
    id: 2,
    number: "02",
    date: "February 14, 2026",
    isActive: false,
    lectureFile: "RTOS_Concepts_Lecture.pdf",
    practicalFile: "Lab_Exercise_Scheduling.pdf"
  },
  {
    id: 3,
    number: "03",
    date: "February 21, 2026",
    isActive: false,
    lectureFile: "Kernel_Architecture.pptx",
    practicalFile: null
  }
];

export function KnowledgeHub() {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900 font-sans">
      {/* LMS Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">
            <span className="hover:text-teal-600 cursor-pointer">Courses</span>
            <span>/</span>
            <span className="text-slate-400">AI422</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            AI422 - Embedded and Real Time Operating Systems
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {WEEKS.map((week) => (
          <div 
            key={week.id} 
            className="flex flex-col md:flex-row bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Left Column: Timeline / Date */}
            <div className={cn(
              "w-full md:w-64 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100",
              week.isActive ? "bg-amber-50/50" : "bg-white"
            )}>
              {week.isActive && (
                <Badge className="bg-red-600 hover:bg-red-700 text-white rounded-sm text-[10px] px-2 py-0.5 mb-2 font-bold uppercase">
                  Current Week
                </Badge>
              )}
              <div className="text-5xl font-extrabold text-slate-800 leading-none">
                {week.number}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Week Number
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-teal-700 font-semibold text-sm">
                <Calendar className="size-3.5" />
                {week.date}
              </div>
            </div>

            {/* Right Column: Weekly Content */}
            <div className="flex-1 p-6 bg-slate-50/30 space-y-4">
              {/* Lecture Block */}
              <div className="bg-white rounded-md border-l-4 border-green-500 p-4 shadow-sm group hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Circle className="size-2.5 fill-green-500 text-green-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lecture</span>
                  </div>
                  <MoreVertical className="size-4 text-slate-300 cursor-pointer" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex-1">
                    {week.lectureFile ? (
                      <a href="#" className="text-sm font-semibold text-teal-700 hover:underline">
                        {week.lectureFile}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400 italic">No file in this week</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Practical Block */}
              <div className="bg-white rounded-md border-l-4 border-amber-400 p-4 shadow-sm group hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Circle className="size-2.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Practical</span>
                  </div>
                  <MoreVertical className="size-4 text-slate-300 cursor-pointer" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex-1">
                    {week.practicalFile ? (
                      <a href="#" className="text-sm font-semibold text-teal-700 hover:underline">
                        {week.practicalFile}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400 italic">No file in this week</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Support Section */}
        <div className="pt-8 border-t border-slate-200">
          <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-teal-100 rounded-full flex items-center justify-center">
                <FileText className="size-6 text-teal-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Need Course Assistance?</h4>
                <p className="text-sm text-slate-500">The neural teaching assistants are available 24/7 for your questions.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors">
                Contact Instructor
              </button>
              <button className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                Course Syllabus
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
