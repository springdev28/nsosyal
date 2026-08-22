import type { Metadata } from 'next';
import Link from 'next/link';

import { signInAsDemoAccount, startOnboarding } from '@/actions/auth';
import { FiveNMark } from '@/components/brand/FiveNMark';
import { Avatar, Badge, Button, Card, ErrorNote, Icon } from '@/components/ui';
import { DEMO_ACCOUNTS } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';

export const metadata: Metadata = { title: 'Giriş' };

/**
 * Giris ekrani (PROJECT_SPEC 6.1 ekran 01).
 * Juri icin kritik: demo hesaplarina tek tiklamayla girilebilir (15.4).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const store = getStore();

  return (
    <div className="auth-shell mx-auto grid min-h-dvh w-full max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14 lg:px-8">
      <header className="text-center lg:sticky lg:top-12 lg:text-left">
        {/*
          Giris ekrani markanin ilk goruldugu yerdir; burada "nS" yazan bir
          metin karosu duruyordu. Isaretin kendisi Figma master vector'undan
          gelir (spec 17.18/2) ve baglanti parcacigiyla birlikte gosterilir.
        */}
        <span aria-hidden="true" className="mx-auto mb-5 flex justify-center lg:mx-0 lg:justify-start">
          <FiveNMark size={92} animated />
        </span>
        <p className="auth-kicker mb-3 text-xs font-bold uppercase text-accent">Bağlamsal sosyal keşif</p>
        <h1 className="editorial-heading text-gradient text-5xl font-black sm:text-6xl">
          nSosyal
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-fg-muted lg:mx-0 lg:text-lg">
          Bilim, teknoloji ve üretim topluluklarını keşfet.
        </p>
        <p className="mt-6 hidden border-t border-line pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle lg:block">
          Ne · Nerede · Ne zaman · Nasıl · Neden
        </p>
      </header>

      <div className="space-y-4">
        {error === 'unknown-account' ? <ErrorNote>Bu demo hesabı bulunamadı.</ErrorNote> : null}

        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Demo hesabıyla gir</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Prototipteki tüm hesaplar ve içerikler sentetiktir. Gerçek bir kişiyi veya kurumu temsil etmez.
          </p>

          <ul className="mt-4 space-y-2">
            {DEMO_ACCOUNTS.map((account) => {
              const profile = store.getProfileByUsername(account.username);
              return (
                <li key={account.username}>
                  <form action={signInAsDemoAccount}>
                    <input type="hidden" name="username" value={account.username} />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl border border-line bg-bg-raised p-3 text-left transition-colors hover:border-accent hover:bg-accent-soft"
                    >
                      {profile ? <Avatar profile={profile} size={44} /> : null}
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{account.label}</span>
                          <Badge tone="neutral">{roleLabel(account.role)}</Badge>
                        </span>
                        <span className="mt-0.5 block text-sm text-fg-muted">{account.description}</span>
                      </span>
                      <Icon name="chevronRight" size={16} className="text-fg-subtle" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Yeni kullanıcı deneyimini gör</h2>
          <p className="mt-1 text-sm text-fg-muted">
            İlgi alanlarını ve tercihlerini baştan seç.
          </p>
          <form action={startOnboarding} className="mt-3">
            <Button type="submit" tone="secondary">
              Onboarding turunu başlat
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-fg-subtle">
          <Link href="/about" className="underline">
            Proje, veri kaynakları ve erişilebilirlik notları
          </Link>
        </p>
      </div>
    </div>
  );
}

function roleLabel(role: string): string {
  switch (role) {
    case 'moderator':
      return 'Moderatör';
    case 'organization':
      return 'Kurum';
    case 'admin':
      return 'Yönetici';
    default:
      return 'Kullanıcı';
  }
}
