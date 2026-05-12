import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  const clientID = process.env.YOUTUBE_CLIENT_ID;
  const redirectURI = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/auth/youtube/callback`;
  
  if (!clientID || !userId) {
    return NextResponse.json({ error: 'Configuration or UserID missing' }, { status: 400 });
  }

  // الصلاحيات المطلوبة: إدارة القناة، عرض الإحصائيات، ورفع الفيديوهات
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ');

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${clientID}` +
    `&redirect_uri=${encodeURIComponent(redirectURI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&access_type=offline` + // مهم جداً للحصول على Refresh Token
    `&state=${userId}` +
    `&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
