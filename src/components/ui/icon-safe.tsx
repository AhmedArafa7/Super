"use client";

import React from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconSafeProps extends React.SVGProps<SVGSVGElement> {
  icon: any;
  fallback?: React.ElementType;
  className?: string;
}

/**
 * [STABILITY_ANCHOR: ICON_SAFE_V1.0]
 * مكوّن الحماية الموحد للأيقونات - يضمن عدم انهيار التطبيق عند استدعاء أيقونة غير صالحة.
 */
export function IconSafe({ icon: Icon, fallback: Fallback = Layers, className, ...props }: IconSafeProps) {
  // Check if Icon is a valid React component (function or object)
  const isValid = Icon && (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null));

  if (!isValid) {
    if (!Fallback) return null;
    return <Fallback className={cn("opacity-20", className)} {...(props as any)} />;
  }

  try {
    return <Icon className={className} {...props} />;
  } catch (err) {
    console.error("[IconSafe] Error rendering icon:", err);
    if (!Fallback) return null;
    return <Fallback className={cn("opacity-20", className)} {...(props as any)} />;
  }
}
