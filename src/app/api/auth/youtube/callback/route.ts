import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';

export const runtime = 'edge';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore/lite';
import { firebaseConfig } from '@/firebase/config';

// تهيئة بسيطة للسيرفر (Node.js/Edge)
function getAdminFirestore() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');
  
  if (!code || !userId) {
    return NextResponse.json({ error: 'Authorization code or UserID missing' }, { status: 400 });
  }

  const clientID = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectURI = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/auth/youtube/callback`;

  try {
    // 1. تبادل الكود بالتوكنات
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientID!,
        client_secret: clientSecret!,
        redirect_uri: redirectURI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    // 2. جلب معلومات القناة الأساسية
    const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    if (!channel) throw new Error('No YouTube channel found for this account');

    // 3. تخزين البيانات في Firestore
    const firestore = getAdminFirestore();
    const userRef = doc(firestore, 'users', userId);

    const linkedAccount = {
      platform: 'youtube',
      platformUserId: channel.id,
      username: channel.snippet.title,
      avatarUrl: channel.snippet.thumbnails.default.url,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '', // قد لا يتوفر في كل مرة إلا لو طلبنا prompt=consent
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      linkedAt: new Date().toISOString(),
      scopes: tokens.scope.split(' ')
    };

    // إضافة الحساب لمصفوفة الحسابات المربوطة
    await updateDoc(userRef, {
      linkedAccounts: arrayUnion(linkedAccount)
    });

    // 4. العودة للرئيسية (أو للاستوديو)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/?tab=wetube-studio&success=youtube_linked`);

  } catch (err: any) {
    console.error('YouTube Callback Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
