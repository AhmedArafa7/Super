
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, setSession, getSession, mapUserFromDB } from '@/lib/auth-store';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const verifySession = async () => {
    setLoading(true);
    try {
      const session = getSession();
      if (!session?.id) {
        setUser(null);
        return;
      }

      // Hardening: Verify session against definitive user table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.id)
        .maybeSingle();

      if (error) {
        toast({ variant: 'destructive', title: 'Sync Error', description: 'Neural link unstable.' });
        throw error;
      }

      if (!data) {
        // Orphaned session: Logout immediately for security
        setSession(null);
        setUser(null);
      } else {
        setUser(mapUserFromDB(data));
      }
    } catch (err) {
      setUser(null);
    } finally {
      // Ensure state propagation before UI reveal
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
    
    const handleAuthUpdate = () => verifySession();
    window.addEventListener('auth-update', handleAuthUpdate);
    return () => window.removeEventListener('auth-update', handleAuthUpdate);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (!username || !password) return false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();
      
      if (error) throw error;

      if (data) {
        const userData = mapUserFromDB(data);
        setSession(userData);
        setUser(userData);
        return true;
      }
      return false;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Authentication Failed', description: err.message });
      return false;
    }
  };

  const logout = () => {
    setSession(null);
    setUser(null);
  };

  const contextValue = { 
    user, 
    isAuthenticated: !!user, 
    login, 
    logout,
    isLoading: loading 
  };

  // BLOCKING BARRIER: Do not render children until loading is complete
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest animate-pulse">Establishing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
