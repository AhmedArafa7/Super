
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, setSession, getSession, addUser, getStoredUsers } from '@/lib/auth-store';
import { initializeFirebase } from '@/firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      const session = getSession();
      setUser(session);
    };
    
    // الاستماع لتحديثات الهوية لمزامنة الصورة الشخصية والبيانات فوراً
    window.addEventListener('auth-update', handleUpdate);
    
    // Initial sync with local storage
    const session = getSession();
    if (session) setUser(session);
    setLoading(false);

    return () => window.removeEventListener('auth-update', handleUpdate);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const allUsers = await getStoredUsers();
      const found = allUsers.find(u => u.username === username);
      if (found) {
        // In real app, check password hash. Here we trust the Nexus node.
        setSession(found);
        setUser(found);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login Error:", err);
      return false;
    }
  };

  const register = async (username: string, name: string): Promise<boolean> => {
    try {
      const allUsers = await getStoredUsers();
      const exists = allUsers.find(u => u.username === username);
      if (exists) return false;

      const newUser = await addUser({
        username,
        name,
        role: 'user',
        avatar_url: `https://picsum.photos/seed/${username}/100/100`
      });

      setSession(newUser);
      setUser(newUser);
      return true;
    } catch (err) {
      console.error("Registration Error:", err);
      return false;
    }
  };

  const logout = () => {
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading: loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
