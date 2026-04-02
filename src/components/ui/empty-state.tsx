
import React from 'react';
import { LucideIcon, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-500",
      className
    )}>
      <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 mb-6 shadow-xl">
        {Icon && (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) ? (
          <Icon className="size-10 text-primary" />
        ) : (
          <Layers className="size-10 text-primary opacity-50" />
        )}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
        {description}
      </p>
      {action && (
        <div className="w-full max-w-xs">
          {action}
        </div>
      )}
    </div>
  );
}
