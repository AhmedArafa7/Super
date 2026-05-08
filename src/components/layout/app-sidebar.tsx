'use client';

/**
 * [MODULAR SIDEBAR BRIDGE]
 * This file now serves as a bridge to the new modular sidebar system.
 * Features are isolated in @/components/layout/sidebar/
 */

export { AppSidebar } from "./sidebar/index";
export { ALL_NAV_ITEMS, getVisibleNavItems } from "./sidebar/nav-items";
export type { NavItem } from "./sidebar/nav-items";
