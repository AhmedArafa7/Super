'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, setSession, getSession, addUser, getStoredUsers, 
  ensureUserProfile, logoutFromFirebase, signInWithGoogle, signInWithGithub,
  signInWithCredentials, signUpWithCredentials
} from '@/lib/auth-store';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  register: (username: string, name: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  youtubeToken: string | null;
  setYoutubeToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);

  useEffect(() => {
    // استعادة توكن يوتيوب من sessionStorage إذا وجد
    const savedToken = sessionStorage.getItem('yt_access_token');
    if (savedToken) setYoutubeToken(savedToken);

    const { auth } = initializeFirebase();
    
    // مراقبة حالة Firebase Auth - المصدر الوحيد للحقيقة
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await ensureUserProfile(firebaseUser);
          setSession(profile);
          setUser(profile);
        } catch (err) {
          console.error("Profile Sync Error:", err);
          setUser(null);
        }
      } else {
        // إذا لم يكن هناك مستخدم سحابي، يتم مسح الجلسة فوراً لمنع أخطاء التصاريح
        setSession(null);
        setUser(null);
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
      await signInWithCredentials(username, password);
      // التحديث سيتم تلقائياً عبر onAuthStateChanged
      return true;
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

  const register = async (username: string, name: string, password?: string): Promise<boolean> => {
    try {
      // 1. إنشاء الحساب في Firebase Auth أولاً
      const userCredential = await signUpWithCredentials(username, password || "nexus123456");
      const firebaseUser = userCredential.user;

      // 2. إنشاء الملف الشخصي المرتبط بالـ UID الصحيح
      const newUser: User = {
        id: firebaseUser.uid,
        username,
        name,
        role: 'free',
        avatar_url: `https://picsum.photos/seed/${username}/100/100`,
        classification: 'none',
        proResponsesRemaining: 0,
        proTTSRemaining: 0,
        canManageCredits: false,
        dataConsent: 'none'
      };

      await addUser(newUser);
      return true;
    } catch (err) {
      console.error("Registration Error:", err);
      return false;
    }
  };

  const logout = async () => {
    await logoutFromFirebase();
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
      isLoading: loading,
      youtubeToken,
      setYoutubeToken: (token: string | null) => {
        setYoutubeToken(token);
        if (token) sessionStorage.setItem('yt_access_token', token);
        else sessionStorage.removeItem('yt_access_token');
      }
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
