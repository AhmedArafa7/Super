'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import { addNotification } from './notification-store';
import { toast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'purchase_hold' | 'purchase_release' | 'purchase_refund';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  relatedId?: string;
  timestamp: string;
}

export type PendingTransactionStatus = 'pending_sync' | 'failed_needs_action';

export interface PendingTransaction {
  id: string;
  buyerId: string; // Hard-linked to the user node
  productId: string;
  price: number;
  title: string;
  timestamp: string;
  status: PendingTransactionStatus;
  errorReason?: string;
  idempotencyKey: string; // Prevents double-spending on retries
}

export interface Wallet {
  userId: string;
  balance: number;
  frozenBalance: number;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  pendingTransactions: PendingTransaction[];
  isLoading: boolean;
  isSyncing: boolean;
  
  // Actions
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  initiateEscrow: (buyerId: string, itemId: string, itemName: string, price: number) => Promise<{ success: boolean; newBalance?: number }>;
  processOfflineQueue: (currentUserId: string) => Promise<void>;
  depositFunds: (userId: string, amount: number) => Promise<boolean>;
  removePendingTransaction: (id: string) => void;
  retryTransaction: (userId: string, transactionId: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      transactions: [],
      pendingTransactions: [],
      isLoading: false,
      isSyncing: false,

      fetchWallet: async (userId) => {
        if (!userId) return;
        try {
          const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            const { data: newData, error: createError } = await supabase
              .from('wallets')
              .insert([{ user_id: userId, balance: 0, frozen_balance: 0 }])
              .select()
              .single();
            if (createError) throw createError;
            set({ wallet: mapWalletFromDB(newData) });
          } else {
            set({ wallet: mapWalletFromDB(data) });
          }
        } catch (err: any) {
          console.error('Wallet sync failure:', err.message);
          set({ wallet: { userId, balance: 0, frozenBalance: 0 } });
        }
      },

