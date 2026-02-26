# NexusAI - Neural Ecosystem

هذا هو النظام العصبي المتكامل NexusAI، مجهز للعمل على منصة Cloudflare Pages كبيئة إنتاج ربحية فائقة السرعة.

## 🚀 خطوات النشر على Cloudflare Pages (هام جداً)

لضمان نجاح المزامنة، يجب ضبط الإعدادات التالية بدقة في لوحة تحكم Cloudflare:

1. **إعدادات البناء (Build Settings)**:
   - **Framework Preset**: اختر `Next.js`.
   - **Build Command**: `npm run pages:build`  <-- (تأكد من وجود كلمة pages)
   - **Build Directory**: `.vercel/output/static`

2. **إعدادات النشر (Deployment Settings)**:
   - **تنبيه حرج**: تأكد من أن خانة **"Deploy command"** فارغة تماماً. لا تضع أي شيء فيها، لأن Cloudflare تتولى النشر تلقائياً.

3. **متغيرات البيئة (Environment Variables)**:
   - قم بنسخ جميع القيم من ملف `.env` إلى إعدادات Cloudflare.
   - أضف `NODE_VERSION = 20`.

4. **توافق Node.js**:
   - اذهب إلى **Settings > Functions > Compatibility flags**.
   - أضف العلم `nodejs_compat` للإنتاج والمعاينة.

## 🛠 الأوامر البرمجية
- `npm run dev`: لتشغيل البيئة التطويرية محلياً.
- `npm run pages:build`: لبناء النسخة المتوافقة مع Cloudflare (استخدام محول @cloudflare/next-on-pages).
- `npm run preview`: لمعاينة نسخة Cloudflare محلياً باستخدام Wrangler.

## 🛡 البروتوكولات النشطة
- **Neural Storage**: نظام التخزين المقطوع (Segmented Storage) مع التنظيف الذكي.
- **Sovereign Faith**: محرك القرآن الكريم المطور مع التفسير الميسر ومواقيت الصلاة.
- **Market Engine**: سوق الأصول البرمجية بنظام الضمان (Escrow).
