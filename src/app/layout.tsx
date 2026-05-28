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
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=JSON.parse(localStorage.getItem('crm-settings-store')||'{}').state||{};var t=d.theme||'light';if(d.autoThemeByTime){var h=new Date().getHours();var ds=d.autoThemeDarkStartHour||19;var ls=d.autoThemeLightStartHour||7;t=(ds>ls?(h>=ds||h<ls):(h>=ds&&h<ls))?'dark':'light';}else if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}if(d.density)document.documentElement.classList.add('density-'+d.density);if(d.fontScale)document.documentElement.classList.add('font-scale-'+d.fontScale);if(d.highContrast)document.documentElement.classList.add('high-contrast');if(d.reduceMotion)document.documentElement.classList.add('reduce-motion');if(d.tableRowDensity)document.documentElement.setAttribute('data-table-density',d.tableRowDensity);if(d.accentColor&&d.accentColor!=='blue'&&!d.customAccentHex)document.documentElement.classList.add('accent-'+d.accentColor);}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
