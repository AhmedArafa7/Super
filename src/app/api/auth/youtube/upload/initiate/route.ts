import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore/lite';
import { firebaseConfig } from '@/firebase/config';

export const runtime = 'edge';

function getAdminFirestore() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, description, privacyStatus } = await request.json();
    const clientID = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const linkedAccounts = userData.linkedAccounts || [];
    let ytAccount = linkedAccounts.find((acc: any) => acc.platform === 'youtube');

    if (!ytAccount || !ytAccount.accessToken) {
      return NextResponse.json({ error: 'YouTube account not linked' }, { status: 404 });
    }

    // Token Refresh Logic
    let currentAccessToken = ytAccount.accessToken;
    const isExpired = ytAccount.expiresAt && Date.now() > (ytAccount.expiresAt - 5 * 60 * 1000);

    if (isExpired && ytAccount.refreshToken) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientID!,
          client_secret: clientSecret!,
          refresh_token: ytAccount.refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.error) {
        currentAccessToken = tokens.access_token;
        ytAccount.accessToken = currentAccessToken;
        ytAccount.expiresAt = Date.now() + (tokens.expires_in * 1000);
        const updatedAccounts = linkedAccounts.map((acc: any) => 
          acc.platform === 'youtube' ? ytAccount : acc
        );
        await updateDoc(userRef, { linkedAccounts: updatedAccounts });
      }
    }

    // Initiate Resumable Upload on YouTube
    const youtubeRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentAccessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*', // Could be more specific if we want
      },
      body: JSON.stringify({
        snippet: {
          title,
          description: description || '',
          categoryId: '22' // Default category: People & Blogs
        },
        status: {
          privacyStatus: privacyStatus || 'unlisted',
          selfDeclaredMadeForKids: false
        }
      })
    });

    if (!youtubeRes.ok) {
      const errorData = await youtubeRes.json();
      console.error('YouTube Initiate Upload Error:', errorData);
      return NextResponse.json({ error: 'YouTube API error', details: errorData }, { status: youtubeRes.status });
    }

    // The resumable upload URL is in the "Location" header
    const uploadUrl = youtubeRes.headers.get('Location');

    return NextResponse.json({ success: true, uploadUrl });

  } catch (error: any) {
    console.error('Upload Initiate Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
