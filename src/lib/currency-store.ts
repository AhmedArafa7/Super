'use client';

import { initializeFirebase } from '@/firebase';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc,
    addDoc, deleteDoc, query, where, orderBy
} from 'firebase/firestore';

// ============================================================================
// [STABILITY_ANCHOR: CURRENCY_STORE_V1.0]
// نظام العملات المتعدد - تعريف العملات، مكتبة الشروط، وإدارة فك التجميد.
// ============================================================================

// --- Currency Definitions ---

export type RealCurrencyCode = 'EGC' | 'DLC' | 'MDC' | 'GMC' | 'BKC';
export type saveCurrencyCode = 'EGC_save' | 'DLC_save' | 'MDC_save' | 'GMC_save' | 'BKC_save';
export type CurrencyCode = RealCurrencyCode | saveCurrencyCode;

export interface CurrencyDefinition {
    code: CurrencyCode;
    name: string;
    nameAr: string;
    issave: boolean;
    realCounterpart?: RealCurrencyCode; // for save coins: which real coin it maps to
    color: string;
    icon: string; // emoji or icon key
}

export const CURRENCIES: CurrencyDefinition[] = [
    // Real Coins
    { code: 'EGC', name: 'Egyptian Coin', nameAr: 'العملة المصرية', issave: false, color: 'emerald', icon: '🇪🇬' },
    { code: 'DLC', name: 'Dollar Coin', nameAr: 'عملة الدولار', issave: false, color: 'green', icon: '💵' },
    { code: 'MDC', name: 'Media Coin', nameAr: 'عملة الميديا', issave: false, color: 'blue', icon: '🎬' },
    { code: 'GMC', name: 'Game Coin', nameAr: 'عملة الألعاب', issave: false, color: 'purple', icon: '🎮' },
    { code: 'BKC', name: 'Back Coin', nameAr: 'عملة الباك', issave: false, color: 'amber', icon: '🔙' },
    // save (Internal) Coins
    { code: 'EGC_save', name: 'Egyptian Coin (Internal)', nameAr: 'المصرية (داخلي)', issave: true, realCounterpart: 'EGC', color: 'emerald', icon: '🇪🇬' },
    { code: 'DLC_save', name: 'Dollar Coin (Internal)', nameAr: 'الدولار (داخلي)', issave: true, realCounterpart: 'DLC', color: 'green', icon: '💵' },
    { code: 'MDC_save', name: 'Media Coin (Internal)', nameAr: 'الميديا (داخلي)', issave: true, realCounterpart: 'MDC', color: 'blue', icon: '🎬' },
    { code: 'GMC_save', name: 'Game Coin (Internal)', nameAr: 'الألعاب (داخلي)', issave: true, realCounterpart: 'GMC', color: 'purple', icon: '🎮' },
    { code: 'BKC_save', name: 'Back Coin (Internal)', nameAr: 'الباك (داخلي)', issave: true, realCounterpart: 'BKC', color: 'amber', icon: '🔙' },
];

export const REAL_CURRENCIES = CURRENCIES.filter(c => !c.issave);
export const save_CURRENCIES = CURRENCIES.filter(c => c.issave);
export const ALL_CURRENCY_CODES: CurrencyCode[] = CURRENCIES.map(c => c.code);

export const getCurrencyDef = (code: CurrencyCode): CurrencyDefinition | undefined =>
    CURRENCIES.find(c => c.code === code);

// --- Condition Library ---

export type ConditionType = 'tasks_completed' | 'sales_target' | 'time_served' | 'approval_required' | 'custom';

export interface UnfreezeConditionTemplate {
    id: string;
    label: string;
    labelAr: string;
    description: string;
    type: ConditionType;
    /** Optional numeric threshold (e.g. "complete 10 tasks" → threshold = 10) */
    threshold?: number;
    createdBy: string; // founder ID
    createdAt: string;
}

export interface UserUnfreezeRule {
    id: string;
    userId: string;
    currencyCode: saveCurrencyCode;
    conditionId: string; // references UnfreezeConditionTemplate.id
    conditionLabel: string; // denormalized for display
    status: 'pending' | 'fulfilled' | 'waived';
    activatedBy: string; // admin who activated this rule
    activatedAt: string;
    fulfilledAt?: string;
}

export interface EscalationRequest {
    id: string;
    description: string;
    suggestedCondition: string;
    requestedBy: string; // admin ID
    requestedByName: string;
    status: 'pending_founder' | 'approved' | 'rejected';
    founderNotes?: string;
    createdAt: string;
}

// --- Condition Library CRUD ---

/**
 * جلب مكتبة الشروط الكاملة
 */
export const getConditionLibrary = async (): Promise<UnfreezeConditionTemplate[]> => {
    const { firestore } = initializeFirebase();
    try {
        const snap = await getDocs(collection(firestore, 'condition_library'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnfreezeConditionTemplate));
    } catch (e) {
        console.error('Condition Library Fetch Error:', e);
        return [];
    }
};

