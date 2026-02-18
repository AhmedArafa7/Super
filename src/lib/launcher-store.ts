
'use client';

export type AppFramework = 'angular' | 'react' | 'vue' | 'html' | 'nextjs';
export type AppAccess = 'free' | 'paid' | 'trial';

export interface WebProject {
  id: string;
  title: string;
  description: string;
  url: string;
  framework: AppFramework;
  access: AppAccess;
  price?: number;
  thumbnail: string;
  author: string;
}

export const PROJECTS_DATA: WebProject[] = [
  {
    id: 'proj-1',
    title: 'React Production Node',
    description: 'واجهة برمجية متكاملة لخدمات React المرفوعة مسبقاً مع دعم التحديثات الحية.',
    url: 'https://react.dev', 
    framework: 'react',
    access: 'free',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1170&auto=format&fit=crop',
    author: 'Nexus Core'
  },
  {
    id: 'proj-2',
    title: 'Angular Enterprise Cloud',
    description: 'نظام إدارة سحابي مبني بـ Angular 17، مخصص للمؤسسات الكبرى.',
    url: 'https://angular.io', 
    framework: 'angular',
    access: 'trial',
    thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1074&auto=format&fit=crop',
    author: 'Nexus Dev Team'
  },
  {
    id: 'proj-3',
    title: 'Nexus Wiki Dashboard',
    description: 'عقدة معلوماتية مبنية باستخدام Next.js وتعمل في بيئة إنتاج حقيقية.',
    url: 'https://nextjs.org',
    framework: 'nextjs',
    access: 'free',
    thumbnail: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=1000&auto=format&fit=crop',
    author: 'Production Bot'
  },
  {
    id: 'proj-4',
    title: 'Legacy HTML Archive',
    description: 'أرشيف لمواقع HTML5 البسيطة والسريعة التي تعمل بملف واحد.',
    url: 'https://example.com',
    framework: 'html',
    access: 'paid',
    price: 300,
    thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1074&auto=format&fit=crop',
    author: 'Legacy Coder'
  }
];
