import type { Metadata } from 'next';
import { Fraunces, Geist } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShotByAnshol — Photography',
  description:
    'Photography by Anshol — events, weddings, portraits, and more.',
  metadataBase: new URL('https://shotbyanshol.com'),
  openGraph: {
    title: 'ShotByAnshol — Photography',
    description: 'Photography by Anshol.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
