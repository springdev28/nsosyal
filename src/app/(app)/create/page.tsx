/** Kullaniciya post, proje ve Neden hikayesi olusturma yollarini tek giriste sunar. */
import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon, SectionHeader, type IconName } from '@/components/ui';

export const metadata: Metadata = { title: 'Oluştur' };

const OPTIONS: Array<{ href: string; icon: IconName; title: string; description: string }> = [
  {
    href: '/feed',
    icon: 'message',
    title: 'Gönderi paylaş',
    description: 'Metin, görsel, video veya soru paylaş.',
  },
  {
    href: '/create/project',
    icon: 'beaker',
    title: 'Proje oluştur',
    description: 'Fikrini, prototipini veya yayındaki projeni ekle.',
  },
  {
    href: '/create/why',
    icon: 'spark',
    title: 'Neden hikâyesi yaz',
    description: 'Seni bu alana, projeye veya başarıya götüren deneyimi anlat.',
  },
  {
    href: '/communities/apply',
    icon: 'users',
    title: 'Topluluk öner',
    description: 'Yeni bir yerel veya ilgi topluluğu öner.',
  },
  {
    href: '/publish',
    icon: 'newspaper',
    title: 'Yayın Atölyesi’ni aç',
    description: 'nGazete için alan seç ve tasarımını hazırla.',
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
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon name={option.icon} size={21} />
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
