'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from 'react';

import {
  activatePublicationSubscriptionAction,
  purchasePublicationAreaAction,
  reservePublicationAreaAction,
  resizePublicationDraftAction,
  savePublicationDraftAction,
  startPublicationDraftAction,
  uploadPublicationCreativeAction,
} from '@/actions/publication';
import { FiveNMark } from '@/components/brand/FiveNMark';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/time';
import type { PublicationMutationResult, PublicationWindow } from '@/lib/data/store';
import type {
  PublicationBlock,
  PublicationButtonVariant,
  PublicationDraft,
  PublicationRect,
  PublicationSlot,
} from '@/types/domain';

const PAGE_COLUMNS = 30;
const PAGE_ROWS = 40;
const UNIT_PRICE = 10;

type StudioTab = 'drafts' | 'guide' | 'membership';
type StudioStage = 'select' | 'edit' | 'preview';
type Corner = 'nw' | 'ne' | 'sw' | 'se';

interface OwnerView {
  id: string;
  username: string;
  displayName: string;
  avatarTone: string;
  kind: 'person' | 'organization';
  visible: boolean;
  canMessage: boolean;
}

const BUTTON_PRESETS: Array<{
  variant: Exclude<PublicationButtonVariant, 'gradient'>;
  color: string;
  background: string;
}> = [
  { variant: 'pill', color: '#FFFFFF', background: '#2563EB' },
  { variant: 'rounded', color: '#07101F', background: '#38BDF8' },
  { variant: 'square', color: '#FFFFFF', background: '#0F172A' },
  { variant: 'outline', color: '#1D4ED8', background: '#FFFFFF' },
];

function contains(parent: PublicationRect, child: PublicationRect): boolean {
  return (
    child.x >= parent.x &&
    child.y >= parent.y &&
    child.x + child.width <= parent.x + parent.width &&
    child.y + child.height <= parent.y + parent.height
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

function clampRect(rect: PublicationRect): PublicationRect {
  const width = Math.max(1, Math.min(PAGE_COLUMNS, Math.round(rect.width)));
  const height = Math.max(1, Math.min(PAGE_ROWS, Math.round(rect.height)));
  return {
    x: Math.max(0, Math.min(PAGE_COLUMNS - width, Math.round(rect.x))),
    y: Math.max(0, Math.min(PAGE_ROWS - height, Math.round(rect.y))),
    width,
    height,
  };
}

function makeId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function creativeBlock(path: string, altText: string, rect: PublicationRect): PublicationBlock {
  return {
    id: makeId('creative'),
    role: 'creative',
    type: 'image',
    ...rect,
    content: path,
    altText,
    color: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    objectFit: 'contain',
    opacity: 1,
    animation: 'none',
    archived: false,
  };
}

function ctaBlock(
  rect: PublicationRect,
  count: number,
  subscriber: boolean,
  input: {
    label: string;
    linkUrl: string;
    variant: PublicationButtonVariant;
    color: string;
    background: string;
    gradientTo: string;
    animation: PublicationBlock['animation'];
  },
): PublicationBlock {
  const width = Math.min(Math.max(5, Math.floor(rect.width * 0.42)), rect.width);
  const height = Math.min(3, rect.height);
  return {
    id: makeId('cta'),
    role: 'cta',
    type: 'shape',
    x: rect.x + Math.max(0, rect.width - width - 1),
    y: rect.y + Math.max(0, rect.height - height - 1 - count * 3),
    width,
    height,
    content: input.label.trim(),
    linkUrl: input.linkUrl.trim(),
    altText: '',
    color: input.color,
    backgroundColor: input.background,
    gradientFrom: input.background,
    gradientTo: input.gradientTo,
    buttonVariant: subscriber ? input.variant : input.variant === 'gradient' ? 'rounded' : input.variant,
    borderRadius: input.variant === 'pill' ? 999 : input.variant === 'square' ? 2 : 10,
    objectFit: 'contain',
    opacity: 1,
    animation: subscriber ? input.animation : 'none',
    archived: false,
  };
}

function RectFields({ value, onChange, labelPrefix = '' }: {
  value: PublicationRect;
  onChange: (value: PublicationRect) => void;
  labelPrefix?: string;
}) {
  const fields: Array<{ key: keyof PublicationRect; label: string; min: number; max: number }> = [
    { key: 'x', label: 'X', min: 0, max: 29 },
    { key: 'y', label: 'Y', min: 0, max: 39 },
    { key: 'width', label: 'Genişlik', min: 1, max: 30 },
    { key: 'height', label: 'Yükseklik', min: 1, max: 40 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {fields.map((field) => (
        <label key={field.key} className="text-xs font-semibold text-fg-muted">
          {labelPrefix}{field.label}
          <input
            type="number"
            min={field.min}
            max={field.max}
            value={value[field.key]}
            onChange={(event) => onChange(clampRect({ ...value, [field.key]: Number(event.target.value) }))}
            className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg-sunken px-2 text-fg"
          />
        </label>
      ))}
    </div>
  );
}

function pointInPage(element: HTMLDivElement, event: ReactPointerEvent): { x: number; y: number } {
  const bounds = element.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(PAGE_COLUMNS - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * PAGE_COLUMNS))),
    y: Math.max(0, Math.min(PAGE_ROWS - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * PAGE_ROWS))),
  };
}

