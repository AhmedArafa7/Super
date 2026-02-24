
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, setSession, getSession, addUser, getStoredUsers, 
  ensureUserProfile, logoutFromFirebase, signInWithGoogle, signInWithGithub 
} from '@/lib/auth-store';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  register: (username: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = initializeFirebase();
    
    // مراقبة حالة Firebase Auth
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // العودة للنخاع لجلب بيانات الملف الشخصي
        const profile = await ensureUserProfile(firebaseUser);
        setSession(profile);
        setUser(profile);
      } else {
        // التحقق من الجلسة القديمة (المستخدمون التقليديون بالاسم)
        const session = getSession();
        setUser(session);
      }
      setLoading(false);
    });

    const handleUpdate = () => {
      const session = getSession();
      setUser(session);
    };
    
    window.addEventListener('auth-update', handleUpdate);
    
    return () => {
      unsubscribeAuth();
      window.removeEventListener('auth-update', handleUpdate);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const allUsers = await getStoredUsers();
      const found = allUsers.find(u => u.username === username);
      if (found) {
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

  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  };

  const loginWithGithub = async () => {
    try {
      await signInWithGithub();
    } catch (err) {
      console.error("Github Login Error:", err);
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

  const logout = async () => {
    await logoutFromFirebase();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      loginWithGoogle,
      loginWithGithub,
      register, 
      logout, 
      isLoading: loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
