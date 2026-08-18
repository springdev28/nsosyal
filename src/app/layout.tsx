import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'nSosyal 5N · Bağlamsal sosyal keşif',
    template: '%s · nSosyal 5N',
  },
  description:
    'Bilim, teknoloji ve inovasyon ilgi alanları çevresinde gündelik sosyalliği, aidiyeti, keşfi, öğrenmeyi ve üretimi tek ekosistemde birleştiren bağlamsal sosyal keşif katmanı prototipi.',
  applicationName: 'nSosyal 5N',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1526' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
