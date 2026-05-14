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

    // 1. استخراج بيانات الرسالة (تختلف حسب المزود، هنا نستخدم نمطاً عاماً)
    // نفترض أن الرسالة تحتوي على: sender_number, message_text, instance_id (المربوط بالمستخدم)
    const { from, body: text, instanceId, senderName } = body;

    if (!from || !text) {
      return NextResponse.json({ status: 'ignored' });
    }

    // 2. البحث عن المستخدم المالك لهذا الـ Instance في Firestore
    // (يجب أن يكون المستخدم قد ربط حسابه وحصل على InstanceId)
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('whatsappInstanceId', '==', instanceId || 'test_instance'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // للتجربة فقط: سنحاول البحث عن مستخدم "founder" إذا لم نجد InstanceId محدد
      const founderQ = query(usersRef, where('role', '==', 'founder'));
      const founderSnap = await getDocs(founderQ);
      if (founderSnap.empty) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      
      const userId = founderSnap.docs[0].id;
      await saveMessage(firestore, userId, from, text, senderName || from);
    } else {
      const userId = querySnapshot.docs[0].id;
      await saveMessage(firestore, userId, from, text, senderName || from);
    }

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
