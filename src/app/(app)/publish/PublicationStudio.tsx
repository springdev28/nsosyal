'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import {
  purchasePublicationAreaAction,
  reservePublicationAreaAction,
  resizePublicationDraftAction,
  savePublicationDraftAction,
  startPublicationDraftAction,
} from '@/actions/publication';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/time';
import type { PublicationMutationResult, PublicationWindow } from '@/lib/data/store';
import type { PublicationBlock, PublicationDraft, PublicationRect, PublicationSlot } from '@/types/domain';

const PAGE_COLUMNS = 30;
const PAGE_ROWS = 40;
const UNIT_PRICE = 10;

type StudioTab = 'drafts' | 'guide' | 'resources';
type StudioStage = 'select' | 'edit' | 'preview';

interface OwnerView {
  id: string;
  username: string;
  displayName: string;
  avatarTone: string;
  kind: 'person' | 'organization';
  visible: boolean;
  canMessage: boolean;
}

function contains(parent: PublicationRect, child: PublicationRect): boolean {
  return (
    child.x >= parent.x &&
    child.y >= parent.y &&
    child.x + child.width <= parent.x + parent.width &&
    child.y + child.height <= parent.y + parent.height
  );
}

function sameRect(left: PublicationRect, right: PublicationRect): boolean {
  return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height;
}

