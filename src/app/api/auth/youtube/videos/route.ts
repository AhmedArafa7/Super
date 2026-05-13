import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore/lite';
import { firebaseConfig } from '@/firebase/config';

export const runtime = 'edge';

function getAdminFirestore() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const clientID = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!userId) {
    return NextResponse.json({ error: 'UserID is required' }, { status: 400 });
  }

  if (!clientID || !clientSecret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
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
          client_id: clientID,
          client_secret: clientSecret,
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

    // 1. Get the "Uploads" playlist ID
    const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', {
      headers: { Authorization: `Bearer ${currentAccessToken}` }
    });
    const channelData = await channelRes.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json({ success: true, videos: [] });
    }

    // 2. Get videos from that playlist
    const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=10&playlistId=${uploadsPlaylistId}`, {
      headers: { Authorization: `Bearer ${currentAccessToken}` }
    });
    const videosData = await videosRes.json();

    const videos = videosData.items?.map((item: any) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      // We'll need another call for views, but for now we have basic info
    })) || [];

    return NextResponse.json({ success: true, videos });

  } catch (error: any) {
    console.error('YouTube Videos Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