function AreaSelector({ page, slots, value, onChange, disabled = false }: {
  page: number;
  slots: PublicationSlot[];
  value: PublicationRect;
  onChange: (rect: PublicationRect) => void;
  disabled?: boolean;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const operationRef = useRef<
    | { kind: 'draw'; anchor: { x: number; y: number }; pointerId: number }
    | { kind: 'move'; anchor: { x: number; y: number }; origin: PublicationRect; pointerId: number }
    | { kind: 'resize'; anchor: { x: number; y: number }; origin: PublicationRect; corner: Corner; pointerId: number }
    | null
  >(null);

  function start(event: ReactPointerEvent, operation: NonNullable<typeof operationRef.current>) {
    if (disabled || !pageRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    operationRef.current = operation;
    pageRef.current.setPointerCapture(event.pointerId);
  }

  function finish(pointerId?: number) {
    if (pointerId !== undefined && pageRef.current?.hasPointerCapture(pointerId)) pageRef.current.releasePointerCapture(pointerId);
    operationRef.current = null;
  }

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const operation = operationRef.current;
    const element = pageRef.current;
    if (!operation || !element || operation.pointerId !== event.pointerId) return;
    const current = pointInPage(element, event);
    const dx = current.x - operation.anchor.x;
    const dy = current.y - operation.anchor.y;
    if (operation.kind === 'draw') {
      onChange({
        x: Math.min(operation.anchor.x, current.x),
        y: Math.min(operation.anchor.y, current.y),
        width: Math.abs(operation.anchor.x - current.x) + 1,
        height: Math.abs(operation.anchor.y - current.y) + 1,
      });
      return;
    }
    if (operation.kind === 'move') {
      onChange(clampRect({ ...operation.origin, x: operation.origin.x + dx, y: operation.origin.y + dy }));
      return;
    }
    let { x, y, width, height } = operation.origin;
    if (operation.corner.includes('e')) width = Math.max(1, operation.origin.width + dx);
    if (operation.corner.includes('s')) height = Math.max(1, operation.origin.height + dy);
    if (operation.corner.includes('w')) { x = operation.origin.x + dx; width = operation.origin.width - dx; }
    if (operation.corner.includes('n')) { y = operation.origin.y + dy; height = operation.origin.height - dy; }
    if (width < 1 || height < 1) return;
    onChange(clampRect({ x, y, width, height }));
  }

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div
        ref={pageRef}
        role="application"
        aria-label={`${page}. sayfa, 30 sütun ve 40 satır alan seçici`}
        className={`publication-grid relative aspect-[3/4] touch-none overflow-hidden rounded-xl border border-line-strong bg-white ${disabled ? '' : 'cursor-crosshair'}`}
        onPointerDown={(event) => {
          if (disabled || !pageRef.current || event.target !== event.currentTarget) return;
          const anchor = pointInPage(pageRef.current, event);
          start(event, { kind: 'draw', anchor, pointerId: event.pointerId });
          onChange({ x: anchor.x, y: anchor.y, width: 1, height: 1 });
        }}
        onPointerMove={move}
        onPointerUp={(event) => finish(event.pointerId)}
        onPointerCancel={(event) => finish(event.pointerId)}
        onLostPointerCapture={() => finish()}
      >
        {slots.filter((slot) => slot.page === page).map((slot) => (
          <div
            key={slot.id}
            role="img"
            aria-label={`${slot.status === 'paid' ? 'Kesinleşmiş' : 'Rezerve'} alan`}
            className={`pointer-events-none absolute z-10 border-2 ${slot.status === 'paid' ? 'border-blue-800 bg-blue-500/45' : 'border-dashed border-cyan-700 bg-cyan-400/25'}`}
            style={rectStyle(slot.rect)}
          />
        ))}
        <button
          type="button"
          aria-label="Seçili alanı taşı"
          className="absolute z-20 touch-none border-2 border-accent bg-accent/20 shadow-[inset_0_0_0_1px_white] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={rectStyle(value)}
          onPointerDown={(event) => {
            if (!pageRef.current) return;
            start(event, { kind: 'move', anchor: pointInPage(pageRef.current, event), origin: value, pointerId: event.pointerId });
          }}
        >
          {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <span
              key={corner}
              aria-hidden="true"
              className={`studio-resize-handle studio-resize-handle--${corner}`}
              onPointerDown={(event) => {
                if (!pageRef.current) return;
                start(event, { kind: 'resize', anchor: pointInPage(pageRef.current, event), origin: value, corner, pointerId: event.pointerId });
              }}
            />
          ))}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-fg-muted" aria-label="Alan durumu göstergeleri">
        <span className="inline-flex items-center gap-2"><i className="h-3 w-6 rounded-sm border-2 border-blue-800 bg-blue-500/45" />Kesinleşmiş</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-6 rounded-sm border-2 border-dashed border-cyan-700 bg-cyan-400/25" />Rezerve</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-6 rounded-sm border-2 border-accent bg-accent/20" />Seçimin</span>
      </div>
    </div>
  );
}

function ctaStyle(block: PublicationBlock): React.CSSProperties {
  return {
    color: block.color,
    background: block.buttonVariant === 'gradient'
      ? `linear-gradient(115deg, ${block.gradientFrom ?? '#35C9E8'}, ${block.gradientTo ?? '#3156F5'})`
      : block.buttonVariant === 'outline' ? '#FFFFFF' : block.backgroundColor,
    borderRadius: block.buttonVariant === 'pill' ? '999px' : block.buttonVariant === 'square' ? '2px' : '10px',
    border: block.buttonVariant === 'outline' ? `2px solid ${block.color}` : '1px solid rgb(255 255 255 / 0.2)',
  };
}

