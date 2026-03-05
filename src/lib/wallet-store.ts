'use client';

import { create } from 'zustand';
import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, addDoc, collectionGroup, limit, DocumentSnapshot
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import {
  CurrencyCode, ALL_CURRENCY_CODES, createEmptyBalances,
  getCurrencyDef, canConvertFakeToReal, FakeCurrencyCode
} from './currency-store';

// ============================================================================
// [STABILITY_ANCHOR: WALLET_STORE_V2.0]
// النظام المالي المحدث - يدعم عملات متعددة مع توافق عكسي للبيانات القديمة.
// ============================================================================

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase_hold' | 'purchase_release' | 'purchase_refund' | 'conversion';

export interface Transaction {
  id: string;
  userId?: string;
  amount: number;
  type: TransactionType;
  currency: CurrencyCode;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  timestamp: string;
  /** For conversion transactions */
  toCurrency?: CurrencyCode;
  toAmount?: number;
}

export interface PendingTransaction {
  id: string;
  title: string;
  price: number;
  currency: CurrencyCode;
  status: 'pending_sync' | 'failed_needs_action';
  timestamp: string;
  errorReason?: string;
}

export interface Wallet {
  /** Multi-currency balances */
  balances: Record<CurrencyCode, number>;
  /** Multi-currency frozen balances */
  frozenBalances: Record<CurrencyCode, number>;
  /** @deprecated Legacy single-currency field — auto-migrated on first read */
  balance?: number;
  /** @deprecated Legacy single-currency field — auto-migrated on first read */
  frozenBalance?: number;
  /** @deprecated Legacy field */
  currency?: string;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  pendingTransactions: PendingTransaction[];
  isLoading: boolean;
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<Transaction[]>;
  adjustFunds: (userId: string, amount: number, type: TransactionType, currency?: CurrencyCode) => Promise<boolean>;
  convertCurrency: (userId: string, fromCurrency: CurrencyCode, toCurrency: CurrencyCode, amount: number) => Promise<boolean>;
  removePendingTransaction: (id: string) => void;
  retryTransaction: (userId: string, id: string) => Promise<void>;
  addPendingTransaction: (tx: PendingTransaction) => void;
}

/**
 * هجرة البيانات القديمة (عملة واحدة) إلى النظام الجديد (عملات متعددة)
 */
const migrateWalletData = (data: any): Wallet => {
  // لو البيانات فيها balances يبقى النظام الجديد
  if (data.balances && typeof data.balances === 'object') {
    // Ensure all currencies exist
    const balances = { ...createEmptyBalances(), ...data.balances };
    const frozenBalances = { ...createEmptyBalances(), ...(data.frozenBalances || {}) };
    return { balances, frozenBalances };
  }

  // Legacy: migrate old balance/frozenBalance to EGC
  const balances = createEmptyBalances();
  const frozenBalances = createEmptyBalances();

  if (typeof data.balance === 'number') {
    balances['EGC'] = data.balance;
  }
  if (typeof data.frozenBalance === 'number') {
    frozenBalances['EGC'] = data.frozenBalance;
  }

  return { balances, frozenBalances };
};

/**
 * هجرة المعاملة القديمة لتشمل حقل العملة
 */
const migrateTransaction = (data: any): Transaction => ({
  ...data,
  currency: data.currency || 'EGC',
});

