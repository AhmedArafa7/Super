
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: 'NexusAI - The Future of Intelligent Assistance',
  description: 'Your all-in-one AI platform for secure chat, productivity, and decentralized marketplace tools.',
  keywords: ['AI', 'Assistant', 'Nexus', 'Tech Market', 'Neural Link', 'GenAI'],
  authors: [{ name: 'Nexus Team' }],
  openGraph: {
    title: 'NexusAI - The Future Super App',
    description: 'AI Chat, StreamHub, and TechMarket - all in one unified experience.',
    url: 'https://nexusai.studio',
    siteName: 'NexusAI',
    images: [
      {
        url: 'https://picsum.photos/seed/nexus-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'NexusAI Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusAI',
    description: 'The Future of Intelligent Assistance',
    images: ['https://picsum.photos/seed/nexus-og/1200/630'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
