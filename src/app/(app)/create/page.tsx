import type { Metadata } from 'next';
import Link from 'next/link';

import { SectionHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Oluştur' };

const OPTIONS = [
  {
    href: '/feed',
    icon: '💬',
    title: 'Gönderi paylaş',
    description: 'Metin, soru, mizah veya gündelik bir not. Ana akıştaki oluşturucudan paylaş.',
  },
  {
    href: '/create/project',
    icon: '🧪',
    title: 'Proje oluştur',
    description: 'Fikir, prototip veya yayında bir üretim. 90 saniyeye kadar pitch videosu ekleyebilirsin.',
  },
  {
    href: '/create/why',
    icon: '💭',
    title: 'Neden hikâyesi yaz',
    description: 'Seni bu alana, projeye veya başarıya götüren deneyimi anlat.',
  },
  {
    href: '/communities/apply',
    icon: '👥',
    title: 'Topluluk öner',
    description: 'Yerel veya niş bir topluluk başlat. Moderatör onayından sonra açılır.',
  },
  {
    href: '/publish',
    icon: '📰',
    title: 'Yayın Atölyesi’ni aç',
    description: 'nGazete’de alan seç, tasarımını kaydet ve yayın hakkını kesinleştir.',
  },
];

/** Oluştur menüsü (PROJECT_SPEC 4.3). */
export default function CreatePage() {
  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Oluştur"
        description="Gündelik bir paylaşımdan bir projeye kadar; hepsi aynı ekosistemin parçası."
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <li key={option.href}>
            <Link
              href={option.href}
              target={option.href === '/publish' ? '_blank' : undefined}
              rel={option.href === '/publish' ? 'noopener noreferrer' : undefined}
              prefetch
              className="card block h-full p-4 transition-colors hover:border-accent"
            >
              <span aria-hidden="true" className="text-2xl">
                {option.icon}
              </span>
              <span className="mt-2 block font-semibold">{option.title}</span>
              <span className="mt-1 block text-sm text-fg-muted">{option.description}</span>
              {option.href === '/publish' ? <span className="sr-only">Yeni sekmede açılır</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
