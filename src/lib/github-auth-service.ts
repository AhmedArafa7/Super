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
    
    const isGithubLinked = currentUser?.providerData.some(p => p.providerId === 'github.com');

    if (currentUser && !isGithubLinked) {
      // [CASE: LINKING] - المستخدم مسجل دخوله ونريد ربط جيت هاب لأول مرة
      try {
        console.log("[GitHub Auth] Attempting to link GitHub to current user:", currentUser.email);
        result = await linkWithPopup(currentUser, provider);
      } catch (linkError: any) {
        if (linkError.code === 'auth/credential-already-in-use') {
          console.warn("[GitHub Auth] Credential already in use, falling back to sign-in.");
          // إذا كان الحساب مرتبطاً بـ UID آخر، نقوم بتسجيل الدخول به مباشرة
          result = await signInWithPopup(auth, provider);
        } else {
          throw linkError;
        }
      }
    } else {
      // [CASE: SIGNIN / RE-AUTH] - المستخدم غير مسجل دخول أو الحساب مربوط بالفعل
      console.log("[GitHub Auth] Standard sign-in or refreshing linked token");
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
