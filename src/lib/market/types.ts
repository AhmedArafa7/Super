
'use client';

export type MarketItemStatus = 'active' | 'sold' | 'reserved' | 'archived' | 'pending_review' | 'rejected';
export type AppVersionStatus = 'final' | 'beta';
export type MainCategory = 'all' | 'electronics' | 'digital_assets' | 'services' | 'tools' | 'education' | 'software' | 'home_lifestyle' | 'industrial' | 'health_beauty' | 'other';

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerId: string;
  imageUrl?: string;
  mainCategory: MainCategory;
  subCategory: string;
  stockQuantity: number;
  status: MarketItemStatus;
  currency: string;
  createdAt: string;
  isLaunchable?: boolean;
  launchUrl?: string;
  downloadUrl?: string;
  promoVideoUrl?: string;
  promoFileUrl?: string;
  adminFeedback?: string;
  versionStatus?: AppVersionStatus;
}

export interface CategoryRequest {
  id: string;
  userId: string;
  userName: string;
  suggestedName: string;
  parentCategory: MainCategory;
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  createdAt: string;
}

export interface MarketOffer {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  itemTitle: string;
  type: 'price' | 'trade';
  value: number;
  details: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export const SUB_CATEGORIES = [
  { id: 'smartphones', label: 'هواتف ذكية', parent: 'electronics' },
  { id: 'laptops', label: 'حواسيب محمولة', parent: 'electronics' },
  { id: 'scripts', label: 'سكربتات برمجية', parent: 'digital_assets' },
  { id: 'templates', label: 'قوالب تصميم', parent: 'digital_assets' },
  { id: 'decor', label: 'ديكور وشموع', parent: 'home_lifestyle' },
  { id: 'furniture', label: 'أثاث منزلي', parent: 'home_lifestyle' },
  { id: 'dev_service', label: 'تطوير برمجيات', parent: 'services' },
  { id: 'ai_models', label: 'نماذج ذكاء اصطناعي', parent: 'tools' },
  { id: 'hardware_tools', label: 'أدوات ومعدات', parent: 'industrial' },
  { id: 'skincare', label: 'عناية بالبشرة', parent: 'health_beauty' },
];
