import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ingram Micro CRM',
  description: 'Field Sales CRM for Ingram Micro BDMs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
