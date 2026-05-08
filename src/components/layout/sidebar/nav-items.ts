import { 
  LayoutDashboard, MessageCircleQuestion, Gamepad2, Clock, HeartPulse, MessageSquare, 
  Cpu, HardDrive, Tag, MessageCircle, Video, ShoppingCart, GraduationCap, LibraryBig, 
  Megaphone, DownloadCloud, Rocket, Wallet, Repeat, CircuitBoard, Library, Microscope, 
  Users, BookOpen, Zap, Bell, Settings, ShieldCheck 
} from "lucide-react";
import React from "react";

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  restricted: boolean;
  isPermanent?: boolean;
  badge?: number;
};

export const ALL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, restricted: false, isPermanent: true },
  { id: "qa", label: "الأسئلة والطلبات", icon: MessageCircleQuestion, restricted: false, isPermanent: true },
  { id: "arcade", label: "Nexus Arcade", icon: Gamepad2, restricted: false },
  { id: "time", label: "تنظيم الوقت", icon: Clock, restricted: false },
  { id: "health", label: "الصحة والرياضة", icon: HeartPulse, restricted: false },
  { id: "chat", label: "الدردشة الذكية", icon: MessageSquare, restricted: false },
  { id: "agent-ai", label: "المهندس المساعد", icon: Cpu, restricted: false },
  { id: "vault", label: "خزنة الملفات", icon: HardDrive, restricted: false },
  { id: "deals", label: "عروض المحلات", icon: Tag, restricted: false },
  { id: "peer-chat", label: "التواصل المباشر", icon: MessageCircle, restricted: false },
  { id: "stream", label: "WeTube", icon: Video, restricted: false },
  { id: "market", label: "المتجر التقني", icon: ShoppingCart, restricted: false },
  { id: "study-ai", label: "المساعد الدراسي", icon: GraduationCap, restricted: false },
  { id: "knowledge", label: "المكتبة المعرفية", icon: LibraryBig, restricted: false },
  { id: "ads", label: "مركز الإعلانات", icon: Megaphone, restricted: false },
  { id: "downloads", label: "التحميلات", icon: DownloadCloud, restricted: false },
  { id: "launcher", label: "مشغل المواقع", icon: Rocket, restricted: false },
  { id: "wallet", label: "المحفظة الرقمية", icon: Wallet, restricted: false },
  { id: "offers", label: "صندوق العروض", icon: Repeat, restricted: false },
  { id: "learning", label: "التعلم", icon: GraduationCap, restricted: false },
  { id: "micro-ide", label: "برمجة المتحكمات", icon: CircuitBoard, restricted: false },
  { id: "library", label: "المكتبة العامة", icon: Library, restricted: false },
  { id: "lab", label: "المختبر التجريبي", icon: Microscope, restricted: false },
  { id: "directory", label: "دليل المستخدمين", icon: Users, restricted: false },
  { id: "hisn", label: "حصن المسلم", icon: BookOpen, restricted: false },
  { id: "features", label: "المميزات", icon: Zap, restricted: false },
  { id: "notifications", label: "التنبيهات", icon: Bell, restricted: false },
  { id: "settings", label: "الإعدادات", icon: Settings, restricted: false },
  { id: "admin", label: "لوحة الإدارة", icon: ShieldCheck, restricted: true },
];

export function getVisibleNavItems(user: any, settings: any, navItems: NavItem[], isAuthenticated: boolean = true) {
  const managementRoles = ['founder', 'cofounder', 'admin', 'management'];
  const hasAdminAccess = isAuthenticated && user && managementRoles.includes(user.role);
  
  const isBeta = (id: string) => settings?.sections?.[id]?.isBeta ?? false;

  return navItems.filter(item => {
    if (item.restricted && !hasAdminAccess) return false;
    if (isBeta(item.id) && !hasAdminAccess) return false;
    return true;
  });
}
