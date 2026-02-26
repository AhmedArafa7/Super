# NexusAI - Neural Ecosystem

هذا هو النظام العصبي المتكامل NexusAI، مجهز للعمل على منصة Cloudflare Pages كبيئة إنتاج ربحية فائقة السرعة.

## 🚀 خطوات النشر على Cloudflare Pages (هام جداً)

1. **الربط بـ GitHub**: ارفع الكود إلى مستودع خاص.
2. **إنشاء مشروع Pages**: من لوحة تحكم Cloudflare، اختر المشروع واربطه بالمستودع.
3. **إعدادات البناء (Build Settings)**:
   - **Framework Preset**: اختر `Next.js`.
   - **Build Command**: `npm run pages:build`
   - **Build Directory**: `.vercel/output/static`
4. **إعدادات النشر (Deployment Settings)**:
   - **تنبيه**: تأكد من أن خانة "Deploy command" فارغة تماماً. لا تضع `npx wrangler deploy`.
5. **متغيرات البيئة (Environment Variables)**:
   - قم بنسخ جميع القيم من ملف `.env` إلى إعدادات Cloudflare.
   - أضف `NODE_VERSION = 20`.
6. **توافق Node.js**:
   - اذهب إلى **Settings > Functions > Compatibility flags**.
   - أضف العلم `nodejs_compat` للإنتاج والمعاينة.

## 🛠 الأوامر البرمجية
- `npm run dev`: لتشغيل البيئة التطويرية محلياً.
- `npm run pages:build`: لبناء النسخة المتوافقة مع Cloudflare.
- `npm run preview`: لمعاينة نسخة Cloudflare محلياً باستخدام Wrangler.

## 🛡 البروتوكولات النشطة
- **Neural Storage**: نظام التخزين المقطوع (Segmented Storage) مع التنظيف الذكي.
- **Sovereign Faith**: محرك القرآن الكريم المطور مع التفسير الميسر.
- **Market Engine**: سوق الأصول البرمجية بنظام الضمان (Escrow).
