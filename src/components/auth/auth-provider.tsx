
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getSession, setSession } from '@/lib/auth-store';
import { supabase } from '@/lib/supabaseClient';

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
      if (!session || !session.id) {
        setUser(null);
        return;
      }

      // Hardening: Verify orphaned account status against real DB
      // Use maybeSingle to prevent exceptions if row is missing
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.id)
        .maybeSingle();

      if (error || !data) {
        if (error) console.warn('Database connection warning during session check:', error.message);
        setSession(null);
        setUser(null);
      } else {
        setUser(data as User);
      }
    } catch (err) {
      console.error('Session verification critical failure:', err);
      setUser(null);
    } finally {
      // Small delay to ensure state propagates before UI reveals
      setTimeout(() => setLoading(false), 100);
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
      
      if (error) {
        console.error('Login database error:', error.message);
        return false;
      }

      if (data) {
        const userData = data as User;
        setSession(userData);
        setUser(userData);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login process exception:', err);
      return false;
    }
  };

  const logout = () => {
    try {
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Logout cleanup error:', err);
    }
  };

  const contextValue = { 
    user, 
    isAuthenticated: !!user, 
    login, 
    logout,
    isLoading: loading 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest animate-pulse">Initializing Neural Link...</p>
          </div>
        </div>
      ) : children}
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
