
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getSession, setSession, getStoredUsers } from '@/lib/auth-store';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      setUser(getSession());
      setLoading(false);
    };

    initAuth();
    window.addEventListener('auth-update', initAuth);
    return () => window.removeEventListener('auth-update', initAuth);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const users = getStoredUsers();
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      setSession(foundUser);
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {!loading && children}
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
