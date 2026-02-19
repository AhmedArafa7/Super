
"use client";

import React from "react";
import { Search, Database } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NodeSearchProps {
  value: string;
  onChange: (val: string) => void;
  count: number;
}

export function NodeSearch({ value, onChange, count }: NodeSearchProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 flex-row-reverse">
      <div className="relative flex-1">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input 
          dir="auto"
          placeholder="ابحث عن اسم العقدة، المعرف، أو الرتبة..." 
          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pr-12 pl-6 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xl text-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3 px-6 bg-white/5 border border-white/10 rounded-2xl h-14 md:h-auto">
        <Database className="size-4 text-emerald-400" />
        <span className="text-xs font-mono text-white whitespace-nowrap">{count} Active Nodes</span>
      </div>
    </div>
  );
}
