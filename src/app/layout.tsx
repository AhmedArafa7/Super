
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Footer } from "@/components/layout/footer";
import { OnboardingModal } from "@/components/features/onboarding-modal";

export const metadata: Metadata = {
  title: 'NexusAI - The Future of Intelligent Assistance',
  description: 'Your all-in-one neural ecosystem for context-aware chat, decentralized marketplace acquisitions, and stream synchronization.',
  keywords: ['AI', 'Neural Link', 'GenAI', 'Marketplace', 'LMS', 'Secure Chat', 'Blockchain'],
  authors: [{ name: 'Nexus Core Team' }],
  openGraph: {
    title: 'NexusAI - Neural Ecosystem',
    description: 'The premier platform for AI Chat, StreamHub, and the TechMarket.',
    url: 'https://nexusai.io',
    siteName: 'NexusAI',
    images: [
      {
        url: 'https://picsum.photos/seed/nexus-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'NexusAI Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusAI - Intelligence Evolved',
    description: 'The future of decentralized assistance.',
    images: ['https://picsum.photos/seed/nexus-og/1200/630'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30 flex flex-col min-h-screen">
        <AuthProvider>
          <div className="flex-1 flex flex-col">
            {children}
            <Footer />
          </div>
          <OnboardingModal />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
