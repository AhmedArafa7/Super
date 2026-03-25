'use client';

import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

/**
 * [STABILITY_ANCHOR: GITHUB_AUTH_V1.0]
 * خدمة مصادقة GitHub المتقدمة للمهندس العصبي.
 * تطلب صلاحيات 'repo' لتمكين الوكيل من القراءة والكتابة في المستودعات.
 */

export const connectGitHubAccount = async () => {
  const { auth } = initializeFirebase();
  const provider = new GithubAuthProvider();
  
  // تفعيل الصلاحيات المطلوبة للمهندس العصبي ليرى المشاريع ويعدلها
  provider.addScope('repo');
  provider.addScope('read:user');
  provider.addScope('user:email');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('تعذر الحصول على رمز الوصول من GitHub.');
    }

    return {
      user: result.user,
      accessToken: credential.accessToken,
    };
  } catch (error: any) {
    console.error('[GitHub Auth Error]', error);
    throw error;
  }
};
