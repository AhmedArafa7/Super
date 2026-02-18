
/**
 * @fileOverview [DEPRECATED] - المحرك العصبي للتخزين الخارجي القديم.
 * تم إيقاف استخدام Supabase والتحول إلى Firebase Storage لضمان التوافق مع بروتوكول نكسوس الأصلي.
 */

export const supabase = {
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error("Supabase is deprecated. Use Firebase Storage.")),
      getPublicUrl: () => ({ data: { publicUrl: "" } })
    })
  }
} as any;
