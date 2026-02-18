
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
    title: 'Angular Dashboard Pro',
    description: 'نظام إدارة بيانات متكامل مبني بـ Angular 17 مع رسوم بيانية تفاعلية.',
    url: 'https://angular.io/generated/zips/cli-hello-world/index.html', // مثال تجريبي
    framework: 'angular',
    access: 'trial',
    thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1074&auto=format&fit=crop',
    author: 'Nexus Dev Team'
  },
  {
    id: 'proj-2',
    title: 'React Neural Chat UI',
    description: 'واجهة دردشة ذكية مبنية بـ React و Tailwind CSS.',
    url: 'https://react.dev',
    framework: 'react',
    access: 'free',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1170&auto=format&fit=crop',
    author: 'AI Architect'
  },
  {
    id: 'proj-3',
    title: 'Vanilla Crypto Tracker',
    description: 'موقع تتبع عملات رقمية بسيط وسريع باستخدام Pure JS & HTML.',
    url: 'https://example.com',
    framework: 'html',
    access: 'paid',
    price: 500,
    thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1074&auto=format&fit=crop',
    author: 'Legacy Coder'
  }
];
