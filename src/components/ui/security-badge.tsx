'use client';

import React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityBadgeProps {
  label?: string;
  className?: string;
  hideIcon?: boolean;
}

export function SecurityBadge({ 
  label = "التشفير نشط", 
  className,
  hideIcon = false 
}: SecurityBadgeProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-[10px] md:text-xs text-emerald-400/80 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg flex-row-reverse w-fit animate-in fade-in duration-500",
      className
    )}>
      {!hideIcon && <ShieldCheck className="size-3.5 md:size-4" />}
      <span>{label}</span>
    </div>
  );
}
