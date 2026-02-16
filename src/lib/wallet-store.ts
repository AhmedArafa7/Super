
'use client';

import { create } from 'zustand';
import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase_hold' | 'purchase_release' | 'purchase_refund';

export interface Transaction {
  id: string;
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
  fetchTransactions: (userId: string) => Promise<void>;
  adjustFunds: (userId: string, amount: number, type: 'deposit' | 'withdrawal') => Promise<boolean>;
  processOfflineQueue: (userId: string) => Promise<void>;
  removePendingTransaction: (id: string) => void;
  retryTransaction: (userId: string, id: string) => Promise<void>;
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
          const initial = { balance: 1000, frozenBalance: 0, currency: 'Credits' };
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
        const q = query(txRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        set({ transactions: txs });
      } catch (err) {
        console.error('Transactions Fetch Error:', err);
      }
    },

    adjustFunds: async (userId, amount, type) => {
      const { firestore } = initializeFirebase();
      try {
        const walletRef = doc(firestore, 'users', userId, 'wallet', 'main');
        const snap = await getDoc(walletRef);
        if (!snap.exists()) return false;

        const current = snap.data() as Wallet;
        const finalAmount = type === 'deposit' ? amount : -amount;
        const newBalance = current.balance + finalAmount;

        await updateDoc(walletRef, { balance: newBalance });
        
        await addDoc(collection(firestore, 'users', userId, 'transactions'), {
          amount: finalAmount,
          type: type,
          status: 'completed',
          description: type === 'deposit' ? 'Administrative Deposit' : 'Administrative Deduction',
          timestamp: new Date().toISOString()
        });

        await get().fetchWallet(userId);
        await get().fetchTransactions(userId);
        return true;
      } catch (err) {
        console.error('Adjustment error:', err);
        return false;
      }
    },

    processOfflineQueue: async (userId) => {
      // منطق المزامنة عند العودة للاتصال
      const { pendingTransactions } = get();
      if (pendingTransactions.length === 0) return;
      
      console.log('Synchronizing offline node transactions...');
      // في نموذجنا الأولي، سنحاول معالجة أول عملية معلقة
      // هذا مجرد هيكل، المزامنة الحقيقية تتم عبر retry
    },

    removePendingTransaction: (id) => {
      set(state => ({
        pendingTransactions: state.pendingTransactions.filter(t => t.id !== id)
      }));
    },

    retryTransaction: async (userId, id) => {
      const tx = get().pendingTransactions.find(t => t.id === id);
      if (!tx) return;

      const success = await get().adjustFunds(userId, tx.price, 'withdrawal');
      if (success) {
        get().removePendingTransaction(id);
        toast({ title: "Acquisition Finalized", description: `"${tx.title}" has been successfully synchronized.` });
      } else {
        toast({ variant: "destructive", title: "Sync Failed", description: "Insufficient credits in the neural node." });
      }
    }
  })
);

// Selectors
export const selectTotalPendingDebt = (state: WalletState) => 
  state.pendingTransactions.reduce((acc, curr) => acc + curr.price, 0);

// Shortcuts
export const getTransactions = (userId: string) => useWalletStore.getState().fetchTransactions(userId);
export const adjustFunds = (userId: string, amount: number, type: 'deposit' | 'withdrawal') => useWalletStore.getState().adjustFunds(userId, amount, type);
