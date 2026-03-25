'use client';

import { GithubAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

/**
 * [STABILITY_ANCHOR: GITHUB_AUTH_V2.0]
 * خدمة مصادقة GitHub المتقدمة للمهندس العصبي.
 * تدعم "ربط الحساب" (Account Linking) لتفادي أخطاء Firebase عند استخدام جوجل.
 */

export const connectGitHubAccount = async () => {
  const { auth } = initializeFirebase();
  const provider = new GithubAuthProvider();
  
  // تفعيل الصلاحيات المطلوبة للمهندس العصبي
  provider.addScope('repo');
  provider.addScope('read:user');
  provider.addScope('user:email');

  const currentUser = auth.currentUser;

  try {
    let result;
    
    if (currentUser) {
      // [CASE: LINKING] - المستخدم مسجل دخوله (مثلاً بجوجل) ونريد ربط جيت هاب
      console.log("[GitHub Auth] Linking account for current user:", currentUser.email);
      result = await linkWithPopup(currentUser, provider);
    } else {
      // [CASE: SIGNIN] - المستخدم غير مسجل دخول، نقوم بتسجيل دخول جديد
      console.log("[GitHub Auth] New sign-in for GitHub");
      result = await signInWithPopup(auth, provider);
    }

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
    
    // معالجة خطأ الحساب الموجود مسبقاً بطريقة ودية
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('هذا الحساب مرتبط بمزود هوية آخر (مثل جوجل). يرجى تسجيل الدخول أولاً ثم المحاولة مرة أخرى لربط حساب GitHub.');
    }
    
    throw error;
  }
};
