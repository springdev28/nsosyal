import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'nSosyal · Bağlamsal sosyal keşif',
    template: '%s · nSosyal',
  },
  description:
    'Bilim, teknoloji ve inovasyon ilgi alanları çevresinde gündelik sosyalliği, aidiyeti, keşfi, öğrenmeyi ve üretimi tek ekosistemde birleştiren bağlamsal sosyal keşif katmanı prototipi.',
  applicationName: 'nSosyal',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
  ],
};

/**
 * Tema tercihini ilk boyamadan once uygular.
 *
 * Aksi hâlde koyu tema kullanicilarda kisa bir beyaz parlama olurdu. Script
 * kucuk ve senkron; tercih yoksa sisteme birakilir.
 */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem('nsosyal-theme');
  if (stored === 'light' || stored === 'dark') document.documentElement.dataset.theme = stored;
} catch (error) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