function newBlock(type: PublicationBlock['type'], rect: PublicationRect): PublicationBlock {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}`,
    type,
    x: rect.x,
    y: rect.y,
    width: Math.min(rect.width, Math.max(4, Math.floor(rect.width * 0.7))),
    height: Math.min(rect.height, type === 'markdown' ? 6 : 8),
    content:
      type === 'markdown'
        ? '## Yeni başlık\n\nMetninizi **Markdown** ile biçimlendirin.'
        : type === 'image'
          ? ''
          : 'Vurgu',
    altText: type === 'image' ? 'Görsel açıklaması' : '',
    color: type === 'shape' ? '#3D9BFF' : '#E9EFF7',
    borderRadius: 12,
    objectFit: 'cover',
    archived: false,
  };
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    return <span key={index}>{part}</span>;
  });
}

function MarkdownPreview({ value }: { value: string }) {
  return (
    <div className="space-y-1 whitespace-pre-wrap text-left">
      {value.split('\n').map((line, index) => {
        if (line.startsWith('## ')) return <h3 key={index} className="text-[1.2em] font-black"><InlineMarkdown text={line.slice(3)} /></h3>;
        if (line.startsWith('# ')) return <h2 key={index} className="text-[1.35em] font-black"><InlineMarkdown text={line.slice(2)} /></h2>;
        if (line.startsWith('- ')) return <p key={index} className="pl-3 before:mr-1 before:content-['•']"><InlineMarkdown text={line.slice(2)} /></p>;
        return <p key={index}><InlineMarkdown text={line || ' '} /></p>;
      })}
    </div>
  );
}

function rectStyle(rect: PublicationRect): React.CSSProperties {
  return {
    left: `${(rect.x / PAGE_COLUMNS) * 100}%`,
    top: `${(rect.y / PAGE_ROWS) * 100}%`,
    width: `${(rect.width / PAGE_COLUMNS) * 100}%`,
    height: `${(rect.height / PAGE_ROWS) * 100}%`,
  };
}

function PageGrid({
  page,
  slots,
  value,
  onChange,
  disabled = false,
}: {
  page: number;
  slots: PublicationSlot[];
  value: PublicationRect;
  onChange: (rect: PublicationRect) => void;
  disabled?: boolean;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);

  function point(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = pageRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(PAGE_COLUMNS - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * PAGE_COLUMNS))),
      y: Math.max(0, Math.min(PAGE_ROWS - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * PAGE_ROWS))),
    };
  }

  function updateFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!anchorRef.current) return;
    const current = point(event);
    const anchor = anchorRef.current;
    onChange({
      x: Math.min(anchor.x, current.x),
      y: Math.min(anchor.y, current.y),
      width: Math.abs(anchor.x - current.x) + 1,
      height: Math.abs(anchor.y - current.y) + 1,
    });
  }

  return (
    <div className="mx-auto w-full max-w-[510px]">
      <div
        ref={pageRef}
        role="application"
        aria-label={`${page}. sayfa, 30 sütun ve 40 satır alan seçici`}
        className={`publication-grid relative aspect-[3/4] touch-none overflow-hidden rounded-xl border border-line-strong bg-white ${
          disabled ? '' : 'cursor-crosshair'
        }`}
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          anchorRef.current = point(event);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => updateFromPointer(event)}
        onPointerUp={(event) => {
          updateFromPointer(event);
          anchorRef.current = null;
        }}
      >
        {slots.filter((slot) => slot.page === page).map((slot) => (
          <div
            key={slot.id}
            role="img"
            aria-label={`${slot.status === 'paid' ? 'Satın alınmış' : 'Rezerve'} alan`}
            className={`absolute z-10 border-2 ${
              slot.status === 'paid'
                ? 'border-blue-800 bg-blue-500/45'
                : 'border-dashed border-cyan-700 bg-cyan-400/25'
            }`}
            style={rectStyle(slot.rect)}
          />
        ))}
        <div
          role="img"
          aria-label={`Seçim: x ${value.x + 1}, y ${value.y + 1}, ${value.width}×${value.height} birim`}
          className="absolute z-20 border-2 border-accent bg-accent/20 shadow-[0_0_0_1px_white]"
          style={rectStyle(value)}
        >
          {['-left-1 -top-1', '-right-1 -top-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((position) => (
            <span key={position} aria-hidden="true" className={`absolute h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white ${position}`} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-fg-muted">
        Mavi: satın alınmış · Kesik camgöbeği: rezervasyon · Çerçeve: seçimin
      </p>
    </div>
  );
}

function RectFields({ value, onChange }: { value: PublicationRect; onChange: (value: PublicationRect) => void }) {
  const fields: Array<{ key: keyof PublicationRect; label: string; max: number }> = [
    { key: 'x', label: 'X', max: 29 },
    { key: 'y', label: 'Y', max: 39 },
    { key: 'width', label: 'Genişlik', max: 30 },
    { key: 'height', label: 'Yükseklik', max: 40 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {fields.map((field) => (
        <label key={field.key} className="text-xs font-semibold text-fg-muted">
          {field.label}
          <input
            type="number"
            min={field.key === 'x' || field.key === 'y' ? 0 : 1}
            max={field.max}
            value={value[field.key]}
            onChange={(event) => onChange({ ...value, [field.key]: Number(event.target.value) })}
            className="mt-1 w-full rounded-lg border border-line bg-bg-sunken px-2 py-2 text-fg"
          />
        </label>
      ))}
    </div>
  );
}

function DesignCanvas({
  draft,
  blocks,
  selectedId,
  onSelect,
}: {
  draft: PublicationDraft;
  blocks: PublicationBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="publication-grid relative mx-auto aspect-[3/4] w-full max-w-[600px] overflow-hidden rounded-xl border border-line-strong bg-white shadow-2xl">
      <div className="absolute border-2 border-accent bg-accent/5" style={rectStyle(draft.rect)} />
      {blocks.map((block) => {
        const outside = !contains(draft.rect, block);
        return (
          <button
            type="button"
            key={block.id}
            onClick={() => onSelect(block.id)}
            className={`absolute overflow-hidden p-1 text-left text-[clamp(7px,1vw,14px)] text-slate-950 ${
              outside ? 'border-2 border-red-600 ring-2 ring-red-300' : selectedId === block.id ? 'ring-2 ring-accent' : 'ring-1 ring-slate-400/60'
            }`}
            style={{ ...rectStyle(block), borderRadius: block.borderRadius, backgroundColor: block.type === 'shape' ? block.color : '#ffffff' }}
          >
            {block.type === 'markdown' ? <MarkdownPreview value={block.content} /> : null}
            {block.type === 'image' ? (
              block.content ? (
                <span
                  role="img"
                  aria-label={block.altText || 'Açıklaması eksik görsel'}
                  className="block h-full w-full bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${block.content})`, backgroundSize: block.objectFit }}
                />
              ) : <span className="flex h-full items-center justify-center text-center text-slate-500">Görsel URL’si ekle</span>
            ) : null}
            {block.type === 'shape' ? <span className="flex h-full items-center justify-center font-black text-white">{block.content}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function PublicationStudio({
  viewerId,
  windows,
  initialDrafts,
  owners,
  anonymousByDefault,
}: {
  viewerId: string;
  windows: PublicationWindow[];
  initialDrafts: PublicationDraft[];
  owners: Record<string, OwnerView>;
  anonymousByDefault: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<StudioTab>('drafts');
  const [stage, setStage] = useState<StudioStage>('select');
  const [issueDate, setIssueDate] = useState(windows[0]?.issueDate ?? '');
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<PublicationRect>({ x: 2, y: 2, width: 12, height: 10 });
  const [draft, setDraft] = useState<PublicationDraft | null>(null);
  const [blocks, setBlocks] = useState<PublicationBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(anonymousByDefault);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);

  const activeWindow = windows.find((window) => window.issueDate === issueDate) ?? windows[0];
  const slots = useMemo(() => activeWindow?.slots ?? [], [activeWindow]);
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;
  const outsideBlocks = draft ? blocks.filter((block) => !contains(draft.rect, block)) : [];
  const area = selection.width * selection.height;

  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [dirty]);

  const reservedPeople = useMemo(
    () =>
      slots
        .filter((slot) => slot.page === page && slot.status === 'reserved' && slot.ownerId !== viewerId && !slot.anonymous)
        .map((slot) => ({ slot, owner: owners[slot.ownerId] }))
        .filter((entry) => entry.owner?.visible),
    [owners, page, slots, viewerId],
  );

  function run(action: () => Promise<PublicationMutationResult>, done: (result: Extract<PublicationMutationResult, { ok: true }>) => void) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setNotice({ tone: 'error', text: result.message });
        return;
      }
      done(result);
      router.refresh();
    });
  }

  function beginEditing() {
    run(
      () => startPublicationDraftAction({ issueDate, page, rect: selection, anonymous }),
      (result) => {
        setDraft(result.draft);
        setSelection(result.draft.rect);
        setBlocks(result.draft.blocks);
        setAnonymous(result.draft.anonymous);
        setStage('edit');
        setDirty(false);
        setNotice({ tone: 'info', text: 'Taslak açıldı. Rezervasyon isteğe bağlıdır; düzenlemeye doğrudan devam edebilirsin.' });
      },
    );
  }

  function save(submit = false, after?: (saved: PublicationDraft) => void) {
    if (!draft || outsideBlocks.length) return;
    run(
      () => savePublicationDraftAction({ draftId: draft.id, blocks, anonymous, revision: draft.revision, submit }),
      (result) => {
        setDraft(result.draft);
        setBlocks(result.draft.blocks);
        setDirty(false);
        setNotice({ tone: 'success', text: submit ? 'Tasarım kaydedildi; ödeme önizlemesi hazır.' : 'Taslak kaydedildi.' });
        after?.(result.draft);
      },
    );
  }

  function updateBlock(patch: Partial<PublicationBlock>) {
    if (!selectedBlock) return;
    setBlocks((current) => current.map((block) => (block.id === selectedBlock.id ? { ...block, ...patch } : block)));
    setDirty(true);
  }

  function addBlock(type: PublicationBlock['type']) {
    if (!draft) return;
    const block = newBlock(type, draft.rect);
    setBlocks((current) => [...current, block]);
    setSelectedBlockId(block.id);
    setDirty(true);
  }

  function reserve() {
    if (!draft) return;
    const reserveSaved = (saved: PublicationDraft) => {
      run(
        () => reservePublicationAreaAction({ draftId: saved.id, revision: saved.revision }),
        (result) => {
          setDraft(result.draft);
          setNotice({ tone: 'success', text: 'Alan niyet rezervasyonu olarak işaretlendi. Kesin hak ödeme tamamlanınca oluşur.' });
        },
      );
    };
    if (dirty) save(false, reserveSaved);
    else reserveSaved(draft);
  }

  function changeDraftRect() {
    if (!draft || sameRect(draft.rect, selection)) return;
    if (draft.blocks.length && !window.confirm('Alan değişince mevcut bloklar bozulmadan arşive taşınacak. Devam edilsin mi?')) return;
    run(
      () => resizePublicationDraftAction({ draftId: draft.id, rect: selection, revision: draft.revision }),
      (result) => {
        setDraft(result.draft);
        setBlocks([]);
        setSelectedBlockId(null);
        setDirty(false);
        setNotice({ tone: 'info', text: 'Alan değişti; önceki tasarım blokları arşive taşındı.' });
      },
    );
  }

  function pay() {
    if (!draft) return;
    run(
      () => purchasePublicationAreaAction({ draftId: draft.id, revision: draft.revision }),
      (result) => {
        setDraft(result.draft);
        setNotice({ tone: 'success', text: `Demo ödeme kontrolü tamamlandı. ${result.price ?? 0}₺ tutarlı alan kesinleşti.` });
      },
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <header className="rounded-3xl border border-accent/25 bg-[radial-gradient(circle_at_top_left,rgba(61,155,255,.19),transparent_45%)] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-accent">nGazete</p>
            <h1 className="mt-1 text-3xl font-black sm:text-5xl">Yayın Atölyesi</h1>
            <p className="mt-2 max-w-2xl text-fg-muted">A4 oranındaki 30×40 birimlik sayfalarda alan seç, tasarla ve yayın hakkını güvenle kesinleştir.</p>
          </div>
          <Link href="/newspaper" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 font-semibold hover:bg-bg-hover">
            <Icon name="newspaper" size={18} /> nGazete’yi aç
          </Link>
        </div>
        <div role="tablist" aria-label="Yayın Atölyesi bölümleri" className="filter-strip mt-5 gap-2">
          {([
            ['drafts', 'Taslaklar'],
            ['guide', 'Rehber'],
            ['resources', 'Kaynaklar'],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`min-h-10 rounded-full px-4 text-sm font-bold ${tab === key ? 'bg-accent text-accent-fg' : 'border border-line bg-bg-raised text-fg-muted'}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {notice ? (
        <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${notice.tone === 'error' ? 'border-danger/40 bg-danger-soft text-danger' : notice.tone === 'success' ? 'border-success/40 bg-success-soft text-success' : 'border-accent/35 bg-accent-soft text-fg'}`}>
          {notice.text}
        </p>
      ) : null}

      {tab === 'guide' ? <Guide /> : null}
      {tab === 'resources' ? <Resources /> : null}

      {tab === 'drafts' && stage === 'select' ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="min-w-0 p-4 sm:p-6">
            <h2 className="text-xl font-black">1. Sayı ve alan seç</h2>
            <p className="mt-1 text-sm text-fg-muted">Sonraki yedi açık gazetenin boş, rezerve ve satın alınmış alanları canlı olarak gösterilir.</p>
            <div className="story-strip mt-4 flex min-w-0 gap-2 pb-2" role="group" tabIndex={0} aria-label="Açık gazete taslakları">
              {windows.map((window) => (
                <button key={window.issueDate} type="button" onClick={() => setIssueDate(window.issueDate)} className={`min-w-[154px] rounded-2xl border p-3 text-left ${window.issueDate === issueDate ? 'border-accent bg-accent-soft' : 'border-line bg-bg-sunken'}`}>
                  <span className="block text-sm font-bold">{formatDate(`${window.issueDate}T09:00:00+03:00`)}</span>
                  <span className="mt-1 block text-xs text-fg-muted">Kapanış {formatDateTime(window.closesAt)}</span>
                </button>
              ))}
            </div>
            <div className="filter-strip my-4 gap-2" role="group" aria-label="Gazete sayfası">
              {[1, 2, 3, 4, 5].map((number) => <button key={number} type="button" onClick={() => setPage(number)} className={`min-h-10 rounded-full px-4 font-bold ${page === number ? 'bg-accent text-accent-fg' : 'border border-line'}`}>Sayfa {number}</button>)}
            </div>
            <PageGrid page={page} slots={slots} value={selection} onChange={setSelection} />
          </Card>

          <aside className="min-w-0 space-y-4">
            <Card className="space-y-4 p-4">
              <h2 className="text-lg font-black">Alan özeti</h2>
              <RectFields value={selection} onChange={setSelection} />
              <dl className="grid grid-cols-2 gap-3 rounded-xl bg-bg-sunken p-3 text-sm">
                <div><dt className="text-fg-muted">Alan</dt><dd className="text-lg font-black">{area} birim</dd></div>
                <div><dt className="text-fg-muted">Tahmini tutar</dt><dd className="text-lg font-black">{area * UNIT_PRICE}₺</dd></div>
              </dl>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--accent)]" /><span>Bu taslağı anonim düzenle <span className="block text-xs text-fg-muted">Rezervasyon profilini göstermez.</span></span></label>
              <Button type="button" tone="gradient" onClick={beginEditing} disabled={pending || !activeWindow?.open} className="w-full">Düzenlemeye başla</Button>
              <p className="text-xs text-fg-muted">Rezervasyon zorunlu değildir. Birim fiyatı şimdilik {UNIT_PRICE}₺’dir ve ödeme öncesi yeniden hesaplanır.</p>
            </Card>
            {initialDrafts.length ? (
              <Card className="p-4"><h2 className="font-black">Yarım kalanlar</h2><div className="mt-3 space-y-2">{initialDrafts.slice(0, 5).map((entry) => <button key={entry.id} type="button" onClick={() => { setDraft(entry); setIssueDate(entry.issueDate); setPage(entry.page); setSelection(entry.rect); setBlocks(entry.blocks); setAnonymous(entry.anonymous); setStage(entry.status === 'submitted' ? 'preview' : 'edit'); }} className="block w-full rounded-xl border border-line p-3 text-left hover:bg-bg-hover"><span className="font-bold">{formatDate(`${entry.issueDate}T09:00:00+03:00`)} · Sayfa {entry.page}</span><span className="block text-xs text-fg-muted">{entry.rect.width}×{entry.rect.height} · {entry.status}</span></button>)}</div></Card>
            ) : null}
          </aside>
        </div>
      ) : null}

      {tab === 'drafts' && stage === 'edit' && draft ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="min-w-0 p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">2. Tasarla</h2><p className="text-sm text-fg-muted">{formatDate(`${draft.issueDate}T09:00:00+03:00`)} · Sayfa {draft.page} · {draft.rect.width * draft.rect.height} birim</p></div><Badge tone={dirty ? 'warning' : 'success'}>{dirty ? 'Kaydedilmemiş değişiklik' : 'Kaydedildi'}</Badge></div>
            <DesignCanvas draft={draft} blocks={blocks} selectedId={selectedBlockId} onSelect={setSelectedBlockId} />
          </Card>
          <aside className="min-w-0 space-y-4">
            {outsideBlocks.length ? <p role="alert" className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger">{outsideBlocks.length} blok seçili alanın dışında. Kırmızı bloklar düzelmeden taslak kaydedilemez veya gönderilemez.</p> : null}
            <Card className="p-4"><h3 className="font-black">Blok ekle</h3><div className="filter-strip mt-3 gap-2"><Button type="button" tone="secondary" onClick={() => addBlock('markdown')}><Icon name="text" size={16} />Yazı</Button><Button type="button" tone="secondary" onClick={() => addBlock('image')}><Icon name="image" size={16} />Görsel</Button><Button type="button" tone="secondary" onClick={() => addBlock('shape')}><Icon name="spark" size={16} />Grafik</Button></div></Card>
            {selectedBlock ? (
              <Card className="space-y-3 p-4"><div className="flex items-center justify-between"><h3 className="font-black">Seçili blok</h3><button type="button" className="text-sm font-bold text-danger" onClick={() => { setBlocks((current) => current.filter((block) => block.id !== selectedBlock.id)); setSelectedBlockId(null); setDirty(true); }}>Kaldır</button></div>
                <RectFields value={selectedBlock} onChange={(rect) => updateBlock(rect)} />
                <label className="block text-xs font-semibold text-fg-muted">{selectedBlock.type === 'image' ? 'Görsel URL’si' : 'İçerik'}<textarea value={selectedBlock.content} onChange={(event) => updateBlock({ content: event.target.value })} rows={selectedBlock.type === 'markdown' ? 6 : 2} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2 text-fg" /></label>
                {selectedBlock.type === 'image' ? <><label className="block text-xs font-semibold text-fg-muted">Alternatif metin<input value={selectedBlock.altText} onChange={(event) => updateBlock({ altText: event.target.value })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2 text-fg" /></label><label className="block text-xs font-semibold text-fg-muted">Kırpma<select value={selectedBlock.objectFit} onChange={(event) => updateBlock({ objectFit: event.target.value as 'cover' | 'contain' })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2 text-fg"><option value="cover">Alanı doldur</option><option value="contain">Görselin tamamı</option></select></label></> : null}
                <label className="block text-xs font-semibold text-fg-muted">Köşe yuvarlaklığı: {selectedBlock.borderRadius}px<input type="range" min="0" max="48" value={selectedBlock.borderRadius} onChange={(event) => updateBlock({ borderRadius: Number(event.target.value) })} className="mt-1 w-full accent-[var(--accent)]" /></label>
              </Card>
            ) : null}
            <Card className="space-y-3 p-4"><h3 className="font-black">Alanı değiştir</h3><p className="text-xs text-fg-muted">Ölçü değişirse canlı bloklar arşive taşınır.</p><RectFields value={selection} onChange={setSelection} /><Button type="button" tone="secondary" onClick={changeDraftRect} disabled={sameRect(draft.rect, selection) || pending} className="w-full">Yeni alanı uygula</Button></Card>
            {draft.archivedBlocks.length ? <Card className="p-4"><h3 className="font-black">Tasarım arşivi</h3><div className="mt-2 space-y-2">{draft.archivedBlocks.map((block) => <button key={block.id} type="button" onClick={() => { const copy = { ...block, id: globalThis.crypto.randomUUID(), archived: false }; setBlocks((current) => [...current, copy]); setSelectedBlockId(copy.id); setDirty(true); }} className="w-full rounded-xl border border-line p-2 text-left text-sm hover:bg-bg-hover">{block.type} · {block.width}×{block.height} <span className="block text-xs text-fg-muted">Bozulmadan çalışma alanına kopyala</span></button>)}</div></Card> : null}
            <div className="grid grid-cols-2 gap-2"><Button type="button" tone="secondary" onClick={() => save(false)} disabled={pending || outsideBlocks.length > 0}>Kaydet</Button><Button type="button" tone="secondary" onClick={reserve} disabled={pending || outsideBlocks.length > 0}>Rezerve et</Button><Button type="button" tone="gradient" onClick={() => save(true, () => setStage('preview'))} disabled={pending || outsideBlocks.length > 0 || blocks.length === 0} className="col-span-2">Gönder ve önizle</Button></div>
          </aside>
        </div>
      ) : null}

      {tab === 'drafts' && stage === 'preview' && draft ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="min-w-0 p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-black uppercase tracking-widest text-accent">Son önizleme</p><h2 className="text-2xl font-black">Gazetenin {draft.page}. sayfası</h2></div><Button type="button" tone="secondary" onClick={() => setStage('edit')}>Düzenlemeye dön</Button></div><DesignCanvas draft={draft} blocks={blocks} selectedId={null} onSelect={() => undefined} /></Card>
          <aside className="min-w-0 space-y-4"><Card className="space-y-4 p-5"><h2 className="text-xl font-black">Ödeme özeti</h2><dl className="space-y-2 text-sm"><div className="flex justify-between"><dt>Tarih</dt><dd className="font-bold">{formatDate(`${draft.issueDate}T09:00:00+03:00`)}</dd></div><div className="flex justify-between"><dt>Sayfa</dt><dd className="font-bold">{draft.page}/5</dd></div><div className="flex justify-between"><dt>Alan</dt><dd className="font-bold">{draft.rect.width * draft.rect.height} birim</dd></div><div className="flex justify-between"><dt>Birim fiyatı</dt><dd className="font-bold">{UNIT_PRICE}₺</dd></div><div className="flex justify-between border-t border-line pt-3 text-lg"><dt>Toplam</dt><dd className="font-black">{draft.rect.width * draft.rect.height * UNIT_PRICE}₺</dd></div></dl><p className="rounded-xl bg-bg-sunken p-3 text-xs text-fg-muted">Öde düğmesi para çekmeden önce sayfa, tarih ve alanı sunucuda yeniden sorgular. Başkası alanı satın aldıysa işlem başlamaz.</p><Button type="button" tone="gradient" onClick={pay} disabled={pending || draft.status === 'paid'} className="w-full">{draft.status === 'paid' ? 'Alan kesinleşti' : 'Çakışmayı denetle ve öde'}</Button></Card><Button type="button" tone="ghost" onClick={() => setStage('select')} className="w-full">Başka bir sayı seç</Button></aside>
        </div>
      ) : null}

      {tab === 'drafts' && reservedPeople.length ? (
        <Card className="p-4"><h2 className="font-black">Bu sayfada rezervasyon yapanlar</h2><div className="filter-strip mt-3 gap-2">{reservedPeople.map(({ slot, owner }) => <div key={slot.id} className="rounded-xl border border-line bg-bg-sunken p-3 text-sm"><span className="font-bold">{owner.displayName}</span><span className="block text-xs text-fg-muted">{slot.rect.width}×{slot.rect.height} birim</span>{owner.canMessage ? <Link href={`/profile/${owner.username}`} className="mt-2 inline-flex min-h-8 items-center gap-1 font-bold text-accent"><Icon name="message" size={15} /> Mesaj isteği gönder</Link> : <span className="mt-2 block text-xs text-fg-muted">Mesajlara kapalı</span>}</div>)}</div></Card>
      ) : null}
    </div>
  );
}

