/**
 * [STABILITY_ANCHOR: DATE_UTILS_V1.0]
 * محرك تنسيق الوقت النسبي بأسلوب يوتيوب الاحترافي.
 */

export function getRelativeTime(dateStr?: string, fallback: string = "حديثاً"): string {
  if (!dateStr || dateStr === "حديثاً" || dateStr === "اليوم") return fallback;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return fallback;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // التعامل مع التواريخ المستقبلية أو اللحظية
  if (diffInSeconds < 30) return "منذ لحظات";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // تنسيق الدقائق
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return "قبل دقيقة واحدة";
    if (diffInMinutes === 2) return "قبل دقيقتين";
    if (diffInMinutes <= 10) return `قبل ${diffInMinutes} دقائق`;
    return `قبل ${diffInMinutes} دقيقة`;
  }

  // تنسيق الساعات
  if (diffInHours < 24) {
    if (diffInHours === 1) return "قبل ساعة واحدة";
    if (diffInHours === 2) return "قبل ساعتين";
    if (diffInHours <= 10) return `قبل ${diffInHours} ساعات`;
    return `قبل ${diffInHours} ساعة`;
  }

  // تنسيق الأيام
  if (diffInDays < 7) {
    if (diffInDays === 1) return "قبل يوم واحد";
    if (diffInDays === 2) return "قبل يومين";
    return `قبل ${diffInDays} أيام`;
  }

  // تنسيق الأسابيع
  if (diffInWeeks < 4) {
    if (diffInWeeks === 1) return "قبل أسبوع واحد";
    if (diffInWeeks === 2) return "قبل أسبوعين";
    return `قبل ${diffInWeeks} أسابيع`;
  }

  // تنسيق الشهور
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return "قبل شهر واحد";
    if (diffInMonths === 2) return "قبل شهرين";
    if (diffInMonths <= 10) return `قبل ${diffInMonths} أشهر`;
    return `قبل ${diffInMonths} شهر`;
  }

  // تنسيق السنوات
  if (diffInYears === 1) return "قبل سنة واحدة";
  if (diffInYears === 2) return "قبل سنتين";
  if (diffInYears <= 10) return `قبل ${diffInYears} سنوات`;
  return `قبل ${diffInYears} سنة`;
}
