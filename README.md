# NexusAI - بيئة الإنتاج الاحترافية

## 🛡️ بروتوكول الإدارة الآمن (Manual Admin Setup)
لأغراض أمنية، لا يتم منح رتبة "المدير" تلقائياً لأي مستخدم. لكي تصبح مديراً للنظام:
1. أنشئ حساباً جديداً في التطبيق.
2. اذهب إلى **Firebase Console** -> **Firestore**.
3. ابحث عن وثيقتك في مجموعة `users`.
4. عدّل حقل `role` إلى `"founder"`.
5. عدّل حقل `canManageCredits` إلى `true`.

## ⚙️ إعدادات النشر على Cloudflare Pages
لتجنب أخطاء البناء والرفع، اتبع الإعدادات التالية بدقة:

### 1. إعدادات البناء (Build Settings)
- **Framework Preset**: `Next.js`
- **Build Command**: `npm run pages:build`
- **Build Directory**: `.vercel/output/static`

### 2. تجاوز خطأ الحقل المطلوب (Required Field)
إذا ظهر لك خطأ "Required" باللون الأحمر تحت خانة **Deploy Command** ومنعك من الحفظ:
- اكتب كلمة `true` في الخانة.
- اضغط **Update**.
- **السبب**: هذا يخبر Cloudflare بنجاح العملية دون تنفيذ أوامر خارجية تعيق عمل Pages.

### 3. المتغيرات البيئية (Variables)
تأكد من إضافة:
- `GEMINI_API_KEY`: لمحرك الذكاء الاصطناعي.
- `NEXT_PUBLIC_DRIVE_API_KEY`: لمزامنة ملفات الخزنة.
- `GROQ_API_KEY`: لمحركات Groq.

## 🛠 الأوامر المحلية
- `npm run dev`: تشغيل البيئة التطويرية.
- `npm run pages:build`: بناء نسخة Cloudflare.
