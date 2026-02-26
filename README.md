# NexusAI - Neural Ecosystem

هذا هو النظام العصبي المتكامل NexusAI، مجهز للعمل على منصة Cloudflare Pages كبيئة إنتاج ربحية فائقة السرعة.

## 🛡️ بروتوكول التطوير والسيادة (Professional Protocols)

لضمان استقرار النخاع وتجنب "اضطرابات البناء" (Build Conflicts)، يجب اتباع المعايير التالية:

### 1. محاكاة بيئة الحافة (Local Edge Simulation)
بدلاً من اختبار التعديلات سحابياً، استخدم المحاكي المحلي الذي يطابق بيئة Cloudflare Pages تماماً:
- الأمر: `npm run pages:preview`
- الفائدة: يكشف أخطاء الـ Edge Runtime قبل رفع الكود.

### 2. التحكم في الصور (Image Optimization Bypass)
تم ضبط النظام ليعمل بوضع `unoptimized: true` في `next.config.ts`.
- السبب: Cloudflare Pages لا تدعم معالجة الصور عبر Node.js افتراضياً.
- النتيجة: أداء خارق واستقرار تام لجميع الوسائط البصرية.

### 3. إعدادات النشر السحابي (Cloudflare Settings)
يجب ضبط الإعدادات التالية يدوياً في لوحة تحكم Cloudflare لضمان نجاح المزامنة:
1. **Build Command**: `npm run pages:build`
2. **Build Directory**: `.vercel/output/static`
3. **Deploy Command**: (هام جداً) اترك هذه الخانة **فارغة تماماً**، النشر يتم تلقائياً.

## 🛠 الأوامر البرمجية
- `npm run dev`: تشغيل البيئة التطويرية التقليدية.
- `npm run pages:build`: بناء النسخة المتوافقة مع Cloudflare.
- `npm run pages:preview`: المحاكاة المحلية النهائية لبيئة الحافة.

## 🛡 البروتوكولات النشطة
- **Neural Storage**: نظام التخزين المقطوع (Segmented Storage) مع التنظيف الذكي.
- **Sovereign Faith**: محرك القرآن الكريم المطور مع التفسير الميسر ومواقيت الصلاة.
- **WeTube**: منصة البث السيادية مع الاشتراكات الخاصة والخصوصية العميقة.
- **Neural Optimizer**: محرك تحسين الأوامر الصامت في المختبر العصبي.