import Link from 'next/link';

import { Badge, Card } from '@/components/ui';
import type { ResourceView } from '@/types/view';

const LEVEL_LABEL: Record<string, string> = {
  baslangic: 'Başlangıç',
  orta: 'Orta',
  ileri: 'İleri',
};

const TYPE_LABEL: Record<string, string> = {
  rehber: 'Rehber',
  baglanti: 'Bağlantı',
  video: 'Video',
  kontrol_listesi: 'Kontrol listesi',
  soru_cevap: 'Soru-cevap',
};

/** "Nasil" kaynak karti (PROJECT_SPEC 7.7). */
export function ResourceCard({ view, highlighted = false }: { view: ResourceView; highlighted?: boolean }) {
  const { resource, author, community } = view;
  const verified = resource.verificationStatus === 'moderator_verified';

  return (
    <Card as="article" className={`flex h-full flex-col p-4 ${highlighted ? 'border-accent' : ''}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{TYPE_LABEL[resource.type]}</Badge>
        <Badge tone="neutral">{LEVEL_LABEL[resource.level]}</Badge>
        <Badge tone="neutral">{resource.estimatedMinutes} dk</Badge>
        {verified ? (
          <Badge tone="success" icon={<span aria-hidden="true">✓</span>}>
            Moderatör doğrulamalı
          </Badge>
        ) : (
          <Badge tone="neutral">Topluluk katkısı</Badge>
        )}
      </div>

      <h3 className="mt-2 font-semibold">{resource.title}</h3>
      <p className="mt-1 text-sm text-fg-muted">{resource.summary}</p>

      {resource.body ? (
        <p className="mt-3 rounded-lg border border-line bg-bg-sunken p-3 text-sm text-fg-muted">
          {resource.body}
        </p>
      ) : null}

      <div className="mt-auto pt-3 text-sm text-fg-subtle">
        <Link href={`/communities/${community.slug}`} className="hover:underline">
          <span aria-hidden="true">{community.emoji}</span> {community.name}
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href={`/profile/${author.username}`} className="hover:underline">
          {author.displayName}
        </Link>
      </div>

      {resource.url ? (
        <a
          href={resource.url}
          // Dis baglantilar guvenli acilir (PROJECT_SPEC 17.10).
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
        >
          Kaynağı aç
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(yeni sekmede açılır)</span>
        </a>
      ) : null}
    </Card>
  );
}
