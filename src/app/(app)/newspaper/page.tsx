import type { Metadata } from 'next';
import Link from 'next/link';

import { IssueCalendar } from '@/components/newspaper/IssueCalendar';
import { Card, EmptyState, SectionHeader } from '@/components/ui';
import { CoverTile } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate, toIstanbulDateKey } from '@/lib/time';
import type { NewspaperSection } from '@/types/domain';
import type { NewspaperItemView } from '@/types/view';

export const metadata: Metadata = { title: 'nGazete' };

const SECTION_LABEL: Record<NewspaperSection, string> = {
  gundem: 'Gündem',
  yerel: 'Yerel',
  proje: 'Projeler',
  topluluk: 'Topluluklar',
  etkinlik: 'Etkinlik',
  kaynak: 'Kaynaklar',
};

/**
 * Mansetten sonra bir sayfaya kac kart girer.
 *
 * Dort, gazete ritmi icin yeterli: iki kolonda ikiser kart. Daha yuksek bir
 * deger butun sayiyi tek sayfaya sikistirip sayfa gezinmesini gorunmez
 * yapiyordu - yani "sayfalari olsun" istegini kagit uzerinde karsilayip
 * ekranda karsilamiyordu.
 */
const ITEMS_PER_PAGE = 4;

/**
 * nGazete (PROJECT_SPEC 7.9 / 17.12 / 17.18-8).
 *
 * Gercek bir dijital gazete: masthead, sayi ve tarih, manset hiyerarsisi,
 * gorseller, bolum etiketleri, kolon kompozisyonu ve SAYFALAR.
 *
 * --- Bu surumde duzeltilen dort sey ---
 *
 * 1. SAYFA YOKTU. Butun sayi tek bir uzun kaydirma seridiydi. Gazetenin
 *    sayfasi vardir; okuyucu "2. sayfa"ya gecer. Artik mansetten sonraki
 *    kartlar sayfalara boluunur ve altta sayfa gezinmesi durur.
 *
 * 2. TAKVIM YOKTU. Arsive erisim uc adet tarih rozetiydi. Artik bir ay
 *    takvimi var; sayisi olan gunler tiklanir, bugun isaretlidir ve
 *    varsayilan sayi BUGUNUN sayisidir.
 *
 * 3. GRID'DE DELIKLER VARDI. Sabit satir/kolon span'leri kartlarin gercek
 *    yuksekligiyle ortusmuyordu; kisa bir kartin altinda kocaman bos alanlar
 *    kaliyordu. Manset tam genislikte durur, geri kalani CSS kolonlarina
 *    akar - gercek gazete davranisi, hem de bosluk birakmadan.
 *
 * 4. OKUYUCUYA REKLAM ENVANTERI GOSTERILIYORDU. Sponsorlu kartlarin altinda
 *    "600x400 - Bolum ici genis" yaziyordu. Bu reklamveren tarafinin verisi;
 *    okuyucunun ekraninda isi yok (spec 7.9: gelir modeli anlatimi
 *    reklamveren, yonetici, Hakkinda ve dokumantasyon yuzeylerine aittir).
 *    Envanter verisi silinmedi, yalnizca okuyucu goruunumunden cikarildi;
 *    /newspaper/advertise ve yonetici ekrani ayni kayitlari kullanmaya
 *    devam ediyor.
 */
