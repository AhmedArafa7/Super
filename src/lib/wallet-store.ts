'use client';

import { create } from 'zustand';
import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, orderBy, addDoc, collectionGroup, limit, startAfter, DocumentSnapshot
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase_hold' | 'purchase_release' | 'purchase_refund';

export interface Transaction {
  id: string;
  userId?: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  timestamp: string;
}

export interface PendingTransaction {
  id: string;
  title: string;
  price: number;
  status: 'pending_sync' | 'failed_needs_action';
  timestamp: string;
  errorReason?: string;
}

export interface Wallet {
  balance: number;
  frozenBalance: number;
  currency: string;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  pendingTransactions: PendingTransaction[];
  isLoading: boolean;
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<Transaction[]>;
  adjustFunds: (userId: string, amount: number, type: TransactionType) => Promise<boolean>;
  removePendingTransaction: (id: string) => void;
  retryTransaction: (userId: string, id: string) => Promise<void>;
  addPendingTransaction: (tx: PendingTransaction) => void;
}

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
          set({ wallet: snap.data() as Wallet });
        } else {
          const initial = { balance: 0, frozenBalance: 0, currency: 'Credits' };
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
        const q = query(txRef, orderBy('timestamp', 'desc'), limit(30));
        const snap = await getDocs(q);
        const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        set({ transactions: txs });
        return txs;
      } catch (err) {
        console.error('Transactions Fetch Error:', err);
        return [];
      }
    },

    adjustFunds: async (userId, amount, type) => {
      const { firestore } = initializeFirebase();
      try {
        const walletRef = doc(firestore, 'users', userId, 'wallet', 'main');
        const snap = await getDoc(walletRef);
        if (!snap.exists()) return false;

        const current = snap.data() as Wallet;
        let newBalance = current.balance;
        let newFrozen = current.frozenBalance;

        if (type === 'deposit') newBalance += amount;
        else if (type === 'withdrawal') { if (current.balance < amount) return false; newBalance -= amount; }
        else if (type === 'purchase_hold') { if (current.balance < amount) return false; newBalance -= amount; newFrozen += amount; }
        else if (type === 'purchase_release') { if (current.frozenBalance < amount) return false; newFrozen -= amount; }
        else if (type === 'purchase_refund') { newBalance += amount; newFrozen -= amount; }

        await updateDoc(walletRef, { balance: newBalance, frozenBalance: newFrozen });
        
        // [STABILITY_ANCHOR: SYNCED_TRANSACTION_LOG]
        // نضع userId داخل المستند لضمان عمل قواعد الـ Collection Group
        await addDoc(collection(firestore, 'users', userId, 'transactions'), {
          userId: userId,
          amount: (type === 'deposit' || type === 'purchase_release') ? amount : -amount,
          type: type,
          status: 'completed',
          description: `Neural Action: ${type.replace('_', ' ')}`,
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

    addPendingTransaction: (tx) => set(state => ({ pendingTransactions: [tx, ...state.pendingTransactions] })),
    removePendingTransaction: (id) => set(state => ({ pendingTransactions: state.pendingTransactions.filter(t => t.id !== id) })),

    retryTransaction: async (userId, id) => {
      const tx = get().pendingTransactions.find(t => t.id === id);
      if (!tx) return;
      const success = await get().adjustFunds(userId, tx.price, 'purchase_hold');
      if (success) get().removePendingTransaction(id);
    }
  })
);

export const getAllTransactionsAdmin = async (
  limitSize = 100
): Promise<{ transactions: Transaction[], lastVisible: DocumentSnapshot | null }> => {
  const { firestore } = initializeFirebase();
  try {
    const q = query(collectionGroup(firestore, 'transactions'), limit(limitSize));
    const snap = await getDocs(q);
    let transactions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    // الفرز برمجياً لضمان الدقة وتجنب الحاجة لفهارس مركبة معقدة
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { transactions, lastVisible: null };
  } catch (e) {
    console.error("Admin Ledger Fetch Error:", e);
    return { transactions: [], lastVisible: null };
  }
};

export const selectTotalPendingDebt = (state: { pendingTransactions: PendingTransaction[] }) => 
  state.pendingTransactions.reduce((acc, curr) => acc + curr.price, 0);

export const getTransactions = (userId: string) => useWalletStore.getState().fetchTransactions(userId);
export const adjustFunds = (userId: string, amount: number, type: TransactionType) => useWalletStore.getState().adjustFunds(userId, amount, type);
