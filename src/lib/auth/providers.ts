'use client';

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { setSession } from './session';

/**
 * [STABILITY_ANCHOR: CLOUD_PROVIDERS_V2.0]
 * محرك المصادقة السحابية الموحد - يدعم الدخول بالمعرف والرمز السري عبر Firebase.
 */

const VIRTUAL_DOMAIN = "@nexusai.local";

/**
 * [UTILITY: SANITIZE_USERNAME]
 * Transforms usernames to a format compatible with Firebase emails (no spaces, lowercase).
 */
export const sanitizeUsername = (username: string) => {
  return username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

export const signInWithGoogle = async () => {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const linkYouTubeAccount = async () => {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  // Upgrade to full YouTube scope for bi-directional sync (likes, comments, subscriptions)
  provider.addScope('https://www.googleapis.com/auth/youtube');
  provider.setCustomParameters({
    access_type: 'offline',
    prompt: 'consent'
  });
  return signInWithPopup(auth, provider);
};

export const signInWithGithub = async () => {
  const { auth } = initializeFirebase();
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithCredentials = async (username: string, securityCode: string) => {
  const { auth } = initializeFirebase();
  const cleanUsername = sanitizeUsername(username);
  const email = `${cleanUsername}${VIRTUAL_DOMAIN}`;
  return signInWithEmailAndPassword(auth, email, securityCode);
};

export const signUpWithCredentials = async (username: string, securityCode: string) => {
  const { auth } = initializeFirebase();
  const cleanUsername = sanitizeUsername(username);
  const email = `${cleanUsername}${VIRTUAL_DOMAIN}`;
  return createUserWithEmailAndPassword(auth, email, securityCode);
};

export const logoutFromFirebase = async () => {
  const { auth } = initializeFirebase();
  await signOut(auth);
  setSession(null);
};
