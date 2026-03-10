'use client';

import { 
  signInWithRedirect, 
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

export const signInWithGoogle = async () => {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  return signInWithRedirect(auth, provider);
};

export const signInWithGithub = async () => {
  const { auth } = initializeFirebase();
  const provider = new GithubAuthProvider();
  return signInWithRedirect(auth, provider);
};

export const signInWithCredentials = async (username: string, securityCode: string) => {
  const { auth } = initializeFirebase();
  const email = `${username}${VIRTUAL_DOMAIN}`;
  return signInWithEmailAndPassword(auth, email, securityCode);
};

export const signUpWithCredentials = async (username: string, securityCode: string) => {
  const { auth } = initializeFirebase();
  const email = `${username}${VIRTUAL_DOMAIN}`;
  return createUserWithEmailAndPassword(auth, email, securityCode);
};

export const logoutFromFirebase = async () => {
  const { auth } = initializeFirebase();
  await signOut(auth);
  setSession(null);
};
