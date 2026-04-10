export type ContentItem = {
  id: string;
  title: string;
  source: 'youtube' | 'drive' | 'local' | 'offline' | 'platform';
  thumbnail?: string | null;
  author: string;
  authorId?: string;
  channelAvatar?: string | null;
  time?: string;
  isShorts?: boolean;
  hasMusic?: boolean;
  category?: string;
  fetchedAt?: number;
  url?: string;
  status?: string;
  visibility?: string;
  externalUrl?: string;
};

export const CATEGORIES = [
  "الكل", "تريند", "موسيقى", "ألعاب", "مباشر", "رياضة", "أخبار",
  "بودكاست", "برمجة", "طبخ", "تكنولوجيا", "كوميديا", "اقتصاد"
];
