
# NexusAI - الإنتاج الاحترافي

هذا النظام مجهز للعمل على منصة Cloudflare Pages كبيئة إنتاج احترافية.

## 🛡️ بروتوكول ضبط النشر (Crucial Deployment Settings)

لضمان نجاح رفع الكود وتجنب أخطاء البناء، يجب ضبط الإعدادات التالية في لوحة تحكم Cloudflare:

### 1. إعدادات البناء (Build Settings)
- **Build Command**: `npm run pages:build`
- **Build Directory**: `.vercel/output/static`

### 2. إعدادات النشر (Deploy Command) - هام جداً ⚠️
- **Deploy Command**: اترك هذه الخانة **فارغة تماماً**. 
- **لماذا؟**: إضافة أي أمر هنا (مثل wrangler deploy) سيؤدي لفشل العملية لأن النشر في Pages يتم تلقائياً بمجرد انتهاء البناء. استخدام أوامر Wrangler هنا مخصص للـ Workers فقط ويسبب تعارضاً في بيئة Pages.

### 3. المتغيرات البيئية (Environment Variables)
تأكد من إضافة المفاتيح التالية لضمان عمل كافة الوظائف:
- `GEMINI_API_KEY`: لمحرك الذكاء الاصطناعي.
- `NEXT_PUBLIC_DRIVE_API_KEY`: لمزامنة ملفات الخزنة.
- `GROQ_API_KEY`: لمحركات Groq السريعة.

## 🛠 الأوامر البرمجية
- `npm run dev`: تشغيل البيئة التطويرية.
- `npm run pages:build`: بناء النسخة المتوافقة مع Cloudflare.
- `npm run pages:preview`: المحاكاة المحلية لبيئة الحافة.
