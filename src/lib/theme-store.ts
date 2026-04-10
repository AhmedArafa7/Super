'use client';

/**
 * [STABILITY_ANCHOR: THEME_STORE_V1.0]
 * نظام التصميمات المركزي - المصدر الوحيد للحقيقة لجميع عمليات التصميم.
 * كل تصميم له slug ثابت ومعروف يُستخدم في كل مكان بدلاً من معرفات Firestore العشوائية.
 */

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { updateUserProfile } from './auth-store';
import { User } from './auth/types';

// ─── Theme Definition ────────────────────────────────────────────────
export interface ThemeDefinition {
    /** معرف ثابت ومعروف للتصميم (يُستخدم في كل مكان) */
    slug: string;
    /** اسم التصميم المعروض للمستخدم */
    name: string;
    /** وصف مختصر */
    description: string;
    /** هل يدعم الوضعين (فاتح/ليلي)؟ */
    supportsDarkMode: boolean;
    /** هل هو التصميم الافتراضي المجاني المتاح دون شراء؟ */
    isDefault: boolean;
    /** سعر التصميم في المتجر (0 = مجاني) */
    storePrice: number;
    
    // --- خصائص مولد الواجهات الديناميكية (No-Code Builder) ---
    /** محرك الرندر المناسب لهذا التصميم (الشريط الجانبي، العلوي، الخ) */
    layoutEngine?: 'nexus' | 'dulms';
    /** لوحة الألوان المخصصة (إن وجدت) */
    customColors?: {
        primary?: string;     // e.g. #3b82f6
        background?: string;  // e.g. #0f111a
    };
    /** معرف المستخدم صانع التصميم (للثيمات المجتمعية) */
    authorId?: string;
}

// ─── Theme Registry (المسجل المركزي) ─────────────────────────────────
// كل تصميم جديد يُضاف هنا أولاً. هذا هو المصدر الوحيد للحقيقة.
export const THEME_REGISTRY: ThemeDefinition[] = [
    {
        slug: 'nexus',
        name: 'Nexus (الافتراضي)',
        description: 'الواجهة الذكية الافتراضية الخاصة بالنظام الزجاجي.',
        supportsDarkMode: false, // Nexus ليلي دائماً
        isDefault: true,
        storePrice: 0,
        layoutEngine: 'nexus',
    },
    {
        slug: 'dulms',
        name: 'جامعة الدلتا (DULMS)',
        description: 'تصميم مطابق بالكامل لنظام إدارة التعلم الخاص بجامعة الدلتا. يدعم الوضع الليلي والفاتح.',
        supportsDarkMode: true,
        isDefault: false,
        storePrice: 0,
        layoutEngine: 'dulms',
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────

/** الحصول على تعريف تصميم بواسطة الـ slug */
export const getThemeBySlug = (slug: string): ThemeDefinition | undefined =>
    THEME_REGISTRY.find(t => t.slug === slug);

/** الحصول على التصميم الافتراضي */
export const getDefaultTheme = (): ThemeDefinition =>
    THEME_REGISTRY.find(t => t.isDefault) || THEME_REGISTRY[0];

/** الحصول على التصميمات التي يمتلكها المستخدم */
export const getOwnedThemes = (user: User | null): ThemeDefinition[] => {
    const ownedSlugs = user?.ownedThemes || ['nexus'];
    return THEME_REGISTRY.filter(t => ownedSlugs.includes(t.slug));
};

/** الحصول على التصميمات المتاحة للشراء (غير مملوكة) */
export const getAvailableThemes = (user: User | null): ThemeDefinition[] => {
    const ownedSlugs = user?.ownedThemes || ['nexus'];
    return THEME_REGISTRY.filter(t => !t.isDefault && !ownedSlugs.includes(t.slug));
};

/** الحصول على الـ slug الخاص بالتصميم المفعّل حالياً */
export const getActiveThemeSlug = (user: User | null): string =>
    user?.activeTheme || 'nexus';

/** هل التصميم المعطى يدعم الوضع الليلي؟ */
export const activeThemeSupportsDarkMode = (user: User | null): boolean => {
    const theme = getThemeBySlug(getActiveThemeSlug(user));
    return theme?.supportsDarkMode ?? false;
};

// ─── Actions (عمليات تغيير الحالة) ───────────────────────────────────

/** تفعيل تصميم معين (يحفظ الـ slug في Firestore) */
export const activateTheme = async (userId: string, slug: string): Promise<void> => {
    const theme = getThemeBySlug(slug);
    if (!theme) throw new Error(`Theme "${slug}" not found in registry`);
    await updateUserProfile(userId, { activeTheme: slug });
};

/** شراء تصميم وإضافته لقائمة الممتلكات */
export const purchaseTheme = async (userId: string, slug: string, currentOwned: string[]): Promise<void> => {
    const theme = getThemeBySlug(slug);
    if (!theme) throw new Error(`Theme "${slug}" not found in registry`);
    if (currentOwned.includes(slug)) return; // بالفعل مملوك
    await updateUserProfile(userId, { ownedThemes: [...currentOwned, slug] });
};

/** تبديل الوضع الليلي/الفاتح */
export const toggleThemeMode = async (userId: string, mode: 'light' | 'dark'): Promise<void> => {
    await updateUserProfile(userId, { themeMode: mode });
};

// ─── Store Seeding (بذر المتجر) ──────────────────────────────────────

/** التأكد من وجود جميع التصميمات في المتجر (products collection) */
export const ensureThemeProductsExist = async (): Promise<void> => {
    const { firestore } = initializeFirebase();
    const productsRef = collection(firestore, 'products');

    for (const theme of THEME_REGISTRY) {
        if (theme.isDefault) continue; // التصميم الافتراضي لا يحتاج منتج في المتجر

        // البحث عن المنتج بالـ slug
        const q = query(productsRef, where('themeSlug', '==', theme.slug));
        const snap = await getDocs(q);

        if (snap.empty) {
            // إضافة المنتج تلقائياً
            await addDoc(productsRef, {
                title: theme.name,
                description: theme.description,
                price: theme.storePrice,
                sellerId: 'nexus_system',
                mainCategory: 'themes',
                subCategory: 'ui_themes',
                themeSlug: theme.slug,
                stockQuantity: 999999,
                status: 'active',
                currency: 'Credits',
                createdAt: new Date().toISOString(),
            });
        }
    }
};
