import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const WHAPI_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHAPI_URL = process.env.WHATSAPP_API_URL || 'https://gate.whapi.cloud';

/**
 * [STABILITY_ANCHOR: WHATSAPP_SEND_WHAPI_V1.0]
 * إرسال رسائل عبر Whapi.cloud
 */
export async function POST(request: NextRequest) {
  try {
    const { to, text } = await request.json();

    if (!WHAPI_TOKEN) {
      return NextResponse.json({ error: 'WhatsApp API Token is missing' }, { status: 500 });
    }

    const response = await fetch(`${WHAPI_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typing_time: 0,
        to: to.includes('@') ? to : `${to}@c.us`,
        body: text
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message via Whapi');
    }

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('Whapi Send Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