export default async function NewspaperPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; sayfa?: string; ay?: string }>;
}) {
  const { date, sayfa, ay } = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const issues = store.listIssues();
  const today = toIstanbulDateKey(new Date());

  // Varsayilan BUGUNUN sayisidir; bugun yayimlanmadiysa en yeni sayi.
  const current = date ? store.getIssueByDate(date) : (store.getIssueByDate(today) ?? store.getLatestIssue());

  if (!current) {
    return (
      <EmptyState
        icon="newspaper"
        title="Yayımlanmış sayı yok"
        description="Gazete her sabah yayımlanır."
      />
    );
  }

  const issueDates = new Set(issues.map((entry) => entry.issue.issueDate));
  const themeByDate = Object.fromEntries(
    issues.map((entry) => [entry.issue.issueDate, entry.issue.theme]),
  );
  const months = issues.map((entry) => entry.issue.issueDate.slice(0, 7)).sort();
  const month = ay && /^\d{4}-\d{2}$/.test(ay) ? ay : current.issue.issueDate.slice(0, 7);

  // Sayi numarasi: en eski sayidan bugune artan sira.
  const issueNumber =
    issues.length - issues.findIndex((entry) => entry.issue.id === current.issue.id);

  // Kompozisyon sirasi: once oncelik, esitlikte yayin sirasi. Sponsorlu
  // kartlar ayri bir listeye alinmaz; ayni siralamaya girer.
  const composed = [...current.items].sort(
    (a, b) => a.item.priority - b.item.priority || a.item.publicationOrder - b.item.publicationOrder,
  );

  // Manset her sayinin birinci sayfasinda durur; sayfalanan kisim geri kalanidir.
  const lead = composed[0] ?? null;
  const rest = composed.slice(1);

  /*
   * Editoryal ve ucretli kartlar AYRI sayfalanir.
   *
   * Duz sayfalama yanlisti: sponsorlu kartlarin onceligi en dusuk oldugu icin
   * hepsi sona dusuyor ve son sayfada yigiliyordu. Gercek bir gazetede reklam
   * her sayfada bulunur. Editoryal icerik sayfalari belirler; ucretli kartlar
   * sayfalara sirayla dagitilir ve sayfanin ortasina, kolon akisinin icine
   * yerlesir.
   */
  const editorial = rest.filter((entry) => !entry.item.sponsored);
  const sponsoredItems = rest.filter((entry) => entry.item.sponsored);

  const pageCount = Math.max(1, Math.ceil(editorial.length / ITEMS_PER_PAGE));
  const requested = Number(sayfa);
  const page = Number.isFinite(requested) ? Math.min(Math.max(1, Math.trunc(requested)), pageCount) : 1;

  const pageEditorial = editorial.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const pageSponsored = sponsoredItems.filter((_, index) => index % pageCount === page - 1);
  const pageItems = [
    ...pageEditorial.slice(0, Math.ceil(pageEditorial.length / 2)),
    ...pageSponsored,
    ...pageEditorial.slice(Math.ceil(pageEditorial.length / 2)),
  ];

  const hasSponsored = composed.some((entry) => entry.item.sponsored);
  const canAdvertise = viewer?.kind === 'organization' || viewer?.role === 'admin';
  const pageHref = (target: number) =>
    `/newspaper?date=${current.issue.issueDate}&ay=${month}${target > 1 ? `&sayfa=${target}` : ''}`;

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="nGazete"
        action={
          canAdvertise ? (
            <Link
              href="/newspaper/advertise"
              className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
            >
              İlan ver
            </Link>
          ) : null
        }
      />

      {/*
        Takvim gazetenin USTUNDE, tam genislikte durur.
        Yan kolon olarak denendi ve yanlisti: uygulama kabugunda zaten sol
        gezinme ve sag serit var; ucuncu bir kolon gazeteye ~340px birakiyor,
        o genislikte uc metin kolonu kelime basina bir satira duserek
        okunamaz hale geliyordu.
      */}
      <IssueCalendar
        month={month}
        issueDates={issueDates}
        themeByDate={themeByDate}
        activeDate={current.issue.issueDate}
        earliestMonth={months[0] ?? month}
        latestMonth={months[months.length - 1] ?? month}
      />

      <Card className="overflow-hidden">
          {/* Masthead */}
          <header className="border-b-4 border-double border-line-strong bg-bg-sunken px-4 py-5 text-center sm:px-6">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-fg-subtle">
              nSosyal
            </p>
            <p className="font-serif text-4xl font-black tracking-tight sm:text-5xl">nGazete</p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-y border-line py-1.5 text-xs text-fg-muted">
              <span>Sayı {issueNumber}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={current.issue.issueDate}>
                {formatDate(`${current.issue.issueDate}T09:00:00Z`)}
              </time>
              {current.issue.issueDate === today ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-accent">Bugünün sayısı</span>
                </>
              ) : null}
              {current.issue.theme ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{current.issue.theme} özel sayısı</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span>
                Sayfa {page}/{pageCount}
              </span>
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight">
              {current.issue.title}
            </h2>
            <p className="mx-auto mt-1 max-w-xl text-sm text-fg-muted">{current.issue.standfirst}</p>

            {/*
              Ucretli yerlesim aciklamasi TEK YERDE durur.
              Her kartin ustunde tekrarlanan "Sponsorlu" rozeti gurultuydu;
              ama aciklamayi tamamen kaldirmak ucretli icerigi editoryal
              icerikten ayirt edilemez hale getirirdi. Cozum: sayida bir kez
              soyle, kartta da sponsorun adiyla ve renkli seritle isaretle.
            */}
            {hasSponsored ? (
              <p className="mx-auto mt-2 max-w-xl border-t border-line pt-2 text-[0.7rem] text-fg-subtle">
                Bu sayıda ücretli yerleşimler var. Sponsor adıyla ve renkli şeritle işaretlenir.
              </p>
            ) : null}
          </header>

          {/* Manset yalnizca birinci sayfada, tam genislikte. */}
          {lead && page === 1 ? (
            <div className="border-b border-line">
              <LeadCell entry={lead} />
            </div>
          ) : null}

          {/*
            Kolon akisi. Sabit grid span'leri, kartlarin gercek yuksekligi
            farkli oldugu icin altlarinda delikler birakiyordu. `columns`
            kartlari sirayla doldurur ve bosluk kalmaz; `break-inside: avoid`
            bir karti iki kolona bolmesini engeller.
          */}
          <div className="gap-x-7 px-4 py-4 sm:px-6 md:columns-2 2xl:columns-3 [&>*]:mb-6 [&>*]:break-inside-avoid">
            {pageItems.map((entry) => (
              <ColumnCell key={entry.item.id} entry={entry} />
            ))}
          </div>

          {pageCount > 1 ? (
            <nav
              aria-label="Gazete sayfaları"
              className="flex flex-wrap items-center justify-center gap-2 border-t border-line bg-bg-sunken px-4 py-3"
            >
              <PageLink href={pageHref(page - 1)} enabled={page > 1} label="Önceki sayfa">
                ‹ Önceki
              </PageLink>

              <ul className="flex flex-wrap items-center gap-1">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((target) => (
                  <li key={target}>
                    <Link
                      href={pageHref(target)}
                      aria-current={target === page ? 'page' : undefined}
                      aria-label={`Sayfa ${target}`}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm ${
                        target === page
                          ? 'bg-accent font-bold text-accent-fg'
                          : 'border border-line text-fg-muted hover:bg-bg-hover'
                      }`}
                    >
                      {target}
                    </Link>
                  </li>
                ))}
              </ul>

              <PageLink href={pageHref(page + 1)} enabled={page < pageCount} label="Sonraki sayfa">
                Sonraki ›
              </PageLink>
            </nav>
        ) : null}
      </Card>
    </div>
  );
}

function PageLink({
  href,
  enabled,
  label,
  children,
}: {
  href: string;
  enabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return (
      <span aria-hidden="true" className="px-3 py-2 text-sm text-fg-subtle opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-sm text-fg-muted hover:bg-bg-hover"
    >
      {children}
    </Link>
  );
}

/** Mansetin kendisi: sayfanin ustunde, tam genislikte, en buyuk hiyerarsi. */
function LeadCell({ entry }: { entry: NewspaperItemView }) {
  const { item } = entry;

  const body = (
    <>
      {item.imageSeed && item.imageGlyph ? (
        <CoverTile
          seed={item.imageSeed}
          glyph={item.imageGlyph}
          height={200}
          rounded="none"
          className="mb-4"
        />
      ) : null}

      <div className="px-4 pb-5 sm:px-6">
        <SectionTag item={item} />
        <h3 className="mt-1 font-serif text-3xl font-bold leading-tight sm:text-4xl">
          {item.title}
        </h3>
        {item.standfirst ? (
          <p className="mt-2 max-w-2xl font-serif text-lg italic leading-snug text-fg-muted">
            {item.standfirst}
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl leading-relaxed text-fg-muted">{item.body}</p>
        {item.sourceOrAuthor ? (
          <p className="mt-3 text-xs text-fg-subtle">{item.sourceOrAuthor}</p>
        ) : null}
      </div>
    </>
  );

  if (entry.href) {
    return (
      <Link href={entry.href} className="block transition-colors hover:bg-bg-hover">
        {body}
      </Link>
    );
  }
  return <div>{body}</div>;
}

/**
 * Kolon icindeki kart.
 *
 * Sponsorlu kartlar da AYNI kolon akisina girer - gazetenin grid'i icinde
 * yasarlar, ayri bir listeye yigilmazlar (spec 17.18/8). Editoryal karttan
 * ayirt edilirler ama okuyucuya envanter olculeri gosterilmez.
 */
function ColumnCell({ entry }: { entry: NewspaperItemView }) {
  const { item } = entry;
  const isFeature = item.layoutVariant === 'feature';
  const isBrief = item.layoutVariant === 'brief';

  const headingClass = isFeature
    ? 'font-serif text-xl font-bold leading-snug'
    : isBrief
      ? 'font-serif text-base font-bold leading-snug'
      : 'font-serif text-lg font-bold leading-snug';

  const body = (
    <>
      {item.imageSeed && item.imageGlyph ? (
        <CoverTile
          seed={item.imageSeed}
          glyph={item.imageGlyph}
          height={item.sponsored ? 104 : 128}
          rounded="all"
          className="mb-3"
        />
      ) : null}

      <SectionTag item={item} />

      <h3 className={`mt-1 ${headingClass}`}>{item.title}</h3>

      {item.standfirst ? (
        <p className="mt-1.5 font-serif italic leading-snug text-fg-muted">{item.standfirst}</p>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.body}</p>

      {item.sourceOrAuthor ? (
        <p className="mt-2 text-xs text-fg-subtle">{item.sourceOrAuthor}</p>
      ) : null}
    </>
  );

  const className = item.sponsored
    ? 'block border-l-2 border-signal-500 bg-signal-50 p-3 dark:bg-signal-900/25'
    : 'block';

  if (entry.href) {
    return (
      <Link href={entry.href} className={`${className} transition-colors hover:opacity-90`}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

/**
 * Bolum etiketi.
 *
 * Sponsorlu kartta bolum adi yerine kaynagin kendisi yazilir. "Sponsorlu"
 * kelimesi ayrica rozet olarak TEKRARLANMAZ: gazetenin ucretli alanlari zaten
 * sponsorlu alanlardir ve bunu masthead altindaki tek satir soyler; her kartin
 * ustunde bir daha yazmak gurultudur.
 */
function SectionTag({ item }: { item: NewspaperItemView['item'] }) {
  if (item.sponsored) {
    return (
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-signal-700 dark:text-signal-300">
        {/*
          signal-600 (#d96b04) acik temada beyaza karsi 3.47:1 veriyordu;
          10.9px normal agirlikta bu esik 4.5:1 (WCAG 1.4.3). signal-700
          beyazda 5.51:1, sponsorlu kartin signal-50 zemininde 4.8:1.
          Koyu temada signal-300 zaten yeterli.
        */}
        {item.sponsorName ?? 'Sponsorlu içerik'}
      </p>
    );
  }
  return (
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">
      {SECTION_LABEL[item.section]}
    </p>
  );
}
