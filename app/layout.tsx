import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { CapacitorInitializer } from '@/components/capacitor-initializer';
import { SafeAreaContainer } from '@/components/ui/safe-area-container';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'VetScribe Pro | Advanced Clinical Intelligence',
  description: 'AI-powered Veterinary Clinical Documentation & Scribe System',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VetScribe Pro',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5a4',
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <CapacitorInitializer />
            <Toaster position="top-right" />
            <SafeAreaContainer>
              {children}
            </SafeAreaContainer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