export const useWalletStore = create<WalletState>()(
  (set, get) => ({
    wallet: null,
    transactions: [],
    pendingTransactions: [],
    isLoading: false,

    fetchWallet: async (userId) => {
      const { firestore } = initializeFirebase();
      try {
        const walletRef = doc(firestore, 'users', userId, 'wallet', 'main');
        const snap = await getDoc(walletRef);
        if (snap.exists()) {
          const rawData = snap.data();
          const migrated = migrateWalletData(rawData);

          // Auto-save migrated format if old format detected
          if (!rawData.balances) {
            await setDoc(walletRef, migrated);
          }

          set({ wallet: migrated });
        } else {
          const initial: Wallet = {
            balances: createEmptyBalances(),
            frozenBalances: createEmptyBalances()
          };
          await setDoc(walletRef, initial);
          set({ wallet: initial });
        }
      } catch (err) {
        console.error('Wallet Fetch Error:', err);
      }
    },

    fetchTransactions: async (userId) => {
      const { firestore } = initializeFirebase();
      try {
        const txRef = collection(firestore, 'users', userId, 'transactions');
        const q = query(txRef, orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        const txs = snap.docs.map(d => migrateTransaction({ id: d.id, ...d.data() }));
        set({ transactions: txs });
        return txs;
      } catch (err) {
        console.error('Transactions Fetch Error:', err);
        return [];
      }
    },

    adjustFunds: async (userId, amount, type, currency = 'EGC') => {
      const { firestore } = initializeFirebase();
      try {
        const walletRef = doc(firestore, 'users', userId, 'wallet', 'main');
        const snap = await getDoc(walletRef);
        if (!snap.exists()) return false;

        const current = migrateWalletData(snap.data());
        const bal = current.balances[currency] || 0;
        const frz = current.frozenBalances[currency] || 0;
        let newBalance = bal;
        let newFrozen = frz;

        if (type === 'deposit') newBalance += amount;
        else if (type === 'withdrawal') { if (bal < amount) return false; newBalance -= amount; }
        else if (type === 'purchase_hold') { if (bal < amount) return false; newBalance -= amount; newFrozen += amount; }
        else if (type === 'purchase_release') { if (frz < amount) return false; newFrozen -= amount; }
        else if (type === 'purchase_refund') { newBalance += amount; newFrozen -= amount; }

        const updatedBalances = { ...current.balances, [currency]: newBalance };
        const updatedFrozen = { ...current.frozenBalances, [currency]: newFrozen };

        await updateDoc(walletRef, {
          balances: updatedBalances,
          frozenBalances: updatedFrozen
        });

        // [STABILITY_ANCHOR: SYNCED_TRANSACTION_LOG]
        await addDoc(collection(firestore, 'users', userId, 'transactions'), {
          userId,
          amount: (type === 'deposit' || type === 'purchase_release') ? amount : -amount,
          type,
          currency,
          status: 'completed',
          description: `Neural Action: ${type.replace('_', ' ')} [${currency}]`,
          timestamp: new Date().toISOString()
        });

        await get().fetchWallet(userId);
        await get().fetchTransactions(userId);
        return true;
      } catch (err) {
        console.error("Adjustment Error:", err);
        return false;
      }
    },

    convertCurrency: async (userId, fromCurrency, toCurrency, amount) => {
      const { firestore } = initializeFirebase();

      const fromDef = getCurrencyDef(fromCurrency);
      const toDef = getCurrencyDef(toCurrency);
      if (!fromDef || !toDef) return false;

      // فحص التحويل من Fake → Real: يحتاج فك تجميد
      if (fromDef.isFake && !toDef.isFake) {
        const { allowed, pendingConditions } = await canConvertFakeToReal(
          userId,
          fromCurrency as FakeCurrencyCode
        );
        if (!allowed) {
          toast({
            variant: 'destructive',
            title: 'التحويل مجمّد',
            description: `يوجد ${pendingConditions.length} شرط/شروط لم تتحقق بعد لفك تجميد ${fromDef.nameAr}.`
          });
          return false;
        }
      }

      try {
        const walletRef = doc(firestore, 'users', userId, 'wallet', 'main');
        const snap = await getDoc(walletRef);
        if (!snap.exists()) return false;

        const current = migrateWalletData(snap.data());
        const fromBal = current.balances[fromCurrency] || 0;

        if (fromBal < amount) {
          toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: `لا يوجد رصيد كافٍ من ${fromDef.nameAr}.` });
          return false;
        }

        // 1:1 conversion rate (same value between real/fake of same type)
        const toAmount = amount;

        const updatedBalances = {
          ...current.balances,
          [fromCurrency]: fromBal - amount,
          [toCurrency]: (current.balances[toCurrency] || 0) + toAmount
        };

        await updateDoc(walletRef, { balances: updatedBalances });

        // Log conversion transaction
        await addDoc(collection(firestore, 'users', userId, 'transactions'), {
          userId,
          amount: -amount,
          type: 'conversion',
          currency: fromCurrency,
          toCurrency,
          toAmount,
          status: 'completed',
          description: `تحويل ${amount} ${fromDef.nameAr} → ${toAmount} ${toDef.nameAr}`,
          timestamp: new Date().toISOString()
        });

        await get().fetchWallet(userId);
        await get().fetchTransactions(userId);
        return true;
      } catch (err) {
        console.error("Conversion Error:", err);
        return false;
      }
    },

    addPendingTransaction: (tx) => set(state => ({ pendingTransactions: [tx, ...state.pendingTransactions] })),
    removePendingTransaction: (id) => set(state => ({ pendingTransactions: state.pendingTransactions.filter(t => t.id !== id) })),

    retryTransaction: async (userId, id) => {
      const tx = get().pendingTransactions.find(t => t.id === id);
      if (!tx) return;
      const success = await get().adjustFunds(userId, tx.price, 'purchase_hold', tx.currency || 'EGC' as CurrencyCode);
      if (success) get().removePendingTransaction(id);
    }
  })
);