function PlacementCanvas({ draft, blocks, setBlocks, selectedIds, setSelectedIds, subscriber, onLimit, readonly = false }: {
  draft: PublicationDraft;
  blocks: PublicationBlock[];
  setBlocks: Dispatch<SetStateAction<PublicationBlock[]>>;
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  subscriber: boolean;
  onLimit: (message: string) => void;
  readonly?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<PublicationBlock[]>([]);
  const operationRef = useRef<{
    kind: 'move' | 'resize';
    pointerId: number;
    startX: number;
    startY: number;
    origins: Map<string, PublicationRect>;
    corner?: Corner;
  } | null>(null);

  function begin(event: ReactPointerEvent, ids: string[], kind: 'move' | 'resize', corner?: Corner) {
    if (readonly || !canvasRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = canvasRef.current.getBoundingClientRect();
    const origins = new Map<string, PublicationRect>();
    blocks.filter((block) => ids.includes(block.id)).forEach((block) => origins.set(block.id, block));
    operationRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: ((event.clientX - bounds.left) / bounds.width) * PAGE_COLUMNS,
      startY: ((event.clientY - bounds.top) / bounds.height) * PAGE_ROWS,
      origins,
      corner,
    };
    canvasRef.current.setPointerCapture(event.pointerId);
  }

  function finish(pointerId?: number) {
    if (pointerId !== undefined && canvasRef.current?.hasPointerCapture(pointerId)) canvasRef.current.releasePointerCapture(pointerId);
    operationRef.current = null;
  }

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const operation = operationRef.current;
    const canvas = canvasRef.current;
    if (!operation || !canvas || operation.pointerId !== event.pointerId) return;
    const bounds = canvas.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * PAGE_COLUMNS;
    const y = ((event.clientY - bounds.top) / bounds.height) * PAGE_ROWS;
    const dx = Math.round(x - operation.startX);
    const dy = Math.round(y - operation.startY);
    setBlocks((current) => current.map((block) => {
      const origin = operation.origins.get(block.id);
      if (!origin) return block;
      if (operation.kind === 'move') return { ...block, ...clampRect({ ...origin, x: origin.x + dx, y: origin.y + dy }) };
      let { x: nextX, y: nextY, width, height } = origin;
      const corner = operation.corner ?? 'se';
      if (corner.includes('e')) width = Math.max(1, origin.width + dx);
      if (corner.includes('s')) height = Math.max(1, origin.height + dy);
      if (corner.includes('w')) { nextX = origin.x + dx; width = origin.width - dx; }
      if (corner.includes('n')) { nextY = origin.y + dy; height = origin.height - dy; }
      if (width < 1 || height < 1) return block;
      return { ...block, ...clampRect({ x: nextX, y: nextY, width, height }) };
    }));
  }

  function removeSelected() {
    setBlocks((current) => current.filter((block) => !selectedIds.includes(block.id)));
    setSelectedIds([]);
  }

  function pasteCopied() {
    const copiedButtons = copyRef.current.filter((block) => block.role === 'cta');
    if (!copiedButtons.length) return;
    setBlocks((current) => {
      const limit = subscriber ? 3 : 1;
      const available = Math.max(0, limit - current.filter((block) => block.role === 'cta').length);
      if (!available) {
        onLimit(`Bu hesap en fazla ${limit} CTA butonu kullanabilir.`);
        return current;
      }
      const additions = copiedButtons.slice(0, available).map((block, index) => ({
        ...block,
        id: makeId('cta-copy'),
        x: Math.min(PAGE_COLUMNS - block.width, block.x + index + 1),
        y: Math.min(PAGE_ROWS - block.height, block.y + index + 1),
      }));
      setSelectedIds(additions.map((block) => block.id));
      return [...current, ...additions];
    });
  }

  return (
    <div
      ref={canvasRef}
      data-studio-canvas
      role="application"
      aria-label="İlan yerleşim tuvali"
      tabIndex={readonly ? -1 : 0}
      className="publication-grid relative mx-auto aspect-[3/4] w-full max-w-[610px] touch-none overflow-hidden rounded-xl border border-line-strong bg-white shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      onPointerMove={move}
      onPointerUp={(event) => finish(event.pointerId)}
      onPointerCancel={(event) => finish(event.pointerId)}
      onLostPointerCapture={() => finish()}
      onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedIds([]); }}
      onKeyDown={(event) => {
        if (readonly) return;
        const target = event.target as HTMLElement;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
        const command = event.metaKey || event.ctrlKey;
        if (command && event.key.toLowerCase() === 'a') { event.preventDefault(); setSelectedIds(blocks.map((block) => block.id)); return; }
        if (command && event.key.toLowerCase() === 'c') { event.preventDefault(); copyRef.current = blocks.filter((block) => selectedIds.includes(block.id)); return; }
        if (command && event.key.toLowerCase() === 'v') { event.preventDefault(); pasteCopied(); return; }
        if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); return; }
        if (event.key === 'Escape') { setSelectedIds([]); return; }
        const delta = event.shiftKey ? 2 : 1;
        const direction: Record<string, [number, number]> = {
          ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta],
        };
        if (direction[event.key]) {
          event.preventDefault();
          const [dx, dy] = direction[event.key];
          setBlocks((current) => current.map((block) => selectedIds.includes(block.id)
            ? { ...block, ...clampRect({ ...block, x: block.x + dx, y: block.y + dy }) }
            : block));
        }
      }}
    >
      <div className="pointer-events-none absolute z-10 border-2 border-accent bg-accent/5" style={rectStyle(draft.rect)} />
      {blocks.map((block) => {
        const selected = selectedIds.includes(block.id);
        const outside = !contains(draft.rect, block);
        return (
          <button
            key={block.id}
            type="button"
            aria-label={block.role === 'creative' ? 'Yüklenen tasarım' : `CTA butonu: ${block.content}`}
            aria-pressed={selected}
            className={`absolute z-20 touch-none overflow-visible ${outside ? 'outline outline-[3px] outline-red-600' : selected ? 'outline outline-2 outline-accent' : ''} ${subscriber && block.role === 'creative' ? 'publication-subscriber-glow' : ''}`}
            style={{ ...rectStyle(block), transform: 'translateZ(0)' }}
            onClick={(event) => {
              if (readonly) return;
              if (event.shiftKey) setSelectedIds((current) => current.includes(block.id) ? current.filter((id) => id !== block.id) : [...current, block.id]);
              else setSelectedIds([block.id]);
            }}
            onPointerDown={(event) => {
              if (readonly) return;
              const ids = selectedIds.includes(block.id) ? selectedIds : [block.id];
              if (!selectedIds.includes(block.id)) setSelectedIds(ids);
              begin(event, ids, 'move');
            }}
          >
            <span className="pointer-events-none absolute inset-0 overflow-hidden" style={block.role === 'cta' ? ctaStyle(block) : { borderRadius: block.borderRadius }}>
              {block.role === 'creative' ? (
                <Image src={block.content} alt={block.altText} fill unoptimized sizes="(max-width: 767px) 90vw, 610px" style={{ objectFit: block.objectFit }} />
              ) : (
                <span className={`flex h-full w-full items-center justify-center px-2 text-center text-[clamp(7px,1.7cqi,15px)] font-black ${block.animation && block.animation !== 'none' ? `publication-cta--${block.animation}` : ''}`}>{block.content}</span>
              )}
            </span>
            {selected && !readonly ? (['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
              <span key={corner} aria-hidden="true" className={`studio-resize-handle studio-resize-handle--${corner}`} onPointerDown={(event) => begin(event, [block.id], 'resize', corner)} />
            )) : null}
          </button>
        );
      })}
      {blocks.some((block) => !contains(draft.rect, block)) ? (
        <p role="alert" className="absolute inset-x-4 bottom-4 z-40 rounded-xl bg-red-700 px-3 py-2 text-center text-xs font-bold text-white shadow-xl">Kırmızı sınır alan dışında. Kaydetme ve ödeme kapalı.</p>
      ) : null}
    </div>
  );
}

