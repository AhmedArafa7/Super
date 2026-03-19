import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const runtime = 'edge';

/**
 * [STABILITY_ANCHOR: PROXY_LOGGER_V1.0]
 * نقطة نهاية لاستقبال تقارير الأخطاء من المواقع المفتوحة عبر البروكسي.
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { firestore } = initializeFirebase();

    await addDoc(collection(firestore, 'proxy_errors'), {
      ...data,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to log pulse' }, { status: 500 });
  }
}