      fetchTransactions: async (userId) => {
        if (!userId) return;
        try {
          const { data: txs, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (txError) throw txError;
          set({ transactions: (txs || []).map(mapTransactionFromDB) });
        } catch (err: any) {
          console.error('Transaction fetch failure:', err.message);
        }
      },

      initiateEscrow: async (buyerId, itemId, itemName, price) => {
        set({ isLoading: true });
        
        // Generate a cryptographically secure idempotency key at the moment of intent
        const idempotencyKey = crypto.randomUUID();

        if (!navigator.onLine) {
          const newPending: PendingTransaction = {
            id: Math.random().toString(36).substring(2, 15),
            buyerId, // Locked to this specific user node
            productId: itemId,
            price: Number(price),
            title: itemName,
            timestamp: new Date().toISOString(),
            status: 'pending_sync',
            idempotencyKey
          };
          
          set(state => ({
            pendingTransactions: [...state.pendingTransactions, newPending],
            isLoading: false
          }));

          toast({
            title: "⚠️ Internet Lost",
            description: "Neural link offline. Acquisition added to pending queue."
          });
          
          return { success: true };
        }

        try {
          const { data, error } = await supabase.rpc('secure_purchase_item', {
            p_buyer_id: buyerId,
            p_product_id: itemId,
            p_idempotency_key: idempotencyKey
          });

          if (error) throw error;

          if (data.success === false) {
            toast({ 
              variant: 'destructive', 
              title: 'Acquisition Refused', 
              description: data.error || 'Server rejected the transaction.' 
            });
            set({ isLoading: false });
            return { success: false };
          }

          set(state => ({
            wallet: state.wallet ? { ...state.wallet, balance: Number(data.new_balance) } : null
          }));
          
          await get().fetchTransactions(buyerId);
          
          toast({ 
            title: "Acquisition Initialized", 
            description: `Funds for "${itemName}" moved to Secure Escrow.` 
          });

          set({ isLoading: false });
          return { success: true, newBalance: Number(data.new_balance) };
        } catch (err: any) {
          toast({ 
            variant: 'destructive', 
            title: 'Neural Link Error', 
            description: 'Failed to communicate with the transaction node.' 
          });
          set({ isLoading: false });
          return { success: false };
        }
      },

      processOfflineQueue: async (currentUserId) => {
        const { pendingTransactions, isSyncing } = get();
        
        // Safety check: ensure currentUserId is a valid string, not an Event object
        if (typeof currentUserId !== 'string' || !currentUserId) return;
        if (isSyncing || pendingTransactions.length === 0) return;

        // Filter ONLY transactions belonging to the current user
        const userTasks = pendingTransactions.filter(t => 
          t.buyerId === currentUserId && t.status === 'pending_sync'
        );
        
        if (userTasks.length === 0) return;

        set({ isSyncing: true });
        
        const successIds: string[] = [];
        const failedUpdates: Record<string, { status: PendingTransactionStatus; reason?: string }> = {};

        // Sequential processing for atomic credit integrity
        for (const tx of userTasks) {
          try {
            const { data, error } = await supabase.rpc('secure_purchase_item', {
              p_buyer_id: currentUserId,
              p_product_id: tx.productId,
              p_idempotency_key: tx.idempotencyKey
            });

            // If success OR if the server reports it was already processed (conflict on idempotency key)
            if (!error && data?.success) {
              successIds.push(tx.id);
            } else if (data?.success === false) {
              // Handle known business logic errors
              if (data.error?.toLowerCase().includes('insufficient') || data.error?.toLowerCase().includes('balance')) {
                failedUpdates[tx.id] = { 
                  status: 'failed_needs_action', 
                  reason: 'Insufficient Funds' 
                };
              }
            }
          } catch (err) {
            console.error(`Sync failure for task ${tx.id}:`, err);
            // On network error, we keep status as 'pending_sync' for future auto-retry
          }
        }

        set((state) => ({
          pendingTransactions: state.pendingTransactions
            .filter((tx) => !successIds.includes(tx.id))
            .map((tx) => failedUpdates[tx.id] ? { ...tx, ...failedUpdates[tx.id] } : tx),
          isSyncing: false
        }));
        
        await get().fetchWallet(currentUserId);
        await get().fetchTransactions(currentUserId);
      },

      depositFunds: async (userId, amount) => {
        if (!userId || amount <= 0) return false;
        set({ isLoading: true });
        try {
          const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
          const currentBalance = Number(walletData?.balance || 0);
          const newBalance = currentBalance + Number(amount);

          const { error: walletError } = await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('user_id', userId);

          if (walletError) throw walletError;

          await supabase.from('transactions').insert([{
            user_id: userId,
            amount: Number(amount),
            type: 'deposit',
            status: 'completed',
            description: `Manual Neural Deposit (+${amount})`
          }]);

          addNotification({
            type: 'market_restock',
            title: 'Credits Received',
            message: `A neural deposit of ${amount} credits was synchronized.`,
            userId,
            priority: 'info'
          });

          await get().fetchWallet(userId);
          set({ isLoading: false });
          return true;
        } catch (err: any) {
          toast({ variant: 'destructive', title: 'Deposit Failed', description: err.message });
          set({ isLoading: false });
          return false;
        }
      },

      removePendingTransaction: (id) => {
        set(state => ({
          pendingTransactions: state.pendingTransactions.filter(t => t.id !== id)
        }));
      },

      retryTransaction: async (userId, transactionId) => {
        set(state => ({
          pendingTransactions: state.pendingTransactions.map(t => 
            t.id === transactionId ? { ...t, status: 'pending_sync', errorReason: undefined } : t
          )
        }));
        await get().processOfflineQueue(userId);
      }
    }),
    {
      name: 'nexus-wallet-storage',
      partialize: (state) => ({ pendingTransactions: state.pendingTransactions }),
    }
  )
);

const mapWalletFromDB = (w: any): Wallet => ({
  userId: w?.user_id ?? w?.userId ?? '',
  balance: Number(w?.balance ?? 0),
  frozenBalance: Number(w?.frozen_balance ?? w?.frozenBalance ?? 0)
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: String(t?.id ?? ''),
  userId: t?.user_id ?? t?.userId ?? '',
  amount: Number(t?.amount ?? 0),
  type: (t?.type as TransactionType) ?? 'deposit',
  status: (t?.status as 'pending' | 'completed' | 'failed') ?? 'failed',
  description: t?.description ?? 'Neural transaction',
  relatedId: t?.related_id ?? t?.relatedId ?? undefined,
  timestamp: t?.created_at ?? t?.timestamp ?? new Date().toISOString()
});

export const selectTotalPendingDebt = (state: WalletState) => 
  state.pendingTransactions.reduce((acc, tx) => acc + Number(tx.price), 0);

export const getWallet = async (userId: string) => {
  const store = useWalletStore.getState();
  await store.fetchWallet(userId);
  return store.wallet!;
};

export const getTransactions = async (userId: string) => {
  const store = useWalletStore.getState();
  await store.fetchTransactions(userId);
  return useWalletStore.getState().transactions;
};

export const initiateEscrow = (buyerId: string, itemId: string, itemName: string, price: number) => 
  useWalletStore.getState().initiateEscrow(buyerId, itemId, itemName, price);

export const depositFunds = (userId: string, amount: number) => 
  useWalletStore.getState().depositFunds(userId, amount);