function Guide() {
  return <div className="grid gap-4 md:grid-cols-3"><Card className="p-5"><Badge tone="accent">1</Badge><h2 className="mt-3 text-lg font-black">Alan seç</h2><p className="mt-1 text-sm text-fg-muted">30×40 ızgarada herhangi bir dörtgen seç. Beş sayfanın doluluklarını karşılaştır.</p></Card><Card className="p-5"><Badge tone="accent">2</Badge><h2 className="mt-3 text-lg font-black">Tasarla veya rezerve et</h2><p className="mt-1 text-sm text-fg-muted">Rezervasyon yalnızca niyet bildirir. Tasarımına rezervasyon olmadan da başlayabilirsin.</p></Card><Card className="p-5"><Badge tone="accent">3</Badge><h2 className="mt-3 text-lg font-black">Kaydet ve kesinleştir</h2><p className="mt-1 text-sm text-fg-muted">Gönder taslağı kaydeder. Ödeme öncesi kesin alan çakışması yeniden denetlenir.</p></Card><Card className="p-5 md:col-span-3"><h2 className="text-lg font-black">Yayın saati</h2><p className="mt-1 text-sm text-fg-muted">Bir sonraki günün taslağı 20.00’de kapanır; gazete 06.00’da yayımlanır. Yayınlanan her sayıdan sonra yedinci yeni taslak otomatik açılır.</p></Card></div>;
}

