'use client';

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'hover' | 'borderless';
  noPadding?: boolean;
}

export function GlassCard({ 
  children, 
  variant = 'default', 
  noPadding = false,
  className, 
  ...props 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass border text-white/90 relative overflow-hidden",
        // Varieties
        variant === 'default' && "border-white/10 rounded-[2.5rem] shadow-xl",
        variant === 'flat' && "border-white/5 rounded-3xl",
        variant === 'hover' && "border-white/10 rounded-[2.5rem] hover:border-primary/40 hover:shadow-primary/5 shadow-2xl",
        variant === 'borderless' && "border-none rounded-[2.5rem]",
        !noPadding && "p-6 md:p-8",
        className
      )}
      {...props}
    >
      {/* Optional internal gloss effect could go here */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