// --- Admin Helpers ---

export const getAllTransactionsAdmin = async (
  limitSize = 100
): Promise<{ transactions: Transaction[], lastVisible: DocumentSnapshot | null }> => {
  const { firestore } = initializeFirebase();
  try {
    const q = query(collectionGroup(firestore, 'transactions'), limit(limitSize));
    const snap = await getDocs(q);
    let transactions = snap.docs.map(d => migrateTransaction({ id: d.id, ...d.data() }));
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { transactions, lastVisible: null };
  } catch (e) {
    console.error("Admin Ledger Fetch Error:", e);
    return { transactions: [], lastVisible: null };
  }
};

// --- Selectors ---

export const selectTotalPendingDebt = (state: { pendingTransactions: PendingTransaction[] }) =>
  state.pendingTransactions.reduce((acc, curr) => acc + curr.price, 0);

/** Helper to get balance for a specific currency */
export const selectCurrencyBalance = (wallet: Wallet | null, currency: CurrencyCode): number =>
  wallet?.balances?.[currency] || 0;

/** Helper to get frozen balance for a specific currency */
export const selectCurrencyFrozen = (wallet: Wallet | null, currency: CurrencyCode): number =>
  wallet?.frozenBalances?.[currency] || 0;

/** Sum all real coin balances */
export const selectTotalRealBalance = (wallet: Wallet | null): number => {
  if (!wallet?.balances) return 0;
  return (['EGC', 'DLC', 'MDC', 'GMC', 'BKC'] as CurrencyCode[])
    .reduce((sum, code) => sum + (wallet.balances[code] || 0), 0);
};

/** Sum all fake coin balances */
export const selectTotalFakeBalance = (wallet: Wallet | null): number => {
  if (!wallet?.balances) return 0;
  return (['EGC_FAKE', 'DLC_FAKE', 'MDC_FAKE', 'GMC_FAKE', 'BKC_FAKE'] as CurrencyCode[])
    .reduce((sum, code) => sum + (wallet.balances[code] || 0), 0);
};

// --- Backward-compatible exports ---
export const getTransactions = (userId: string) => useWalletStore.getState().fetchTransactions(userId);
export const adjustFunds = (userId: string, amount: number, type: TransactionType, currency: CurrencyCode = 'EGC') =>
  useWalletStore.getState().adjustFunds(userId, amount, type, currency);
