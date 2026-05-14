import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore/lite';
import { firebaseConfig } from '@/firebase/config';

export const runtime = 'edge';

function getAdminFirestore() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

/**
 * [STABILITY_ANCHOR: WHATSAPP_WEBHOOK_V1.0]
 * مسار استقبال الرسائل من خدمات الواتساب الخارجية.
 * يدعم استقبال النص، الصور، ومعلومات المرسل.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firestore = getAdminFirestore();

    // Whapi Payload: { "messages": [ { "from": "...", "text": { "body": "..." }, ... } ] }
    const message = body.messages?.[0];
    
    if (!message || !message.text?.body) {
      return NextResponse.json({ status: 'ignored' });
    }

    const from = message.from;
    const text = message.text.body;
    const senderName = message.from_name || from;

    // البحث عن مستخدم ليتم توجيه الرسالة له (هنا نفترض المستخدم الأول في النظام للتجربة)
    // في الإنتاج، يجب استخدام Whapi Instance ID لربط الرسالة بالمستخدم الصحيح
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('role', '==', 'founder'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'No founder user found to receive message' }, { status: 404 });
    }

    const userId = querySnapshot.docs[0].id;
    await saveMessage(firestore, userId, from, text, senderName);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function saveMessage(firestore: any, userId: string, from: string, text: string, name: string) {
  // حفظ الرسالة في مجموعة الرسائل الخاصة بالمستخدم
  const messagesRef = collection(firestore, 'users', userId, 'messages');
  await addDoc(messagesRef, {
    from,
    name,
    text,
    timestamp: serverTimestamp(),
    source: 'whatsapp',
    type: 'incoming',
    status: 'unread'
  });

  // تحديث قائمة جهات اتصال الواتساب في مستند المستخدم
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    whatsappContacts: arrayUnion({
      id: from,
      name,
      lastMessage: text,
      lastTimestamp: Date.now(),
      platform: 'whatsapp'
    })
  });
}
