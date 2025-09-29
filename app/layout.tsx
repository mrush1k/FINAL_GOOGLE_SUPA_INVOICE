import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { DiagnosticProvider } from '@/components/diagnostic-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Invoice Easy - Simple Invoice Management',
  description: 'Professional invoice management for solo operators, contractors, and small businesses',
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload font to avoid FOIT and speed up first meaningful paint */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} no-scroll-x`}>
        <AuthProvider>
          <ThemeProvider>
            <DiagnosticProvider>
              {children}
              <Toaster />
            </DiagnosticProvider>
          </ThemeProvider>
        </AuthProvider>
        {/* Non-critical script: defer to avoid blocking initial render. TODO: remove in production if unnecessary */}
        <script src="/scripts/iframe-navigation.js" defer></script>
      </body>
    </html>
  );
}
