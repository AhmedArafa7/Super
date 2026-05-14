import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const WHAPI_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHAPI_URL = process.env.WHATSAPP_API_URL || 'https://gate.whapi.cloud';

/**
 * [STABILITY_ANCHOR: WHATSAPP_QR_FETCH_V1.0]
 * جلب رمز QR حقيقي من Whapi لعرضه في واجهة المستخدم.
 */
export async function GET(request: NextRequest) {
  try {
    if (!WHAPI_TOKEN) {
      return NextResponse.json({ error: 'WhatsApp API Token is missing' }, { status: 500 });
    }

    // طلب صورة الـ QR من Whapi
    // ملاحظة: قد يتطلب مسار جلب الـ QR في Whapi تحديد نوع المخرجات (Base64 أو Image)
    const response = await fetch(`${WHAPI_URL}/users/login`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch QR from Whapi');
    }

    // Whapi يعيد عادةً الـ QR بصيغة Base64 أو رابط صورة
    const data = await response.json();
    
    // سنقوم بإرسال الـ QR للفرونت إند
    return NextResponse.json({ 
      qrCode: data.qr_code || data.qr || null,
      status: data.status || 'waiting'
    });

  } catch (error: any) {
    console.error('Whapi QR Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
