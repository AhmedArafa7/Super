'use client';

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signOut 
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { setSession } from './session';

/**
 * [STABILITY_ANCHOR: CLOUD_PROVIDERS_V1.0]
 */

export const signInWithGoogle = async () => {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithGithub = async () => {
  const { auth } = initializeFirebase();
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logoutFromFirebase = async () => {
  const { auth } = initializeFirebase();
  await signOut(auth);
  setSession(null);
};
