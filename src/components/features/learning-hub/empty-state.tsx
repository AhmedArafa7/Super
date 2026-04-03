'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-500",
      className
    )}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative size-20 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
          <Icon className="size-10 text-primary/40" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
