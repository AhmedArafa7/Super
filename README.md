# NexusAI - Neural Ecosystem

هذا هو النظام العصبي المتكامل NexusAI، مجهز للعمل على منصة Cloudflare Pages كبيئة إنتاج ربحية فائقة السرعة.

## 🚀 خطوات النشر على Cloudflare Pages (هام جداً لنجاح البناء)

لضمان نجاح المزامنة، **يجب** ضبط الإعدادات التالية يدوياً في لوحة تحكم Cloudflare لأنها لا تتغير تلقائياً من الكود:

1. **إعدادات البناء (Build Settings)**:
   - **Framework Preset**: اختر `Next.js`.
   - **Build Command**: `npm run pages:build`
   - **Build Directory**: `.vercel/output/static`

2. **إعدادات النشر (Deployment Settings)**:
   - **تنبيه حرج**: تأكد من أن خانة **"Deploy command"** فارغة تماماً. لا تضع أي شيء فيها، لأن Cloudflare تتولى النشر تلقائياً بعد انتهاء البناء. وجود أي نص هنا سيفشل العملية.

3. **متغيرات البيئة (Environment Variables)**:
   - أضف `NODE_VERSION = 20`.
   - أضف كافة القيم الموجودة في ملف `.env` الخاص بك.

4. **توافق Node.js**:
   - اذهب إلى **Settings > Functions > Compatibility flags**.
   - أضف العلم `nodejs_compat` للإنتاج والمعاينة.

## 🛠 الأوامر البرمجية
- `npm run dev`: لتشغيل البيئة التطويرية محلياً.
- `npm run pages:build`: لبناء النسخة المتوافقة مع Cloudflare (استخدام محول @cloudflare/next-on-pages).
- `npm run build`: بناء NextJS القياسي (للمعاينة المحلية فقط).

## 🛡 البروتوكولات النشطة
- **Neural Storage**: نظام التخزين المقطوع (Segmented Storage) مع التنظيف الذكي.
- **Sovereign Faith**: محرك القرآن الكريم المطور مع التفسير الميسر ومواقيت الصلاة.
- **WeTube**: منصة البث السيادية مع الاشتراكات الخاصة.
