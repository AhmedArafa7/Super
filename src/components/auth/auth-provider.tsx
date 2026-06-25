'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, setSession, getSession, addUser, getStoredUsers, 
  ensureUserProfile, logoutFromFirebase, signInWithGoogle, signInWithGithub,
  signInWithCredentials, signUpWithCredentials, sanitizeUsername
} from '@/lib/auth-store';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
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
    
    const broadcastSessionToIframes = async (userProfile: User | null, firebaseUser: any) => {
      const iframes = document.querySelectorAll('iframe');
      if (iframes.length === 0) return;

      const payload = {
        type: 'SI_NEURO_AUTH_RESPONSE',
        user: userProfile,
        token: firebaseUser ? await firebaseUser.getIdToken() : null,
      };

      iframes.forEach(iframe => {
        if (iframe.contentWindow) {
          try {
            const url = iframe.src ? new URL(iframe.src) : null;
            if (url) {
              const allowedOrigins = ['http://localhost:4200', 'http://localhost:9002', window.location.origin];
              if (allowedOrigins.includes(url.origin)) {
                iframe.contentWindow.postMessage(payload, url.origin);
              }
            }
          } catch(e) { }
        }
      });
    };

    const handleMessage = async (event: MessageEvent) => {
      const allowedOrigins = ['http://localhost:4200', 'http://localhost:9002', window.location.origin];
      if (!allowedOrigins.includes(event.origin)) return;

      if (event.data?.type === 'SI_NEURO_AUTH_REQUEST') {
         const currentUser = getSession();
         const firebaseUser = auth.currentUser;
         event.source?.postMessage({
            type: 'SI_NEURO_AUTH_RESPONSE',
            user: currentUser,
            token: firebaseUser ? await firebaseUser.getIdToken() : null
         }, { targetOrigin: event.origin } as WindowPostMessageOptions);
      }
    };
    window.addEventListener('message', handleMessage);

    // مراقبة حالة Firebase Auth - المصدر الوحيد للحقيقة
    const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await ensureUserProfile(firebaseUser);
          setSession(profile);
          setUser(profile);
          localStorage.removeItem('manual_logout');
          await broadcastSessionToIframes(profile, firebaseUser);
        } catch (err) {
          console.error("Profile Sync Error:", err);
          setUser(null);
          await broadcastSessionToIframes(null, null);
        }
        setLoading(false);
      } else {
        const isManualLogout = localStorage.getItem('manual_logout') === 'true';
        
        if (isManualLogout) {
          // [GLOBAL_SECURITY_PURGE]
          // Clear all sensitive stores immediately on manual logout
          const { useChatStore } = await import('@/lib/chat-store');
          const { useWalletStore } = await import('@/lib/wallet-store');
          const { useNotificationStore } = await import('@/lib/notification-store');
          const { usePreferencesStore } = await import('@/lib/preferences-store');
          const { useStreamStore } = await import('@/lib/stream-store');
          
          // Resetting stores to initial state
          useChatStore.setState({ messages: [], isLoading: false });
          useWalletStore.setState({ wallet: null, transactions: [] });
          useNotificationStore.setState({ notifications: [], unreadCount: 0 });
          useStreamStore.setState({ activeVideo: null });
          
          sessionStorage.clear();
          setSession(null);
          setUser(null);
          await broadcastSessionToIframes(null, null);
          setLoading(false);
          return;
        }

        // الدخول التلقائي الخفي بدلاً من طرد المستخدم
        import('firebase/auth').then(({ signInAnonymously }) => {
            signInAnonymously(auth).catch(err => {
                console.error("Anonymous Sync Error:", err);
                setSession(null);
                setUser(null);
                setLoading(false);
            });
        });
      }
    });

    const handleUpdate = () => {
      const session = getSession();
      setUser(session);
    };
    
    window.addEventListener('auth-update', handleUpdate);
    
    return () => {
      unsubscribeAuth();
      window.removeEventListener('auth-update', handleUpdate);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      localStorage.removeItem('manual_logout');
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
      localStorage.removeItem('manual_logout');
      await signInWithGoogle();
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  };

  const loginWithGithub = async () => {
    try {
      localStorage.removeItem('manual_logout');
      await signInWithGithub();
    } catch (err) {
      console.error("Github Login Error:", err);
    }
  };

  const register = async (username: string, name: string, password?: string): Promise<boolean> => {
    try {
      localStorage.removeItem('manual_logout');
      // 1. إنشاء الحساب في Firebase Auth أولاً
      const userCredential = await signUpWithCredentials(username, password || "Si-Neuro123456");
      const firebaseUser = userCredential.user;

      // 2. إنشاء الملف الشخصي المرتبط بالـ UID الصحيح
      const newUser: User = {
        id: firebaseUser.uid,
        username: sanitizeUsername(username),
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

  const loginAnonymously = async () => {
    const { auth } = initializeFirebase();
    localStorage.removeItem('manual_logout');
    setLoading(true);
    try {
      const { signInAnonymously } = await import('firebase/auth');
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Manual Anonymous Login Error:", err);
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.setItem('manual_logout', 'true');
    await logoutFromFirebase();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      loginWithGoogle,
      loginWithGithub,
      loginAnonymously,
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
