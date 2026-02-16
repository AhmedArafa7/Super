'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import { toast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase_hold' | 'purchase_release' | 'purchase_refund';

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  relatedOrderId?: string;
  timestamp: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  frozenBalance: number;
  currency: string;
}

export interface PendingTransaction {
  id: string;
  title: string;
  price: number;
  timestamp: string;
  status: 'pending_sync' | 'failed_needs_action';
  errorReason?: string;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  pendingTransactions: PendingTransaction[];
  isLoading: boolean;
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  adjustFunds: (userId: string, amount: number, type: 'deposit' | 'withdrawal') => Promise<boolean>;
  addPendingTransaction: (tx: PendingTransaction) => void;
  removePendingTransaction: (id: string) => void;
  retryTransaction: (userId: string, txId: string) => Promise<void>;
  processOfflineQueue: (userId: string) => Promise<void>;
}

const mapWalletFromDB = (w: any): Wallet => ({
  userId: w.user_id,
  balance: Number(w.balance || 0),
  frozenBalance: Number(w.frozen_balance || 0),
  currency: w.currency || 'Credits'
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: t.id,
  walletId: t.wallet_id,
  amount: Number(t.amount || 0),
  type: t.type as TransactionType,
  status: (t.status || 'failed') as any,
  description: t.description || '',
  relatedOrderId: t.related_order_id,
  timestamp: t.created_at
});

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      transactions: [],
      pendingTransactions: [],
      isLoading: false,

      fetchWallet: async (userId) => {
        const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
        if (!error && data) set({ wallet: mapWalletFromDB(data) });
      },

      fetchTransactions: async (userId) => {
        const { data, error } = await supabase.from('transactions').select('*').eq('wallet_id', userId).order('created_at', { ascending: false });
        if (!error) set({ transactions: (data || []).map(mapTransactionFromDB) });
      },

      adjustFunds: async (userId, amount, type) => {
        try {
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
          if (!wallet) return false;

          const finalAmount = type === 'deposit' ? amount : -amount;
          const newBalance = wallet.balance + finalAmount;

          const { error: walletError } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId);
          if (walletError) throw walletError;

          await supabase.from('transactions').insert([{
            wallet_id: userId,
            amount: finalAmount,
            type: type,
            status: 'completed',
            description: type === 'deposit' ? 'Administrative Deposit' : 'Administrative Deduction'
          }]);

          await get().fetchWallet(userId);
          await get().fetchTransactions(userId);
          return true;
        } catch (err) {
          console.error('Adjustment sync failed:', err);
          return false;
        }
      },

      addPendingTransaction: (tx) => {
        set((state) => ({
          pendingTransactions: [...state.pendingTransactions, tx]
        }));
      },

      removePendingTransaction: (id) => {
        set((state) => ({
          pendingTransactions: state.pendingTransactions.filter(t => t.id !== id)
        }));
      },

      retryTransaction: async (userId, txId) => {
        const tx = get().pendingTransactions.find(t => t.id === txId);
        if (!tx) return;

        set(state => ({
          pendingTransactions: state.pendingTransactions.map(t => 
            t.id === txId ? { ...t, status: 'pending_sync' } : t
          )
        }));

        setTimeout(async () => {
          if (navigator.onLine) {
            get().removePendingTransaction(txId);
            toast({ title: "Sync Successful", description: `Acquisition of "${tx.title}" finalized.` });
            await get().fetchWallet(userId);
          } else {
            set(state => ({
              pendingTransactions: state.pendingTransactions.map(t => 
                t.id === txId ? { ...t, status: 'failed_needs_action', errorReason: 'Network Link Unstable' } : t
              )
            }));
          }
        }, 1500);
      },

      processOfflineQueue: async (userId) => {
        const { pendingTransactions } = get();
        if (pendingTransactions.length === 0) return;

        for (const tx of pendingTransactions) {
          if (tx.status === 'pending_sync') {
            await get().retryTransaction(userId, tx.id);
          }
        }
      }
    }),
    { name: 'nexus-wallet-storage' }
  )
);

export const selectTotalPendingDebt = (state: WalletState) => 
  state.pendingTransactions.reduce((acc, tx) => acc + tx.price, 0);

export const getWallet = (userId: string) => useWalletStore.getState().fetchWallet(userId);
export const getTransactions = (userId: string) => useWalletStore.getState().fetchTransactions(userId);
export const adjustFunds = (userId: string, amount: number, type: 'deposit' | 'withdrawal') => useWalletStore.getState().adjustFunds(userId, amount, type);