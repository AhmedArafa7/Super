import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export const runtime = 'edge';

function getAdminFirestore() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserID is required' }, { status: 400 });
  }

  try {
    const firestore = getAdminFirestore();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const linkedAccounts = userData.linkedAccounts || [];
    
    // Find YouTube account
    let ytAccount = linkedAccounts.find((acc: any) => acc.platform === 'youtube');
    
    if (!ytAccount || !ytAccount.accessToken) {
      // Fallback for old implementations or missing token
      return NextResponse.json({ error: 'YouTube account not linked properly' }, { status: 404 });
    }

    // Check if token is expired (adding a 5-minute buffer)
    const isExpired = ytAccount.expiresAt && Date.now() > (ytAccount.expiresAt - 5 * 60 * 1000);
    let currentAccessToken = ytAccount.accessToken;

    if (isExpired && ytAccount.refreshToken) {
      console.log('Refreshing YouTube token for user:', userId);
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.YOUTUBE_CLIENT_ID!,
          client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
          refresh_token: ytAccount.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await tokenRes.json();
      
      if (!tokens.error) {
        currentAccessToken = tokens.access_token;
        ytAccount.accessToken = currentAccessToken;
        ytAccount.expiresAt = Date.now() + (tokens.expires_in * 1000);
        if (tokens.refresh_token) {
           ytAccount.refreshToken = tokens.refresh_token;
        }
        
        // Update Firestore with new token
        const updatedAccounts = linkedAccounts.map((acc: any) => 
          acc.platform === 'youtube' ? ytAccount : acc
        );
        await updateDoc(userRef, { linkedAccounts: updatedAccounts });
      }
    }

    // Fetch Stats from YouTube
    const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', {
      headers: { Authorization: `Bearer ${currentAccessToken}` }
    });
    
    if (!ytRes.ok) {
       // If still fails, token might be completely revoked
       throw new Error('Failed to fetch from YouTube API');
    }

    const ytData = await ytRes.json();
    const channel = ytData.items?.[0];

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const stats = channel.statistics;
    
    return NextResponse.json({
      success: true,
      data: {
        viewCount: stats.viewCount || "0",
        subscriberCount: stats.subscriberCount || "0",
        videoCount: stats.videoCount || "0",
        hiddenSubscriberCount: stats.hiddenSubscriberCount || false
      }
    });

  } catch (error: any) {
    console.error('YouTube Stats Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
