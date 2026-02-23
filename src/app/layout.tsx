
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Footer } from "@/components/layout/footer";
import { OnboardingModal } from "@/components/features/onboarding-modal";
import { PrivacyConsentModal } from "@/components/features/privacy-consent-modal";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'NexusAI - Neural Ecosystem',
  description: 'The future of decentralized assistance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
        <FirebaseClientProvider>
          <AuthProvider>
            <div className="flex-1 flex flex-col">
              {children}
              <Footer />
            </div>
            <OnboardingModal />
            <PrivacyConsentModal />
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
