import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ingram Micro CRM',
  description: 'Field Sales CRM for Ingram Micro BDMs',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
