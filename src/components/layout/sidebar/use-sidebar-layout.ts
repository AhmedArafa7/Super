'use client';

import { useSidebarStore } from "@/lib/sidebar-store";
import { cn } from "@/lib/utils";

/**
 * [HOOK: useSidebarLayout]
 * عقل التخطيط الذكي الذي يدير الاتجاهات، الهوامش، والأنماط بناءً على موقع الشريط.
 */
export function useSidebarLayout() {
  const position = useSidebarStore(s => s.position);
  const isCollapsed = useSidebarStore(s => s.isCollapsed);

  // هل الشريط في جهة اليمين؟
  const isRight = position === 'right';
  const isLeft = position === 'left';
  const isHorizontal = position === 'top' || position === 'bottom';
  const isFloating = position === 'floating';

  // اتجاه الـ Flex بناءً على الموقع
  const flexDir = isRight ? "flex-row" : "flex-row-reverse";
  const textDir = isRight ? "text-left" : "text-right";
  
  // الهامش الواقي لمنع تداخل النص مع الأزرار المطلقة
  const protectivePadding = !isCollapsed ? (isLeft ? "pl-9" : "pr-9") : "";

  // اتجاه فتح القوائم المنسدلة
  const dropdownSide = isLeft ? "right" : "left";

  return {
    position,
    isCollapsed,
    isRight,
    isLeft,
    isHorizontal,
    isFloating,
    flexDir,
    textDir,
    protectivePadding,
    dropdownSide,
    // دالة مساعدة لدمج الأنماط بسهولة
    layoutClasses: (extra?: string) => cn(flexDir, textDir, extra)
  };
}