function StudioGuide() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <Icon name="image" size={24} className="text-accent" />
        <h2 className="mt-3 text-xl font-black">Dosyanı hazırla</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-fg-muted">
          <li>Canva veya kullandığın araçta tasarımını tamamla.</li>
          <li>PNG, JPG ya da WebP olarak dışa aktar; en fazla 8 MB.</li>
          <li>Yükledikten sonra tutamaçlarla alanına yerleştir.</li>
          <li>Görsel açıklamasını yaz; erişilebilirlik ve moderasyon için zorunludur.</li>
        </ol>
      </Card>
      <Card className="p-5">
        <Icon name="link" size={24} className="text-accent" />
        <h2 className="mt-3 text-xl font-black">CTA ve yayın</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-fg-muted">
          <li>Standart hesap bir nSosyal bağlantılı buton ekleyebilir.</li>
          <li>Aboneler üç buton, dış bağlantı, gradyan ve hareket kullanabilir.</li>
          <li>Alan dışına taşan öğeler kaydedilmez.</li>
          <li>Ödemeden sonra görsel ve tüm bağlantılar moderasyon kuyruğuna girer.</li>
        </ol>
      </Card>
    </div>
  );
}

function Membership({ subscriber, pending, onActivate }: { subscriber: boolean; pending: boolean; onActivate: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <Badge>Standart</Badge>
        <h2 className="mt-3 text-xl font-black">İlan başına 1 CTA</h2>
        <ul className="mt-3 space-y-2 text-sm text-fg-muted"><li>Hazır şekil ve renk seçenekleri</li><li>Yalnızca nSosyal içi bağlantılar</li><li>Birim başına 10₺</li></ul>
      </Card>
      <Card className={`p-5 ${subscriber ? 'publication-subscriber-card' : ''}`}>
        <Badge tone="accent">Yayınevi · 200₺/ay</Badge>
        <h2 className="mt-3 text-xl font-black">3 CTA ve %5 indirim</h2>
        <ul className="mt-3 space-y-2 text-sm text-fg-muted"><li>nSosyal dışı https bağlantıları</li><li>Özel renk, şekil, gradyan ve hareket</li><li>İlan çevresinde özel yayın vurgusu</li></ul>
        {subscriber ? <p className="mt-5 font-bold text-success">Aboneliğin aktif</p> : (
          <Button type="button" tone="gradient" className="mt-5" onClick={onActivate} disabled={pending}><Icon name="sparkles" size={17} /> Demo aboneliğini etkinleştir</Button>
        )}
      </Card>
    </div>
  );
}

function statusBadge(draft: PublicationDraft) {
  if (draft.moderationStatus === 'approved') return <Badge tone="success">Onaylandı</Badge>;
  if (draft.moderationStatus === 'pending') return <Badge tone="warning">Moderasyonda</Badge>;
  if (draft.moderationStatus === 'rejected' || draft.moderationStatus === 'changes_requested') return <Badge tone="danger">Düzeltme gerekli</Badge>;
  if (draft.status === 'submitted') return <Badge tone="accent">Önizleme hazır</Badge>;
  return <Badge>Taslak</Badge>;
}

