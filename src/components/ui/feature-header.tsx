'use client';

import React from "react";
import { LucideIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeatureHeaderProps {
  title: string;
  description?: string;
  Icon?: LucideIcon;
  iconClassName?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  action?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export function FeatureHeader({
  title,
  description,
  Icon,
  iconClassName,
  onRefresh,
  isRefreshing = false,
  action,
  className,
  titleClassName
}: FeatureHeaderProps) {
  return (
    <div className={cn("flex justify-between items-center flex-row-reverse mb-8", className)}>
      <div className="text-right">
        <h2 className={cn(
          "text-3xl md:text-4xl font-headline font-bold text-white flex items-center gap-4 justify-end",
          titleClassName
        )}>
          {title}
          {Icon && <Icon className={cn("size-8 md:size-10 text-primary", iconClassName)} />}
        </h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {onRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh} 
            disabled={isRefreshing} 
            className="size-11 md:size-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 transition-all"
          >
            <RefreshCcw className={cn("size-5 text-primary", isRefreshing && "animate-spin")} />
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