function Resources() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Card className="p-5"><Icon name="text" size={24} /><h2 className="mt-3 font-black">Markdown kısa rehberi</h2><pre className="mt-3 overflow-auto rounded-xl bg-bg-sunken p-3 text-xs"># Başlık{`\n`}**kalın** ve *italik*{`\n`}- liste maddesi</pre></Card><Card className="p-5"><div className="h-24 rounded-2xl bg-[radial-gradient(circle,#3D9BFF_2px,transparent_3px)] [background-size:18px_18px]" /><h2 className="mt-3 font-black">Nokta dokusu</h2><p className="text-sm text-fg-muted">Ücretsiz · statik grafik</p></Card><Card className="p-5"><div className="h-24 rounded-2xl bg-[linear-gradient(120deg,#35C9E8,#3D9BFF,#3156F5)] motion-safe:animate-pulse" /><h2 className="mt-3 font-black">Akış gradyanı</h2><p className="text-sm text-fg-muted">Abonelik · hareketli grafik</p></Card><Card className="p-5"><div className="flex h-24 items-center justify-center rounded-2xl border border-accent/30 bg-accent-soft text-4xl font-black text-accent">N</div><h2 className="mt-3 font-black">N çerçevesi</h2><p className="text-sm text-fg-muted">Tek seferlik satın alma</p></Card></div>;
}
