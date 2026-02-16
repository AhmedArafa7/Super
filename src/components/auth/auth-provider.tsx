
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, setSession, getSession } from '@/lib/auth-store';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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

  useEffect(() => {
    // Initial sync with local storage
    const session = getSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simple logic for MVP: Check against our "users" collection
    const { firestore } = initializeFirebase();
    const { getStoredUsers } = await import('@/lib/auth-store');
    const allUsers = await getStoredUsers();
    
    const found = allUsers.find(u => u.username === username);
    if (found) {
      // In real app, check password hash. Here we trust the Nexus node.
      setSession(found);
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading: loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