export function PublicationStudio({ viewerId, windows, initialDrafts, owners, anonymousByDefault, initialSubscriber }: {
  viewerId: string;
  windows: PublicationWindow[];
  initialDrafts: PublicationDraft[];
  owners: Record<string, OwnerView>;
  anonymousByDefault: boolean;
  initialSubscriber: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<StudioTab>('drafts');
  const [stage, setStage] = useState<StudioStage>('select');
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [subscriber, setSubscriber] = useState(initialSubscriber);
  const [issueDate, setIssueDate] = useState(windows[0]?.issueDate ?? '');
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<PublicationRect>({ x: 2, y: 2, width: 12, height: 10 });
  const [draft, setDraft] = useState<PublicationDraft | null>(null);
  const [blocks, setBlocks] = useState<PublicationBlock[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(anonymousByDefault);
  const [dirty, setDirty] = useState(false);
  const [changingArea, setChangingArea] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [ctaLabel, setCtaLabel] = useState('İncele');
  const [ctaUrl, setCtaUrl] = useState('/feed');
  const [ctaVariant, setCtaVariant] = useState<PublicationButtonVariant>('pill');
  const [ctaColor, setCtaColor] = useState('#FFFFFF');
  const [ctaBackground, setCtaBackground] = useState('#2563EB');
  const [ctaGradientTo, setCtaGradientTo] = useState('#3156F5');
  const [ctaAnimation, setCtaAnimation] = useState<PublicationBlock['animation']>('none');
  const [paidPrice, setPaidPrice] = useState<number | null>(null);

  const activeWindow = windows.find((window) => window.issueDate === issueDate) ?? windows[0];
  const slots = useMemo(() => activeWindow?.slots ?? [], [activeWindow]);
  const creative = blocks.find((block) => block.role === 'creative') ?? null;
  const ctas = blocks.filter((block) => block.role === 'cta');
  const selectedBlock = blocks.find((block) => selectedIds.length === 1 && block.id === selectedIds[0]) ?? null;
  const outsideBlocks = draft ? blocks.filter((block) => !contains(draft.rect, block)) : [];
  const area = selection.width * selection.height;
  const basePrice = area * UNIT_PRICE;
  const estimatedPrice = subscriber ? Math.round(basePrice * 0.95) : basePrice;

  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [dirty]);

  function run(action: () => Promise<PublicationMutationResult>, done: (result: Extract<PublicationMutationResult, { ok: true }>) => void) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) { setNotice({ tone: 'error', text: result.message }); return; }
      done(result);
      router.refresh();
    });
  }

  function beginEditing() {
    if (changingArea && draft) {
      run(
        () => resizePublicationDraftAction({ draftId: draft.id, rect: selection, revision: draft.revision }),
        (result) => {
          setDraft(result.draft); setBlocks([]); setSelectedIds([]); setStage('edit'); setChangingArea(false); setDirty(false);
          setNotice({ tone: 'info', text: 'Yeni alan uygulandı. Önceki dosya ve butonlar arşive alındı.' });
        },
      );
      return;
    }
    run(
      () => startPublicationDraftAction({ issueDate, page, rect: selection, anonymous }),
      (result) => {
        setDraft(result.draft); setSelection(result.draft.rect); setBlocks(result.draft.blocks); setAnonymous(result.draft.anonymous);
        setSubscriber(result.draft.subscriber || subscriber);
        setStage(result.draft.status === 'submitted' || result.draft.status === 'paid' ? 'preview' : 'edit');
        setDirty(false); setNotice(null);
      },
    );
  }

  function openDraft(entry: PublicationDraft) {
    setDraft(entry); setIssueDate(entry.issueDate); setPage(entry.page); setSelection(entry.rect); setBlocks(entry.blocks);
    setAnonymous(entry.anonymous); setSubscriber(entry.subscriber || subscriber);
    setStage(entry.status === 'paid' || entry.status === 'submitted' ? 'preview' : 'edit');
    setTab('drafts'); setDirty(false); setSelectedIds([]); setNotice(null);
  }

  function save(submit = false, after?: (saved: PublicationDraft) => void) {
    if (!draft) return;
    if (outsideBlocks.length) { setNotice({ tone: 'error', text: 'Kırmızı sınırla işaretli öğeleri seçili alanın içine taşı.' }); return; }
    run(
      () => savePublicationDraftAction({ draftId: draft.id, blocks, anonymous, revision: draft.revision, submit }),
      (result) => {
        setDraft(result.draft); setBlocks(result.draft.blocks); setDirty(false);
        setNotice({ tone: 'success', text: submit ? 'Önizleme hazır.' : 'Taslak kaydedildi.' }); after?.(result.draft);
      },
    );
  }

  function uploadCreative() {
    if (!draft || !uploadFile || uploadAlt.trim().length < 3) { setNotice({ tone: 'error', text: 'Bir PNG, JPG veya WebP seç ve görsel açıklamasını yaz.' }); return; }
    const formData = new FormData();
    formData.set('creative', uploadFile);
    setNotice(null);
    startTransition(async () => {
      const result = await uploadPublicationCreativeAction(formData);
      if (!result.ok) { setNotice({ tone: 'error', text: result.message }); return; }
      const next = creativeBlock(result.path, uploadAlt.trim(), draft.rect);
      setBlocks((current) => [...current.filter((block) => block.role !== 'creative'), next]);
      setSelectedIds([next.id]); setUploadFile(null); setDirty(true);
      setNotice({ tone: 'success', text: `${result.fileName} yüklendi.` });
    });
  }

  function addCta() {
    const limit = subscriber ? 3 : 1;
    if (!draft || ctas.length >= limit) { setNotice({ tone: 'error', text: `Bu hesap en fazla ${limit} CTA butonu kullanabilir.` }); return; }
    if (ctaLabel.trim().length < 2) { setNotice({ tone: 'error', text: 'Buton metni en az 2 karakter olmalı.' }); return; }
    const internal = /^\/(?!\/)/.test(ctaUrl.trim());
    const external = /^https:\/\//.test(ctaUrl.trim());
    if (!internal && !(subscriber && external)) {
      setNotice({ tone: 'error', text: subscriber ? 'Geçerli bir /nSosyal veya https bağlantısı gir.' : 'Standart hesapta / ile başlayan bir nSosyal bağlantısı gir.' });
      return;
    }
    const next = ctaBlock(draft.rect, ctas.length, subscriber, {
      label: ctaLabel, linkUrl: ctaUrl, variant: ctaVariant, color: ctaColor,
      background: ctaBackground, gradientTo: ctaGradientTo, animation: ctaAnimation,
    });
    setBlocks((current) => [...current, next]); setSelectedIds([next.id]); setDirty(true);
  }

  function updateSelected(patch: Partial<PublicationBlock>) {
    if (!selectedBlock) return;
    setBlocks((current) => current.map((block) => block.id === selectedBlock.id ? { ...block, ...patch } : block));
    setDirty(true);
  }

  function activateSubscription() {
    startTransition(async () => {
      const result = await activatePublicationSubscriptionAction();
      if (!result.ok) { setNotice({ tone: 'error', text: result.message }); return; }
      setSubscriber(true);
      if (draft) setDraft({ ...draft, subscriber: true });
      setNotice({ tone: 'success', text: `${result.monthlyPrice}₺/ay Yayınevi demo aboneliği etkinleştirildi.` });
      router.refresh();
    });
  }

  function reserve() {
    if (!draft) return;
    save(false, (saved) => run(
      () => reservePublicationAreaAction({ draftId: saved.id, revision: saved.revision }),
      (result) => { setDraft(result.draft); setNotice({ tone: 'success', text: 'Alan rezerve edildi. Ödeme yapılana kadar kesin hak oluşturmaz.' }); },
    ));
  }

  function purchase() {
    if (!draft) return;
    run(
      () => purchasePublicationAreaAction({ draftId: draft.id, revision: draft.revision }),
      (result) => {
        setDraft(result.draft); setPaidPrice(result.price ?? estimatedPrice);
        setNotice({ tone: 'success', text: 'Alan kesinleşti. Görsel ve bağlantılar moderasyon kuyruğuna gönderildi.' });
      },
    );
  }

  const stageTitle = stage === 'select' ? 'Alan seçimi' : stage === 'edit' ? 'Dosya ve CTA' : 'Önizleme';
  const tabButton = (id: StudioTab, icon: 'newspaper' | 'book' | 'sparkles', label: string) => (
    <button type="button" role="tab" aria-selected={tab === id} aria-label={label} onClick={() => setTab(id)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold ${tab === id ? 'bg-accent-soft text-accent ring-1 ring-[var(--accent-line)]' : 'text-fg-muted hover:bg-bg-hover'}`}>
      <Icon name={icon} size={19} />{!menuCollapsed ? <span>{label}</span> : null}
    </button>
  );

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-50 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-bg/95 px-3 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3"><FiveNMark className="h-9 w-14 shrink-0" animated /><div className="min-w-0"><p className="truncate text-[0.65rem] font-black uppercase tracking-[0.28em] text-accent">nGazete üretim alanı</p><h1 className="truncate text-lg font-black">Yayın Atölyesi</h1></div></div>
        <div className="flex items-center gap-2"><Badge tone="accent">{stageTitle}</Badge><Link href="/newspaper" aria-label="Gazeteye dön" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3 text-sm font-bold hover:bg-bg-hover"><Icon name="newspaper" size={16} /><span className="hidden sm:inline">Gazeteye dön</span></Link></div>
      </header>

      <div className="studio-shell" data-collapsed={menuCollapsed ? 'true' : 'false'}>
        <aside className="studio-sidebar border-r border-line bg-bg-sunken p-3">
          <button type="button" aria-expanded={!menuCollapsed} aria-label={menuCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'} onClick={() => setMenuCollapsed((value) => !value)} className="mb-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-bold text-fg-muted hover:bg-bg-hover"><Icon name={menuCollapsed ? 'chevronRight' : 'arrowLeft'} size={17} />{!menuCollapsed ? <span>Menüyü daralt</span> : null}</button>
          <div role="tablist" aria-label="Yayın Atölyesi bölümleri" className="space-y-2">{tabButton('drafts', 'newspaper', 'Taslaklar')}{tabButton('guide', 'book', 'Dosya rehberi')}{tabButton('membership', 'sparkles', 'Yayınevi üyeliği')}</div>
          {!menuCollapsed ? <Card className="mt-5 p-3 text-xs text-fg-muted"><p className="font-bold text-fg">Aktif çalışma</p><p className="mt-2">{issueDate ? formatDate(`${issueDate}T09:00:00Z`) : 'Açık sayı yok'}</p><p className="mt-1">Sayfa {page} · {selection.width}×{selection.height} birim</p>{subscriber ? <span className="mt-2 inline-flex"><Badge tone="accent" icon="sparkles">%5 indirim aktif</Badge></span> : null}</Card> : null}
        </aside>

        <main className="min-w-0 p-3 sm:p-5">
          {notice ? <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-xl border px-4 py-3 text-sm ${notice.tone === 'error' ? 'border-danger/50 bg-danger-soft text-danger' : notice.tone === 'success' ? 'border-success/40 bg-success-soft text-success' : 'border-accent/40 bg-accent-soft text-fg'}`}>{notice.text}</div> : null}
          {tab === 'guide' ? <StudioGuide /> : null}
          {tab === 'membership' ? <Membership subscriber={subscriber} pending={pending} onActivate={activateSubscription} /> : null}

          {tab === 'drafts' && stage === 'select' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.85fr)_minmax(430px,1.15fr)]">
              <Card className="min-w-0 p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">1 · Sayı ve sayfa</p>
                <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2" tabIndex={0} aria-label="Açık gazete sayıları">
                  {windows.map((window) => <button key={window.issueDate} type="button" disabled={changingArea} aria-pressed={issueDate === window.issueDate} onClick={() => setIssueDate(window.issueDate)} className={`min-w-[180px] snap-start rounded-xl border p-3 text-left ${issueDate === window.issueDate ? 'border-accent bg-accent-soft' : 'border-line bg-bg-raised hover:border-accent/60'}`}><strong className="block">{formatDate(`${window.issueDate}T09:00:00Z`)}</strong><span className="mt-1 block text-xs text-fg-muted">Kapanış {formatDateTime(window.closesAt)}</span></button>)}
                </div>
                <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Gazete sayfası">
                  {[1, 2, 3, 4, 5].map((entry) => <button key={entry} type="button" disabled={changingArea} aria-pressed={page === entry} onClick={() => setPage(entry)} className={`min-h-11 rounded-full px-4 text-sm font-bold ${page === entry ? 'bg-accent text-accent-fg' : 'border border-line bg-bg-raised text-fg-muted'}`}>Sayfa {entry}</button>)}
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-accent">2 · Alan</p>
                <div className="mt-3"><RectFields value={selection} onChange={setSelection} /></div>
                <div className="mt-4 rounded-xl bg-bg-sunken p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm text-fg-muted">{area} birim</span><strong className="text-xl">{estimatedPrice}₺</strong></div>{subscriber ? <p className="mt-1 text-xs text-accent"><s className="text-fg-subtle">{basePrice}₺</s> · %5 Yayınevi indirimi</p> : null}</div>
                <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" /><span><strong className="block">Anonim rezervasyon</strong><span className="text-xs text-fg-muted">Profilin alan önizlemesinde gösterilmez.</span></span></label>
                <Button type="button" tone="gradient" className="mt-5 w-full" onClick={beginEditing} disabled={pending || !activeWindow?.open}>{changingArea ? 'Yeni alanı uygula' : 'Dosya yüklemeye geç'} <Icon name="arrowRight" size={17} /></Button>
                {changingArea ? <Button type="button" tone="ghost" className="mt-2 w-full" onClick={() => { setChangingArea(false); setStage('edit'); setSelection(draft!.rect); }}>Vazgeç</Button> : null}
              </Card>
              <Card className="min-w-0 p-4 sm:p-5"><AreaSelector page={page} slots={slots} value={selection} onChange={setSelection} /></Card>
            </div>
          ) : null}

          {tab === 'drafts' && stage === 'edit' && draft ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg-raised p-3">
                <div><strong>{formatDate(`${draft.issueDate}T09:00:00Z`)} · Sayfa {draft.page}</strong><span className="ml-2 text-sm text-fg-muted">{draft.rect.width}×{draft.rect.height} birim</span></div>
                <div className="flex flex-wrap gap-2"><Button type="button" tone="secondary" onClick={() => { setSelection(draft.rect); setChangingArea(true); setStage('select'); }}>Alanı değiştir</Button><Button type="button" tone="secondary" onClick={reserve} disabled={pending || outsideBlocks.length > 0}>Rezerve et</Button><Button type="button" tone="secondary" onClick={() => save(false)} disabled={pending || outsideBlocks.length > 0}>Kaydet</Button><Button type="button" tone="gradient" onClick={() => save(true, () => setStage('preview'))} disabled={pending || !creative || outsideBlocks.length > 0}>Önizle</Button></div>
              </div>

              <div className="studio-upload-layout">
                <section className="space-y-4" aria-label="Dosya ve buton araçları">
                  <Card className="p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Tasarım dosyası</p><h2 className="mt-1 text-lg font-black">PNG, JPG veya WebP</h2>
                    <label className="mt-4 block rounded-xl border border-dashed border-accent/60 bg-accent-soft p-4 text-center text-sm font-bold"><Icon name="upload" size={24} className="mx-auto mb-2 text-accent" /><span>{uploadFile?.name ?? (creative ? 'Tasarımı değiştir' : 'Dosya seç')}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /></label>
                    <label className="mt-3 block text-xs font-bold text-fg-muted">Görsel açıklaması<textarea value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-3 text-sm text-fg" placeholder="Tasarımda görünen ana içerik" /></label>
                    <Button type="button" tone="gradient" className="mt-3 w-full" onClick={uploadCreative} disabled={pending || !uploadFile}>Yükle ve yerleştir</Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-accent">CTA</p><h2 className="mt-1 text-lg font-black">Buton ekle</h2></div><Badge tone={subscriber ? 'accent' : 'neutral'}>{ctas.length}/{subscriber ? 3 : 1}</Badge></div>
                    <label className="mt-3 block text-xs font-bold text-fg-muted">Buton metni<input value={ctaLabel} maxLength={42} onChange={(event) => setCtaLabel(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-bg-sunken px-3 text-sm text-fg" /></label>
                    <label className="mt-3 block text-xs font-bold text-fg-muted">Bağlantı<input value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} placeholder={subscriber ? '/profile/... veya https://...' : '/profile/...'} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-bg-sunken px-3 text-sm text-fg" /></label>
                    <fieldset className="mt-3"><legend className="text-xs font-bold text-fg-muted">Görünüm</legend><div className="mt-2 grid grid-cols-4 gap-2">
                      {BUTTON_PRESETS.map((preset) => <button key={preset.variant} type="button" aria-label={`${preset.variant} buton görünümü`} aria-pressed={ctaVariant === preset.variant && ctaBackground === preset.background} onClick={() => { setCtaVariant(preset.variant); setCtaColor(preset.color); setCtaBackground(preset.background); }} className={`h-11 border-2 ${ctaVariant === preset.variant && ctaBackground === preset.background ? 'border-accent' : 'border-line'}`} style={{ background: preset.background, color: preset.color, borderRadius: preset.variant === 'pill' ? 999 : preset.variant === 'square' ? 2 : 10 }}><span aria-hidden="true" className="mx-auto block h-1.5 w-5 rounded-full bg-current" /></button>)}
                    </div></fieldset>
                    {subscriber ? <div className="mt-3 rounded-xl border border-accent/30 bg-accent-soft p-3"><div className="grid grid-cols-3 gap-2"><label className="text-[0.65rem] font-bold text-fg-muted">Yazı<input type="color" value={ctaColor} onChange={(event) => setCtaColor(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-bg-raised p-1" /></label><label className="text-[0.65rem] font-bold text-fg-muted">Başlangıç<input type="color" value={ctaBackground} onChange={(event) => setCtaBackground(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-bg-raised p-1" /></label><label className="text-[0.65rem] font-bold text-fg-muted">Bitiş<input type="color" value={ctaGradientTo} onChange={(event) => setCtaGradientTo(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-bg-raised p-1" /></label></div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-bold text-fg-muted">Dolgu<select value={ctaVariant} onChange={(event) => setCtaVariant(event.target.value as PublicationButtonVariant)} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg-raised px-2 text-fg"><option value="pill">Oval</option><option value="rounded">Yumuşak</option><option value="square">Köşeli</option><option value="outline">Çerçeve</option><option value="gradient">Gradyan</option></select></label><label className="text-xs font-bold text-fg-muted">Hareket<select value={ctaAnimation ?? 'none'} onChange={(event) => setCtaAnimation(event.target.value as PublicationBlock['animation'])} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg-raised px-2 text-fg"><option value="none">Yok</option><option value="pulse">Nefes</option><option value="shine">Işık geçişi</option><option value="float">Yumuşak yükselme</option></select></label></div></div> : <p className="mt-3 text-xs text-fg-muted">Dış bağlantı, özel gradyan ve hareket Yayınevi üyeliğinde açılır.</p>}
                    <Button type="button" tone="secondary" className="mt-3 w-full" onClick={addCta} disabled={pending || ctas.length >= (subscriber ? 3 : 1)}><Icon name="plus" size={17} /> Butonu ekle</Button>
                  </Card>
                </section>

                <section className="studio-canvas-workspace rounded-2xl border border-line bg-bg-sunken p-3 sm:p-5" aria-label="İlan yerleşimi">
                  <PlacementCanvas draft={draft} blocks={blocks} setBlocks={(next) => { setBlocks(next); setDirty(true); }} selectedIds={selectedIds} setSelectedIds={setSelectedIds} subscriber={subscriber} onLimit={(message) => setNotice({ tone: 'error', text: message })} />
                  <p className="mx-auto mt-3 max-w-[610px] text-center text-xs text-fg-muted">Seç: tıkla · Çoklu seç: Shift+tık · Taşı: sürükle veya ok tuşları · Kopyala/yapıştır: ⌘/Ctrl+C, ⌘/Ctrl+V · Sil: Delete</p>
                </section>

                <aside className="space-y-4" aria-label="Seçili öğe özellikleri">
                  <Card className="p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Seçili öğe</p>
                    {selectedIds.length > 1 ? <p className="mt-3 text-sm font-bold">{selectedIds.length} öğe seçili</p> : selectedBlock ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between gap-2"><strong>{selectedBlock.role === 'creative' ? 'Tasarım dosyası' : 'CTA butonu'}</strong><button type="button" className="min-h-10 rounded-full px-3 text-sm font-bold text-danger hover:bg-danger-soft" onClick={() => { setBlocks((current) => current.filter((block) => block.id !== selectedBlock.id)); setSelectedIds([]); setDirty(true); }}>Sil</button></div>
                        <RectFields value={selectedBlock} onChange={(rect) => updateSelected(rect)} />
                        {selectedBlock.role === 'creative' ? <><label className="block text-xs font-bold text-fg-muted">Görsel açıklaması<textarea value={selectedBlock.altText} onChange={(event) => updateSelected({ altText: event.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-3 text-sm text-fg" /></label><div className="grid grid-cols-2 gap-2" role="group" aria-label="Görsel sığdırma"><button type="button" aria-pressed={selectedBlock.objectFit === 'contain'} onClick={() => updateSelected({ objectFit: 'contain' })} className={`min-h-10 rounded-xl border text-xs font-bold ${selectedBlock.objectFit === 'contain' ? 'border-accent bg-accent-soft text-accent' : 'border-line'}`}>Tamamını göster</button><button type="button" aria-pressed={selectedBlock.objectFit === 'cover'} onClick={() => updateSelected({ objectFit: 'cover' })} className={`min-h-10 rounded-xl border text-xs font-bold ${selectedBlock.objectFit === 'cover' ? 'border-accent bg-accent-soft text-accent' : 'border-line'}`}>Alanı doldur</button></div></> : <><label className="block text-xs font-bold text-fg-muted">Metin<input value={selectedBlock.content} onChange={(event) => updateSelected({ content: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg-sunken px-3 text-sm text-fg" /></label><label className="block text-xs font-bold text-fg-muted">Bağlantı<input value={selectedBlock.linkUrl ?? ''} onChange={(event) => updateSelected({ linkUrl: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg-sunken px-3 text-sm text-fg" /></label>{subscriber ? <div className="grid grid-cols-3 gap-2"><input aria-label="Buton yazı rengi" type="color" value={selectedBlock.color} onChange={(event) => updateSelected({ color: event.target.value })} className="h-10 w-full rounded-lg border border-line p-1" /><input aria-label="Buton başlangıç rengi" type="color" value={selectedBlock.backgroundColor ?? '#2563EB'} onChange={(event) => updateSelected({ backgroundColor: event.target.value, gradientFrom: event.target.value })} className="h-10 w-full rounded-lg border border-line p-1" /><input aria-label="Buton bitiş rengi" type="color" value={selectedBlock.gradientTo ?? '#3156F5'} onChange={(event) => updateSelected({ gradientTo: event.target.value })} className="h-10 w-full rounded-lg border border-line p-1" /></div> : null}</>}
                      </div>
                    ) : <p className="mt-3 text-sm text-fg-muted">Tuvalde dosyayı veya butonu seç.</p>}
                  </Card>
                  <Card className="p-4 text-sm text-fg-muted"><Icon name="shield" size={19} className="mb-2 text-accent" /><strong className="block text-fg">Yayın öncesi kontrol</strong><p className="mt-1">Görsel, alt metin ve tüm bağlantılar moderatör onayından geçer.</p></Card>
                </aside>
              </div>
            </div>
          ) : null}

          {tab === 'drafts' && stage === 'preview' && draft ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(430px,1.25fr)_minmax(320px,0.75fr)]">
              <Card className="p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Gazete önizlemesi</p><h2 className="mt-1 text-xl font-black">{formatDate(`${draft.issueDate}T09:00:00Z`)} · Sayfa {draft.page}</h2></div>{statusBadge(draft)}</div><PlacementCanvas draft={draft} blocks={blocks} setBlocks={setBlocks} selectedIds={[]} setSelectedIds={() => undefined} subscriber={subscriber} onLimit={() => undefined} readonly />{draft.status !== 'paid' ? <Button type="button" tone="secondary" className="mt-4" onClick={() => setStage('edit')}><Icon name="arrowLeft" size={17} /> Dosya ve CTA’ya dön</Button> : null}</Card>
              <div className="space-y-4"><Card className="p-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Ödeme özeti</p><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-4"><span className="text-fg-muted">Alan</span><strong>{draft.rect.width * draft.rect.height} birim</strong></div><div className="flex justify-between gap-4"><span className="text-fg-muted">Birim fiyatı</span><strong>{UNIT_PRICE}₺</strong></div>{subscriber ? <div className="flex justify-between gap-4 text-accent"><span>Yayınevi indirimi</span><strong>−%5</strong></div> : null}<div className="flex justify-between gap-4 border-t border-line pt-3 text-lg"><span>Toplam</span><strong>{paidPrice ?? estimatedPrice}₺</strong></div></div>{draft.status === 'paid' ? <div className="mt-5 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm"><strong className="block">Moderasyon durumu</strong><p className="mt-1 text-fg-muted">{draft.moderationStatus === 'approved' ? 'Onaylandı ve yayına hazır.' : draft.moderationStatus === 'rejected' || draft.moderationStatus === 'changes_requested' ? 'Düzeltme gerekiyor.' : 'Görsel ve bağlantılar inceleniyor.'}</p></div> : <Button type="button" tone="gradient" className="mt-5 w-full" onClick={purchase} disabled={pending || outsideBlocks.length > 0 || !creative}>Çakışmayı denetle ve ödemeye gönder</Button>}<p className="mt-3 text-xs text-fg-muted">Para çekme talimatından hemen önce alan çakışması yeniden kontrol edilir.</p></Card>{!subscriber ? <Card className="p-4"><p className="font-bold">Yayınevi · 200₺/ay</p><p className="mt-1 text-sm text-fg-muted">3 CTA, dış bağlantı, özel görünüm ve her ilanda %5 indirim.</p><Button type="button" tone="secondary" className="mt-3 w-full" onClick={() => setTab('membership')}>Üyeliği incele</Button></Card> : null}</div>
            </div>
          ) : null}

          {tab === 'drafts' && stage === 'select' && initialDrafts.length > 0 && !changingArea ? <section className="mt-6" aria-labelledby="unfinished-heading"><h2 id="unfinished-heading" className="text-lg font-black">Yarım kalanlar</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{initialDrafts.map((entry) => <button key={entry.id} type="button" onClick={() => openDraft(entry)} className="card p-4 text-left hover:border-accent"><span className="flex items-start justify-between gap-2"><strong>{formatDate(`${entry.issueDate}T09:00:00Z`)}</strong>{statusBadge(entry)}</span><span className="mt-2 block text-sm text-fg-muted">Sayfa {entry.page} · {entry.rect.width}×{entry.rect.height} birim · {entry.blocks.filter((block) => block.role === 'cta').length} CTA</span></button>)}</div></section> : null}

          {tab === 'drafts' && stage === 'select' ? <section className="mt-6" aria-labelledby="reservations-heading"><h2 id="reservations-heading" className="text-lg font-black">Bu sayfadaki rezervasyonlar</h2>{slots.filter((slot) => slot.page === page && slot.status === 'reserved' && slot.ownerId !== viewerId && !slot.anonymous).length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{slots.filter((slot) => slot.page === page && slot.status === 'reserved' && slot.ownerId !== viewerId && !slot.anonymous).map((slot) => { const owner = owners[slot.ownerId]; return owner?.visible ? <li key={slot.id} className="rounded-xl border border-line bg-bg-raised p-3 text-sm"><strong>{owner.displayName}</strong><span className="block text-xs text-fg-muted">{slot.rect.width}×{slot.rect.height} birim</span>{owner.canMessage ? <Link href={`/messages?to=${owner.username}`} className="mt-2 inline-flex text-xs font-bold text-accent hover:underline">Mesaj gönder</Link> : null}</li> : null; })}</ul> : <p className="mt-2 text-sm text-fg-muted">Görünür rezervasyon yok.</p>}</section> : null}
        </main>
      </div>
    </div>
  );
}