/**
 * إضافة شرط جديد للمكتبة (المؤسس فقط)
 */
export const addConditionTemplate = async (
    template: Omit<UnfreezeConditionTemplate, 'id' | 'createdAt'>
): Promise<string> => {
    const { firestore } = initializeFirebase();
    const ref = await addDoc(collection(firestore, 'condition_library'), {
        ...template,
        createdAt: new Date().toISOString()
    });
    return ref.id;
};

/**
 * حذف شرط من المكتبة
 */
export const removeConditionTemplate = async (id: string): Promise<void> => {
    const { firestore } = initializeFirebase();
    await deleteDoc(doc(firestore, 'condition_library', id));
};

// --- Per-User Unfreeze Rules ---

/**
 * جلب شروط فك التجميد لمستخدم معين
 */
export const getUserUnfreezeRules = async (userId: string): Promise<UserUnfreezeRule[]> => {
    const { firestore } = initializeFirebase();
    try {
        const snap = await getDocs(collection(firestore, 'users', userId, 'unfreeze_rules'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserUnfreezeRule));
    } catch (e) {
        console.error('User Unfreeze Rules Fetch Error:', e);
        return [];
    }
};

/**
 * تفعيل شرط معين لموظف (الأدمن)
 */
export const activateConditionForUser = async (
    userId: string,
    currencyCode: saveCurrencyCode,
    conditionId: string,
    conditionLabel: string,
    adminId: string
): Promise<void> => {
    const { firestore } = initializeFirebase();
    await addDoc(collection(firestore, 'users', userId, 'unfreeze_rules'), {
        userId,
        currencyCode,
        conditionId,
        conditionLabel,
        status: 'pending',
        activatedBy: adminId,
        activatedAt: new Date().toISOString()
    } as Omit<UserUnfreezeRule, 'id'>);
};

/**
 * تحديث حالة شرط (fulfilled / waived)
 */
export const updateUnfreezeRuleStatus = async (
    userId: string,
    ruleId: string,
    status: 'fulfilled' | 'waived'
): Promise<void> => {
    const { firestore } = initializeFirebase();
    await updateDoc(doc(firestore, 'users', userId, 'unfreeze_rules', ruleId), {
        status,
        fulfilledAt: new Date().toISOString()
    });
};

/**
 * حذف شرط من مستخدم
 */
export const removeUserUnfreezeRule = async (userId: string, ruleId: string): Promise<void> => {
    const { firestore } = initializeFirebase();
    await deleteDoc(doc(firestore, 'users', userId, 'unfreeze_rules', ruleId));
};

/**
 * فحص هل التحويل من save → Real مسموح (كل الشروط fulfilled أو waived)
 */
export const canConvertsaveToReal = async (
    userId: string,
    saveCurrencyCode: saveCurrencyCode
): Promise<{ allowed: boolean; pendingConditions: UserUnfreezeRule[] }> => {
    const rules = await getUserUnfreezeRules(userId);
    const relevantRules = rules.filter(r => r.currencyCode === saveCurrencyCode);

    // لو مفيش شروط أصلاً، التحويل مقيد (يحتاج الأدمن يحدد الشروط أول)
    if (relevantRules.length === 0) {
        return { allowed: false, pendingConditions: [] };
    }

    const pendingConditions = relevantRules.filter(r => r.status === 'pending');
    return {
        allowed: pendingConditions.length === 0,
        pendingConditions
    };
};

// --- Escalation Requests ---

/**
 * إرسال طلب تصعيد (أدمن → مؤسس)
 */
export const createEscalationRequest = async (
    request: Omit<EscalationRequest, 'id' | 'status' | 'createdAt'>
): Promise<void> => {
    const { firestore } = initializeFirebase();
    await addDoc(collection(firestore, 'escalation_requests'), {
        ...request,
        status: 'pending_founder',
        createdAt: new Date().toISOString()
    });
};

/**
 * جلب طلبات التصعيد
 */
export const getEscalationRequests = async (): Promise<EscalationRequest[]> => {
    const { firestore } = initializeFirebase();
    try {
        const snap = await getDocs(collection(firestore, 'escalation_requests'));
        const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as EscalationRequest));
        return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
        console.error('Escalation Fetch Error:', e);
        return [];
    }
};

/**
 * معالجة طلب تصعيد (المؤسس)
 */
export const resolveEscalationRequest = async (
    id: string,
    status: 'approved' | 'rejected',
    founderNotes?: string
): Promise<void> => {
    const { firestore } = initializeFirebase();
    await updateDoc(doc(firestore, 'escalation_requests', id), {
        status,
        founderNotes: founderNotes || ''
    });
};

// --- Default Balances ---

/**
 * إنشاء أرصدة افتراضية فارغة لكل العملات
 */
export const createEmptyBalances = (): Record<CurrencyCode, number> => {
    const balances: Record<string, number> = {};
    ALL_CURRENCY_CODES.forEach(code => { balances[code] = 0; });
    return balances as Record<CurrencyCode, number>;
};
