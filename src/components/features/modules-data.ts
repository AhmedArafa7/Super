import {
  LayoutDashboard, MessageCircleQuestion, Clock, HeartPulse, MessageSquare, Cpu,
  HardDrive, Tag, MessageCircle, Video, ShoppingCart, GraduationCap, LibraryBig,
  Megaphone, DownloadCloud, Rocket, Wallet, Repeat, CircuitBoard, Library,
  Microscope, Users, BookOpen, Zap, Bell, Settings, ShieldCheck
} from "lucide-react";

export type ModuleCategory = 'core' | 'communication' | 'productivity' | 'learning' | 'tools' | 'management' | 'community';

export interface DetailedModule {
  id: string;
  category: ModuleCategory;
  title: string;
  shortDesc: string;
  detailedDesc: string;
  benefits: string[];
  icon: any;
  color: string;
}

export const DETAILED_MODULES: DetailedModule[] = [
  {
    id: "dashboard",
    category: "core",
    title: "لوحة التحكم الرئيسية",
    shortDesc: "المركز العصبي لحسابك وإحصاءاتك.",
    detailedDesc: "واجهة مرئية تلخص نشاطك في النظام، تعرض الأرصدة المتاحة، وسجلات المحفظة السريعة، ومراقبة حية لاستهلاك الذاكرة والبيانات.",
    benefits: ["مراقبة الاستهلاك", "الوصول السريع للأقسام النشطة", "ملخص العمليات المالية"],
    icon: LayoutDashboard,
    color: "bg-primary/20 text-primary border-primary/30"
  },
  {
    id: "qa",
    category: "community",
    title: "منصة الأسئلة والمساعدة",
    shortDesc: "اطرح أسئلتك واحصل على دعم المجتمع والذكاء الاصطناعي.",
    detailedDesc: "بوابة تفاعلية لطرح المشاكل التقنية أو الاستفسارات، حيث تتلقى إجابات موثقة ومُقيّمة من النظام والمستخدمين الخبراء.",
    benefits: ["حلول سريعة", "مساهمة في المجتمع الدائم", "دعم مدعوم بالذكاء"],
    icon: MessageCircleQuestion,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  },
  {
    id: "time",
    category: "productivity",
    title: "إدارة المهام والوقت",
    shortDesc: "نظم يومك بأسلوب احترافي.",
    detailedDesc: "أداة متقدمة لتسجيل وتتبع المهام اليومية، مع ميزة التذكير الذكي وتحليل فترات الإنتاجية لتنظيم وقتك بفعالية.",
    benefits: ["إدارة مشاريع شخصية", "تنبيهات فورية", "إحصاءات الإنجاز"],
    icon: Clock,
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
  },
  {
    id: "health",
    category: "productivity",
    title: "المسار الصحي والرياضي",
    shortDesc: "راقب لياقتك ونشاطك البدني.",
    detailedDesc: "قسم مصمم لتسجيل المؤشرات الصحية والتدريبات الرياضية، ويوفر مساراً مرئياً لتطور لياقتك مع مرور الوقت.",
    benefits: ["سجل صحي رقمي", "ميكانيكية تحفيزية", "تتبع مؤشرات الحيوية"],
    icon: HeartPulse,
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30"
  },
  {
    id: "chat",
    category: "communication",
    title: "الدردشة الذكية (AI)",
    shortDesc: "تواصل حواري مع العقل المدبر للنظام.",
    detailedDesc: "نافذة دردشة مباشرة مع الـ AI، تتيح لك طرح استفسارات معقدة، كتابة أكواد، وتوجيه أوامر للنظام بلغتك الطبيعية.",
    benefits: ["مساعد شخصي متاح 24/7", "استيعاب السياق العام للسؤال", "توليد أكواد وصيغ"],
    icon: MessageSquare,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  },
  {
    id: "agent-ai",
    category: "tools",
    title: "المهندس المساعد",
    shortDesc: "أداة هندسية لحل المشاكل التقنية المعقدة.",
    detailedDesc: "نسخة متخصصة من الذكاء الاصطناعي موجهة لحل مشاكل البرمجة والأنظمة التشغيلية العميقة. يمتلك صلاحيات أعلى لقراءة بيئة العمل.",
    benefits: ["تشخيص أخطاء دقيق", "تنفيذ عمليات خلفية", "حلول هيكلية متقدمة"],
    icon: Cpu,
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  },
  {
    id: "vault",
    category: "core",
    title: "خزنة الملفات المركزية",
    shortDesc: "مساحتك الآمنة السحابية المشفرة.",
    detailedDesc: "سحابة تخزين خاصة، تتيح لك رفع وتنظيم ملفاتك الثقيلة والمستندات بسرية تامة (E2E) مع إمكانية مشاركتها بشكل آمن.",
    benefits: ["تشفير من النهاية للنهاية", "سرعة نقل عالية", "إدارة ذكية للملفات"],
    icon: HardDrive,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30"
  },
  {
    id: "deals",
    category: "core",
    title: "العروض والتخفيضات",
    shortDesc: "استكشف أحدث الخصومات في محيطك.",
    detailedDesc: "نافذة لاكتشاف العروض والخصومات المتاحة حالياً على المنصة، سواء كانت برمجيات أو خدمات من موردين موثوقين.",
    benefits: ["توفير التكاليف", "اكتشاف خدمات جديدة", "رعايات حصرية"],
    icon: Tag,
    color: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  },
  {
    id: "peer-chat",
    category: "communication",
    title: "الاتصال المباشر (P2P)",
    shortDesc: "مراسلة آمنة مشفرة بين المستخدمين.",
    detailedDesc: "نظام دردشة مشفر من نظير لنظير، يضمن خصوصية تامة في تبادل الرسائل، الملفات، والصوتيات مع باقي العقد.",
    benefits: ["تأمين تام للبيانات", "مشاركة ملفات آمنة", "إشعارات فورية"],
    icon: MessageCircle,
    color: "bg-violet-500/20 text-violet-400 border-violet-500/30"
  },
  {
    id: "stream",
    category: "core",
    title: "WeTube Pro",
    shortDesc: "منصة مشاهدة ذكية واقتصادية.",
    detailedDesc: "نسخة خالية من الإعلانات ومدعومة بتقنيات عبقرية للشبكة، توفر حتى 40% من الباقة، وتدعم الـ Smart Cache لحفظ المحتوى.",
    benefits: ["بدون إعلانات مزعجة", "تخطي الصمت والملل تلقائياً", "تخزين المحتوى للعمل Offline"],
    icon: Video,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30"
  },
  {
    id: "market",
    category: "core",
    title: "المتجر التقني المهني",
    shortDesc: "اشترِ وبع البرمجيات والخدمات.",
    detailedDesc: "منصة تجارية تتيح للمطورين والمنتجين بيع منتجاتهم الرقمية برصيد المنصة، مع ضمان مالي (Escrow) لحماية الطرفين.",
    benefits: ["ربح مالي للمطورين", "اقتناء أدوات احترافية", "نظام حماية وسيط"],
    icon: ShoppingCart,
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  },
  {
    id: "study-ai",
    category: "learning",
    title: "الميسّر الدراسي",
    shortDesc: "حول مناهجك لاختبارات ذكية.",
    detailedDesc: "أداة توليد أسئلة أوتوماتيكية من أي ملف PDF ترفعه، تقوم باختبار مدى فهمك للمادة، مع تصحيح للمقالي وتبرير لكل الإجابات.",
    benefits: ["تحسين سرعة الحفظ والفهم", "اختبارات غير محدودة", "شرح تفصيلي للأخطاء"],
    icon: GraduationCap,
    color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30"
  },
  {
    id: "knowledge",
    category: "learning",
    title: "المكتبة المعرفية المركزية",
    shortDesc: "مركز الفهارس والأرشفة الدراسية.",
    detailedDesc: "نظام فائق التنظيم يضم المناهج، الكورسات والمحاضرات المفهرسة لسهولة الوصول والدراسة المتتالية.",
    benefits: ["جداول دراسية مرتبة", "سهولة التصفح والبحث", "حفظ مستوى التقدم"],
    icon: LibraryBig,
    color: "bg-indigo-600/20 text-indigo-500 border-indigo-600/30"
  },
  {
    id: "ads",
    category: "management",
    title: "مركز النشر والإعلان",
    shortDesc: "إدارة وتسويق المحتوى المدفوع.",
    detailedDesc: "أداة لترويج العروض والمنتجات على عموم المستخدمين بالمنصة، من خلال نظام المزايدة والتوجيه الدقيق.",
    benefits: ["توسيع نطاق المبيعات", "استهداف محدد", "إحصاءات استجابة دقيقة"],
    icon: Megaphone,
    color: "bg-lime-500/20 text-lime-400 border-lime-500/30"
  },
  {
    id: "downloads",
    category: "tools",
    title: "منطقة التحميل الآمنة",
    shortDesc: "إدارة التنزيلات المعلقة والمكتملة.",
    detailedDesc: "ترسانة التحميلات الخاصة بك، حيث تجد كل الملفات والصيغ التي طلبت توليدها أو الموافقة على سحبها من الشبكة.",
    benefits: ["متابعة حالة التحميلات", "استئناف الإيقاف", "مركزية تخزين الإخراج"],
    icon: DownloadCloud,
    color: "bg-teal-500/20 text-teal-400 border-teal-500/30"
  },
  {
    id: "launcher",
    category: "tools",
    title: "مُشغل تطبيقات (Spy-Mode)",
    shortDesc: "تشغيل وتشخيص المواقع الخارجية.",
    detailedDesc: "منطقة لعرض مواقع الويب وتطبيقاتك المصممة برمجياً ضمن إطار آمن. يحتوي على وضع تشخيصي حصري لكشف أخطاء الواجهات.",
    benefits: ["تجربة المواقع داخل النظام", "اكتشاف أخطاء UI/UX", "محاكاة آمنة للملفات"],
    icon: Rocket,
    color: "bg-primary/20 text-primary border-primary/30"
  },
  {
    id: "wallet",
    category: "core",
    title: "المحفظة العصبية والدفاتر",
    shortDesc: "إدارة الثروة الرقمية والاستهلاك.",
    detailedDesc: "دفتر الأستاذ الخاص بنشاطك المالي، يمكنك عبره تتبع السحوبات والإيداعات من العملة الرقمية للمنصة (Credits).",
    benefits: ["شفافية السجلات المالية", "إرسال عملات بين المستخدمين", "تاريخ أرشيفي"],
    icon: Wallet,
    color: "bg-amber-600/20 text-amber-500 border-amber-600/30"
  },
  {
    id: "offers",
    category: "management",
    title: "صندوق عروض المتجر",
    shortDesc: "تفاوض مباشر للبائع والمشتري.",
    detailedDesc: "منطقة للتفاوض، استقبال، وقبول الاقتراحات السعرية وعروض المبادلات المتعلقة بمنتجاتك في المتجر التقني.",
    benefits: ["مرونة في التفاوض", "إغلاق صفقات مخصصة", "سرية العروض"],
    icon: Repeat,
    color: "bg-stone-500/20 text-stone-400 border-stone-500/30"
  },
  {
    id: "learning",
    category: "learning",
    title: "المنصات التعليمية المتطورة",
    shortDesc: "دورات ومسارات شاملة.",
    detailedDesc: "مساحة تجمع الدورات التفاعلية والفصول الافتراضية، مصممة لاستيعاب الفيديوهات والنصوص والاختبارات في تجربة متكاملة.",
    benefits: ["مسار تعليمي متصل", "تتبع نسبة الإنجاز", "محتوى مكثف مدعوم"],
    icon: GraduationCap,
    color: "bg-emerald-600/20 text-emerald-500 border-emerald-600/30"
  },
  {
    id: "micro-ide",
    category: "tools",
    title: "محرر المتحكمات الدقيقة",
    shortDesc: "IDE لبرمجة القطع الإلكترونية مباشرة.",
    detailedDesc: "بيئة تطوير متكاملة تستهدف الهاردوير الداعم للبرمجة المتسلسلة (Serial)، تسمح بكتابة الكود ورفعه مباشرة للمايكروكنترولر عبر الـ WebUSB.",
    benefits: ["لا حاجة لتنصيب برامج", "دعم للغات المنخفضة والمدمجة", "تحليل التسلسل المباشر (Monitor)"],
    icon: CircuitBoard,
    color: "bg-green-500/20 text-green-400 border-green-500/30"
  },
  {
    id: "library",
    category: "learning",
    title: "أرشيف المكتبة العامة",
    shortDesc: "كتب، مقالات، ودلائل شاملة.",
    detailedDesc: "مخزون القراءة والمراجع للمنصة، يحتوي على نصوص وتوثيقات مع محرك بحث متقدم للقراءة المسترخية على الشاشات.",
    benefits: ["تصنيف دقيق للمراجع", "تخصيص تجربة القراءة", "إضافة مراجع للمفضلة"],
    icon: Library,
    color: "bg-sky-500/20 text-sky-400 border-sky-500/30"
  },
  {
    id: "lab",
    category: "tools",
    title: "مختبر النماذج (Neural Lab)",
    shortDesc: "منطقة تجارب النماذج الخطرة وغير المستقرة.",
    detailedDesc: "بيئة رمل (Sandbox) معزولة مخصصة لاختبار أدوات الذكاء الصنعي أو الخوارزميات الجديدة قبل تعميمها لبقية المستخدمين.",
    benefits: ["بيئة آمنة للتجارب", "الوصول المبكر للخواص", "استهلاك مرتفع للقدرات"],
    icon: Microscope,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30"
  },
  {
    id: "directory",
    category: "community",
    title: "دليل المستخدمين الموثقين",
    shortDesc: "ابحث عن مطورين وشركاء.",
    detailedDesc: "قاعدة بيانات مرئية تظهر العقد (المستخدمين) المتصلة بالشبكة، وتتيح إرسال طلبات التواصل مباشرة لبناء علاقات مهنية.",
    benefits: ["توسيع دائرة المعارف", "تأكيد الموثوقية", "نظام دعوات سريع"],
    icon: Users,
    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
  },
  {
    id: "hisn",
    category: "learning",
    title: "الورد الموثق وحصن المسلم",
    shortDesc: "زادك الروحي اليومي.",
    detailedDesc: "مرجع شامل ومفهرس بدقة للأذكار الشرعية والصحيحة، مزود بنظام تتبع وتسبيح لإبقاء يومك مباركاً بعيداً عن التشتت.",
    benefits: ["سبحة رقمية معززة", "تصنيفات يومية", "عدم الاعتماد على برامج مساعدة خارجية"],
    icon: BookOpen,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  },
  {
    id: "features",
    category: "core",
    title: "دليل قدرات النظام",
    shortDesc: "اكتشف ما تستطيع منصتنا فعله.",
    detailedDesc: "هذا القسم بالذات! دليل مستخدم تفاعلي وذكي يعرض فقط الأقسام والصلاحيات المرخص لك بفتحها واستخدامها.",
    benefits: ["فهم شامل للنظام", "منصة دائمة التحديث", "توفير الوقت"],
    icon: Zap,
    color: "bg-yellow-400/20 text-yellow-500 border-yellow-400/30"
  },
  {
    id: "notifications",
    category: "management",
    title: "مركز القيادة للإشعارات",
    shortDesc: "كل أحداث حسابك في صفحة.",
    detailedDesc: "محطة استقبال تنبيهات النظام، تحديثات الإدارة، طلبات المتجر، والرسائل الجديدة بأسلوب زمني متتابع (Timeline).",
    benefits: ["عدم تفويت الأحداث الهامة", "وصول سريع للأوامر", "فلترة بالنوع"],
    icon: Bell,
    color: "bg-red-500/20 text-red-400 border-red-500/30"
  },
  {
    id: "settings",
    category: "management",
    title: "تخصيص الإعدادات",
    shortDesc: "شكّل المنصة لتطابق تفضيلاتك.",
    detailedDesc: "مركز التحكم الكامل لكيفية استجابة المنصة لك، بدءاً من المظهر العام، وتخصيص الخوارزميات (Pro Level)، وحتى حماية الحساب.",
    benefits: ["تفعيل الأدوات المتقدمة", "تخصيص جمالي شامل", "خصوصية مرتفعة"],
    icon: Settings,
    color: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"
  },
  {
    id: "admin",
    category: "management",
    title: "غرفة التحكّم (Admin Console)",
    shortDesc: "لوظائف السلطة والرقابة الشاملة.",
    detailedDesc: "عقدة مغلقة للإدارة فقط، تمكن من إدارة المتاجر، مراقبة الخوادم، مراجعة وتصفية الفيديو، وحظر الحسابات أو ترقيتها.",
    benefits: ["نظام رقابة جماعي وحوكمة متقدمة", "رؤية لبيانات الاستهلاك الإجمالية", "صناعة وتعديل أقسام جديدة"],
    icon: ShieldCheck,
    color: "bg-fuchsia-600/20 text-fuchsia-500 border-fuchsia-600/30"
  }
];
