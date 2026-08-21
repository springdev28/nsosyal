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
import { FiveNMark } from '@/components/brand/FiveNMark';
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
    color: type === 'shape' ? '#3D9BFF' : '#0F172A',
    borderRadius: 12,
    objectFit: 'cover',
    opacity: 1,
    borderWidth: 0,
    borderColor: '#3D9BFF',
    textAlign: 'left',
    imageFilter: 'none',
    rotation: 0,
    padding: 8,
    backgroundColor: '#FFFFFF',
    shadow: 'none',
    fontFamily: 'sans',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: 0,
    lineHeight: 1.35,
    paragraphIndent: 0,
    verticalAlign: 'top',
    textTransform: 'none',
    flipX: false,
    flipY: false,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    archived: false,
  };
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-slate-200 px-1 py-0.5 font-mono">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline">{link[1]}</a>;
    return <span key={index}>{part}</span>;
  });
}

function MarkdownPreview({ value }: { value: string }) {
  return (
    <div className="space-y-1 whitespace-pre-wrap text-left">
      {value.split('\n').map((line, index) => {
        if (line.startsWith('### ')) return <h4 key={index} className="text-[1.08em] font-black"><InlineMarkdown text={line.slice(4)} /></h4>;
        if (line.startsWith('## ')) return <h3 key={index} className="text-[1.2em] font-black"><InlineMarkdown text={line.slice(3)} /></h3>;
        if (line.startsWith('# ')) return <h2 key={index} className="text-[1.35em] font-black"><InlineMarkdown text={line.slice(2)} /></h2>;
        if (line.startsWith('> ')) return <blockquote key={index} className="border-l-2 border-blue-500 pl-3 italic text-slate-600"><InlineMarkdown text={line.slice(2)} /></blockquote>;
        if (line.startsWith('- ')) return <p key={index} className="flex gap-2 pl-2"><span aria-hidden="true">•</span><span><InlineMarkdown text={line.slice(2)} /></span></p>;
        const ordered = line.match(/^(\d+)\.\s(.+)$/);
        if (ordered) return <p key={index} className="flex gap-2 pl-2"><span>{ordered[1]}.</span><span><InlineMarkdown text={ordered[2]} /></span></p>;
        if (/^\|?[\s:-]+\|/.test(line)) return null;
        if (line.includes('|')) return <p key={index} className="grid grid-flow-col divide-x divide-slate-300 rounded border border-slate-300 font-mono text-[0.9em]">{line.split('|').filter(Boolean).map((cell, cellIndex) => <span key={cellIndex} className="px-2 py-1"><InlineMarkdown text={cell.trim()} /></span>)}</p>;
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

function blockFontFamily(value: PublicationBlock['fontFamily']): string {
  if (value === 'serif') return 'Georgia, Cambria, "Times New Roman", serif';
  if (value === 'mono') return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  return 'Inter, ui-sans-serif, system-ui, sans-serif';
}

function blockShadow(value: PublicationBlock['shadow']): string | undefined {
  if (value === 'soft') return 'drop-shadow(0 8px 10px rgb(15 23 42 / 0.18))';
  if (value === 'strong') return 'drop-shadow(0 12px 16px rgb(15 23 42 / 0.34))';
  return undefined;
}

function blockVerticalAlign(value: PublicationBlock['verticalAlign']): React.CSSProperties['justifyContent'] {
  if (value === 'middle') return 'center';
  if (value === 'bottom') return 'flex-end';
  return 'flex-start';
}

function blockImageFilter(block: PublicationBlock): string {
  const preset =
    block.imageFilter === 'grayscale'
      ? 'grayscale(1)'
      : block.imageFilter === 'contrast'
        ? 'contrast(1.25) saturate(1.08)'
        : '';
  return [
    preset,
    `brightness(${block.brightness ?? 1})`,
    `contrast(${block.contrast ?? 1})`,
    `saturate(${block.saturation ?? 1})`,
  ].filter(Boolean).join(' ');
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
  onMove,
}: {
  draft: PublicationDraft;
  blocks: PublicationBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove?: (id: string, patch: Pick<PublicationRect, 'x' | 'y'>) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    originX: number;
    originY: number;
  } | null>(null);

  function moveWithPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!drag || drag.id !== event.currentTarget.dataset.blockId || !bounds || !onMove) return;
    const dx = Math.round(((event.clientX - drag.pointerX) / bounds.width) * PAGE_COLUMNS);
    const dy = Math.round(((event.clientY - drag.pointerY) / bounds.height) * PAGE_ROWS);
    onMove(drag.id, {
      x: Math.max(0, Math.min(PAGE_COLUMNS - 1, drag.originX + dx)),
      y: Math.max(0, Math.min(PAGE_ROWS - 1, drag.originY + dy)),
    });
  }

  return (
    <div
      ref={canvasRef}
      aria-label="A4 gazete tasarım tuvali"
      className="publication-grid relative mx-auto aspect-[3/4] w-full max-w-[600px] overflow-hidden rounded-xl border border-line-strong bg-white shadow-2xl"
      style={{ containerType: 'inline-size' }}
    >
      <div className="absolute border-2 border-accent bg-accent/5" style={rectStyle(draft.rect)} />
      {blocks.map((block) => {
        const outside = !contains(draft.rect, block);
        return (
          <button
            type="button"
            key={block.id}
            data-block-id={block.id}
            aria-label={`${block.type === 'markdown' ? 'Yazı' : block.type === 'image' ? 'Görsel' : 'Grafik'} bloğu, x ${block.x + 1}, y ${block.y + 1}`}
            onClick={() => onSelect(block.id)}
            onPointerDown={(event) => {
              if (!onMove) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                id: block.id,
                pointerX: event.clientX,
                pointerY: event.clientY,
                originX: block.x,
                originY: block.y,
              };
              onSelect(block.id);
            }}
            onPointerMove={moveWithPointer}
            onPointerUp={(event) => {
              moveWithPointer(event);
              dragRef.current = null;
            }}
            onKeyDown={(event) => {
              if (!onMove || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
              event.preventDefault();
              onMove(block.id, {
                x: Math.max(0, Math.min(PAGE_COLUMNS - 1, block.x + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0))),
                y: Math.max(0, Math.min(PAGE_ROWS - 1, block.y + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0))),
              });
            }}
            className={`absolute overflow-hidden text-left text-slate-950 ${
              outside ? 'border-2 border-red-600 ring-2 ring-red-300' : selectedId === block.id ? 'ring-2 ring-accent' : 'ring-1 ring-slate-400/60'
            }`}
            style={{
              ...rectStyle(block),
              borderRadius: block.borderRadius,
              backgroundColor: block.type === 'shape' ? block.color : block.backgroundColor ?? '#FFFFFF',
              opacity: block.opacity ?? 1,
              borderWidth: block.borderWidth ?? 0,
              borderColor: block.borderColor ?? '#3D9BFF',
              borderStyle: 'solid',
              textAlign: block.textAlign ?? 'left',
              color: block.type === 'shape' ? '#FFFFFF' : block.color,
              fontFamily: blockFontFamily(block.fontFamily),
              fontSize: `clamp(7px, ${(block.fontSize ?? 16) / 6}cqw, ${block.fontSize ?? 16}px)`,
              fontWeight: block.fontWeight ?? 400,
              fontStyle: block.fontStyle ?? 'normal',
              textDecoration: block.textDecoration ?? 'none',
              textTransform: block.textTransform ?? 'none',
              letterSpacing: `${block.letterSpacing ?? 0}px`,
              lineHeight: block.lineHeight ?? 1.35,
              padding: block.padding ?? 8,
              transform: `rotate(${block.rotation ?? 0}deg) scaleX(${block.flipX ? -1 : 1}) scaleY(${block.flipY ? -1 : 1})`,
              filter: blockShadow(block.shadow),
              touchAction: 'none',
            }}
          >
            {block.type === 'markdown' ? (
              <span
                className="flex h-full w-full flex-col overflow-hidden"
                style={{
                  justifyContent: blockVerticalAlign(block.verticalAlign),
                  textIndent: block.paragraphIndent ?? 0,
                }}
              >
                <MarkdownPreview value={block.content} />
              </span>
            ) : null}
            {block.type === 'image' ? (
              block.content ? (
                <span
                  role="img"
                  aria-label={block.altText || 'Açıklaması eksik görsel'}
                  className="block h-full w-full bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${block.content})`,
                    backgroundSize: block.objectFit,
                    filter: blockImageFilter(block),
                  }}
                />
              ) : <span className="flex h-full items-center justify-center text-center text-slate-500">Görsel URL’si ekle</span>
            ) : null}
            {block.type === 'shape' ? (
              <span className="flex h-full items-center" style={{ justifyContent: blockVerticalAlign(block.verticalAlign) }}>
                {block.content}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

type InspectorTab = 'content' | 'layout' | 'style';

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-fg-muted">
      <span className="flex items-center justify-between gap-3"><span>{label}</span><span className="tabular-nums text-fg">{value}{suffix}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
    </label>
  );
}

function InspectorToggle({
  pressed,
  label,
  children,
  onClick,
}: {
  pressed: boolean;
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm font-black transition-colors ${
        pressed ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-bg-sunken text-fg-muted hover:bg-bg-hover hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

function BlockInspector({
  block,
  onUpdate,
  onDuplicate,
  onLayer,
  onRemove,
}: {
  block: PublicationBlock;
  onUpdate: (patch: Partial<PublicationBlock>) => void;
  onDuplicate: () => void;
  onLayer: (direction: 'forward' | 'backward') => void;
  onRemove: () => void;
}) {
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('content');
  const blockLabel = block.type === 'markdown' ? 'yazı' : block.type === 'image' ? 'görsel' : 'grafik';

  return (
    <section className="card overflow-hidden p-0" aria-label={`Seçili ${blockLabel} bloğu özellikleri`}>
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-accent">Canva tipi araçlar</p>
          <h3 className="font-black">Seçili {blockLabel} bloğu</h3>
        </div>
        <button type="button" className="min-h-9 rounded-lg px-2 text-sm font-bold text-danger hover:bg-danger-soft" onClick={onRemove}>Sil</button>
      </div>

      <div role="tablist" aria-label="Blok özellik grupları" className="grid grid-cols-3 border-b border-line bg-bg-sunken/70 p-1">
        {([
          ['content', 'İçerik'],
          ['layout', 'Düzen'],
          ['style', 'Stil'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={inspectorTab === key}
            onClick={() => setInspectorTab(key)}
            className={`min-h-10 rounded-lg px-2 text-xs font-black ${inspectorTab === key ? 'bg-bg-raised text-accent shadow-sm' : 'text-fg-muted hover:text-fg'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-4">
        {inspectorTab === 'content' ? (
          <>
            <label className="block text-xs font-semibold text-fg-muted">
              {block.type === 'image' ? 'Görsel URL’si' : 'İçerik'}
              <textarea
                value={block.content}
                onChange={(event) => onUpdate({ content: event.target.value })}
                rows={block.type === 'markdown' ? 7 : 2}
                placeholder={block.type === 'image' ? 'https://…' : undefined}
                className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-3 text-fg"
              />
            </label>

            {block.type === 'markdown' ? (
              <div className="max-h-48 overflow-auto rounded-xl border border-line bg-white p-3 text-xs text-slate-950">
                <p className="mb-2 border-b border-slate-200 pb-2 font-bold text-slate-600">Canlı Markdown önizlemesi</p>
                <MarkdownPreview value={block.content} />
              </div>
            ) : null}

            {block.type !== 'image' ? (
              <>
                <div className="grid grid-cols-[minmax(0,1fr)_82px] gap-2">
                  <label className="text-xs font-semibold text-fg-muted">
                    Yazı tipi
                    <select value={block.fontFamily ?? 'sans'} onChange={(event) => onUpdate({ fontFamily: event.target.value as PublicationBlock['fontFamily'] })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg">
                      <option value="sans">Modern Sans</option><option value="serif">Editoryal Serif</option><option value="mono">Teknik Mono</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-fg-muted">
                    Boyut
                    <input type="number" min="8" max="96" value={block.fontSize ?? 16} onChange={(event) => onUpdate({ fontSize: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Metin biçimi">
                  <InspectorToggle label="Kalın" pressed={(block.fontWeight ?? 400) >= 800} onClick={() => onUpdate({ fontWeight: (block.fontWeight ?? 400) >= 800 ? 400 : 800 })}>B</InspectorToggle>
                  <InspectorToggle label="Yarı kalın" pressed={block.fontWeight === 600} onClick={() => onUpdate({ fontWeight: block.fontWeight === 600 ? 400 : 600 })}>600</InspectorToggle>
                  <InspectorToggle label="İtalik" pressed={block.fontStyle === 'italic'} onClick={() => onUpdate({ fontStyle: block.fontStyle === 'italic' ? 'normal' : 'italic' })}><span className="italic">I</span></InspectorToggle>
                  <InspectorToggle label="Altı çizili" pressed={block.textDecoration === 'underline'} onClick={() => onUpdate({ textDecoration: block.textDecoration === 'underline' ? 'none' : 'underline' })}><span className="underline">U</span></InspectorToggle>
                  <InspectorToggle label="Büyük harf" pressed={block.textTransform === 'uppercase'} onClick={() => onUpdate({ textTransform: block.textTransform === 'uppercase' ? 'none' : 'uppercase' })}>AA</InspectorToggle>
                </div>
                {block.type === 'markdown' ? (
                  <label className="block text-xs font-semibold text-fg-muted">Metin rengi<input type="color" value={block.color} onChange={(event) => onUpdate({ color: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg-sunken p-1" /></label>
                ) : null}
              </>
            ) : (
              <label className="block text-xs font-semibold text-fg-muted">
                Alternatif metin
                <input value={block.altText} onChange={(event) => onUpdate({ altText: event.target.value })} placeholder="Görseldeki önemli bilgiyi açıkla" className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg" />
              </label>
            )}
          </>
        ) : null}

        {inspectorTab === 'layout' ? (
          <>
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-fg-muted">Konum ve ölçü</p>
              <RectFields value={block} onChange={(rect) => onUpdate(rect)} />
            </div>
            {block.type !== 'image' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-fg-muted">Yatay hizalama<select value={block.textAlign ?? 'left'} onChange={(event) => onUpdate({ textAlign: event.target.value as PublicationBlock['textAlign'] })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg"><option value="left">Sola</option><option value="center">Ortaya</option><option value="right">Sağa</option></select></label>
                  <label className="text-xs font-semibold text-fg-muted">Dikey hizalama<select value={block.verticalAlign ?? 'top'} onChange={(event) => onUpdate({ verticalAlign: event.target.value as PublicationBlock['verticalAlign'] })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg"><option value="top">Üste</option><option value="middle">Ortaya</option><option value="bottom">Alta</option></select></label>
                </div>
                <RangeControl label="Harf aralığı" value={block.letterSpacing ?? 0} min={-1} max={12} step={0.25} suffix=" px" onChange={(value) => onUpdate({ letterSpacing: value })} />
                <RangeControl label="Satır aralığı" value={block.lineHeight ?? 1.35} min={0.8} max={2.5} step={0.05} onChange={(value) => onUpdate({ lineHeight: value })} />
                <RangeControl label="Paragraf girintisi" value={block.paragraphIndent ?? 0} min={0} max={64} suffix=" px" onChange={(value) => onUpdate({ paragraphIndent: value })} />
              </>
            ) : null}
            <RangeControl label="İç boşluk" value={block.padding ?? 8} min={0} max={48} suffix=" px" onChange={(value) => onUpdate({ padding: value })} />
            <RangeControl label="Döndürme" value={block.rotation ?? 0} min={-180} max={180} suffix="°" onChange={(value) => onUpdate({ rotation: value })} />
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Katman işlemleri">
              <button type="button" onClick={onDuplicate} className="min-h-10 rounded-xl border border-line bg-bg-sunken px-2 text-xs font-bold hover:bg-bg-hover">Çoğalt</button>
              <button type="button" onClick={() => onLayer('forward')} className="min-h-10 rounded-xl border border-line bg-bg-sunken px-2 text-xs font-bold hover:bg-bg-hover">Öne al</button>
              <button type="button" onClick={() => onLayer('backward')} className="min-h-10 rounded-xl border border-line bg-bg-sunken px-2 text-xs font-bold hover:bg-bg-hover">Arkaya al</button>
            </div>
            {block.type === 'image' ? (
              <div className="grid grid-cols-2 gap-2">
                <InspectorToggle label="Yatay çevir" pressed={Boolean(block.flipX)} onClick={() => onUpdate({ flipX: !block.flipX })}>↔ Yatay çevir</InspectorToggle>
                <InspectorToggle label="Dikey çevir" pressed={Boolean(block.flipY)} onClick={() => onUpdate({ flipY: !block.flipY })}>↕ Dikey çevir</InspectorToggle>
              </div>
            ) : null}
          </>
        ) : null}

        {inspectorTab === 'style' ? (
          <>
            {block.type === 'shape' ? <label className="block text-xs font-semibold text-fg-muted">Dolgu rengi<input type="color" value={block.color} onChange={(event) => onUpdate({ color: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg-sunken p-1" /></label> : null}
            {block.type === 'markdown' ? <label className="block text-xs font-semibold text-fg-muted">Arka plan rengi<input type="color" value={block.backgroundColor ?? '#FFFFFF'} onChange={(event) => onUpdate({ backgroundColor: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg-sunken p-1" /></label> : null}
            {block.type === 'image' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-fg-muted">Kırpma<select value={block.objectFit} onChange={(event) => onUpdate({ objectFit: event.target.value as PublicationBlock['objectFit'] })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg"><option value="cover">Alanı doldur</option><option value="contain">Tamamını göster</option></select></label>
                  <label className="text-xs font-semibold text-fg-muted">Hazır efekt<select value={block.imageFilter ?? 'none'} onChange={(event) => onUpdate({ imageFilter: event.target.value as PublicationBlock['imageFilter'] })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg"><option value="none">Efekt yok</option><option value="grayscale">Siyah beyaz</option><option value="contrast">Canlı kontrast</option></select></label>
                </div>
                <RangeControl label="Parlaklık" value={Math.round((block.brightness ?? 1) * 100)} min={50} max={150} suffix="%" onChange={(value) => onUpdate({ brightness: value / 100 })} />
                <RangeControl label="Kontrast" value={Math.round((block.contrast ?? 1) * 100)} min={50} max={150} suffix="%" onChange={(value) => onUpdate({ contrast: value / 100 })} />
                <RangeControl label="Doygunluk" value={Math.round((block.saturation ?? 1) * 100)} min={0} max={200} suffix="%" onChange={(value) => onUpdate({ saturation: value / 100 })} />
              </>
            ) : null}
            <RangeControl label="Çerçeve" value={block.borderWidth ?? 0} min={0} max={8} suffix=" px" onChange={(value) => onUpdate({ borderWidth: value })} />
            {(block.borderWidth ?? 0) > 0 ? <label className="block text-xs font-semibold text-fg-muted">Çerçeve rengi<input type="color" value={block.borderColor ?? '#3D9BFF'} onChange={(event) => onUpdate({ borderColor: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg-sunken p-1" /></label> : null}
            <RangeControl label="Köşe yuvarlaklığı" value={block.borderRadius} min={0} max={48} suffix=" px" onChange={(value) => onUpdate({ borderRadius: value })} />
            <RangeControl label="Saydamlık" value={Math.round((block.opacity ?? 1) * 100)} min={20} max={100} suffix="%" onChange={(value) => onUpdate({ opacity: value / 100 })} />
            <label className="block text-xs font-semibold text-fg-muted">Gölge<select value={block.shadow ?? 'none'} onChange={(event) => onUpdate({ shadow: event.target.value as PublicationBlock['shadow'] })} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-2.5 text-fg"><option value="none">Gölge yok</option><option value="soft">Yumuşak gölge</option><option value="strong">Güçlü gölge</option></select></label>
          </>
        ) : null}
      </div>
    </section>
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
  const stageLabel = stage === 'select' ? 'Alan seçimi' : stage === 'edit' ? 'Tasarım tuvali' : 'Önizleme ve ödeme';

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

  function duplicateSelectedBlock() {
    if (!draft || !selectedBlock) return;
    const copy: PublicationBlock = {
      ...selectedBlock,
      id: globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}`,
      x: Math.min(draft.rect.x + draft.rect.width - selectedBlock.width, selectedBlock.x + 1),
      y: Math.min(draft.rect.y + draft.rect.height - selectedBlock.height, selectedBlock.y + 1),
      archived: false,
    };
    setBlocks((current) => [...current, copy]);
    setSelectedBlockId(copy.id);
    setDirty(true);
  }

  function moveSelectedLayer(direction: 'forward' | 'backward') {
    if (!selectedBlock) return;
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === selectedBlock.id);
      const target = direction === 'forward' ? Math.min(current.length - 1, index + 1) : Math.max(0, index - 1);
      if (index < 0 || index === target) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  function removeSelectedBlock() {
    if (!selectedBlock) return;
    setBlocks((current) => current.filter((block) => block.id !== selectedBlock.id));
    setSelectedBlockId(null);
    setDirty(true);
  }

  function addResource(label: string, color: string) {
    if (!draft) {
      setTab('drafts');
      setNotice({ tone: 'info', text: 'Kaynağı kullanmak için önce bir sayı ve alan seçerek taslağı aç.' });
      return;
    }
    const block = { ...newBlock('shape', draft.rect), content: label, color };
    setBlocks((current) => [...current, block]);
    setSelectedBlockId(block.id);
    setTab('drafts');
    setStage('edit');
    setDirty(true);
    setNotice({ tone: 'success', text: `${label} tasarıma eklendi. Özellikler panelinden renk ve ölçülerini değiştirebilirsin.` });
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
    <div className="min-h-dvh pb-12">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-[1780px] items-center gap-3 px-3 sm:px-5">
          <Link
            href="/newspaper"
            aria-label="nGazete’ye dön"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 hover:bg-bg-hover"
          >
            <FiveNMark size={34} animated />
          </Link>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-accent">nGazete üretim alanı</p>
            <h1 className="truncate text-lg font-black sm:text-xl">Yayın Atölyesi</h1>
          </div>
          <div className="ml-auto hidden items-center gap-2 text-xs text-fg-muted md:flex">
            <span className="rounded-full border border-line bg-bg-sunken px-3 py-1.5">{stageLabel}</span>
            {draft ? <Badge tone={dirty ? 'warning' : 'success'}>{dirty ? 'Kaydedilmedi' : 'Kaydedildi'}</Badge> : null}
          </div>
          <Link
            href="/newspaper"
            aria-label="nGazete’ye dön"
            className="ml-1 inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3 text-sm font-bold hover:bg-bg-hover"
          >
            <Icon name="newspaper" size={17} />
            <span className="hidden sm:inline">Gazeteye dön</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1780px] gap-0 lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-bg-raised/55 lg:min-h-[calc(100dvh-4rem)] lg:border-b-0 lg:border-r">
          <div className="sticky top-16 p-3 sm:p-4">
            <nav aria-label="Yayın Atölyesi araçları">
              <div role="tablist" aria-label="Yayın Atölyesi bölümleri" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                {([
                  ['drafts', 'Taslaklar', 'newspaper'],
                  ['guide', 'Rehber', 'book'],
                  ['resources', 'Kaynaklar', 'sparkles'],
                ] as const).map(([key, label, icon]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-colors lg:w-full ${
                      tab === key
                        ? 'bg-accent-soft text-accent ring-1 ring-[var(--accent-line)]'
                        : 'text-fg-muted hover:bg-bg-hover hover:text-fg'
                    }`}
                  >
                    <Icon name={icon} size={19} />
                    {label}
                  </button>
                ))}
              </div>
            </nav>

            {activeWindow ? (
              <div className="mt-5 hidden rounded-2xl border border-line bg-bg-sunken p-3 text-xs lg:block">
                <p className="font-black text-fg">Aktif çalışma</p>
                <p className="mt-2 text-fg-muted">{formatDate(`${activeWindow.issueDate}T09:00:00+03:00`)}</p>
                <p className="mt-1 text-fg-muted">Kapanış: {formatDateTime(activeWindow.closesAt)}</p>
                <p className="mt-3 border-t border-line pt-3 text-fg-subtle">A4 · 30×40 birim · en çok 5 sayfa</p>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0 space-y-5 px-3 py-4 sm:px-5 lg:px-6" aria-label={`${stageLabel} çalışma alanı`}>
          {notice ? (
            <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${notice.tone === 'error' ? 'border-danger/40 bg-danger-soft text-danger' : notice.tone === 'success' ? 'border-success/40 bg-success-soft text-success' : 'border-accent/35 bg-accent-soft text-fg'}`}>
              {notice.text}
            </p>
          ) : null}

          {tab === 'guide' ? <Guide /> : null}
          {tab === 'resources' ? <Resources onOpenGuide={() => setTab('guide')} onUseResource={addResource} /> : null}

      {tab === 'drafts' && stage === 'select' ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="min-w-0 p-4 sm:p-6">
            <h2 className="text-xl font-black">1. Sayı ve alan seç</h2>
            <p className="mt-1 text-sm text-fg-muted">Sonraki yedi açık gazetenin boş, rezerve ve satın alınmış alanları canlı olarak gösterilir.</p>
            <div className="story-strip mt-4 flex min-w-0 gap-2 pb-2" role="group" tabIndex={0} aria-label="Açık gazete taslakları">
              {windows.map((window) => {
                const occupied = Math.min(
                  100,
                  Math.round(
                    (window.slots.reduce((sum, slot) => sum + slot.rect.width * slot.rect.height, 0) /
                      (PAGE_COLUMNS * PAGE_ROWS * 5)) *
                      100,
                  ),
                );
                return (
                  <button key={window.issueDate} type="button" onClick={() => setIssueDate(window.issueDate)} className={`min-w-[174px] rounded-2xl border p-3 text-left ${window.issueDate === issueDate ? 'border-accent bg-accent-soft' : 'border-line bg-bg-sunken'}`}>
                    <span className="block text-sm font-bold">{formatDate(`${window.issueDate}T09:00:00+03:00`)}</span>
                    <span className="mt-1 block text-xs text-fg-muted">Kapanış {formatDateTime(window.closesAt)}</span>
                    <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-bg-hover">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${occupied}%` }} />
                    </span>
                    <span className="mt-1 block text-[0.68rem] text-fg-subtle">5 sayfada %{occupied} dolu</span>
                  </button>
                );
              })}
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
        <div className="grid min-w-0 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_350px]">
          <aside className="min-w-0 space-y-4">
            <Card className="p-4">
              <p className="text-xs font-black uppercase tracking-widest text-accent">Ekle</p>
              <div className="mt-3 grid gap-2">
                <button type="button" onClick={() => addBlock('markdown')} className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-bg-sunken px-3 text-left font-bold hover:border-accent hover:bg-bg-hover">
                  <Icon name="text" size={19} /> <span>Yazı<span className="block text-xs font-normal text-fg-muted">Markdown metin</span></span>
                </button>
                <button type="button" onClick={() => addBlock('image')} className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-bg-sunken px-3 text-left font-bold hover:border-accent hover:bg-bg-hover">
                  <Icon name="image" size={19} /> <span>Görsel<span className="block text-xs font-normal text-fg-muted">URL, kırpma, alt metin</span></span>
                </button>
                <button type="button" onClick={() => addBlock('shape')} className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-bg-sunken px-3 text-left font-bold hover:border-accent hover:bg-bg-hover">
                  <Icon name="spark" size={19} /> <span>Grafik<span className="block text-xs font-normal text-fg-muted">Renkli vurgu alanı</span></span>
                </button>
              </div>
            </Card>
            <Card className="space-y-2 p-4 text-xs">
              <h3 className="font-black text-fg">Çalışma bilgisi</h3>
              <p className="text-fg-muted">{formatDate(`${draft.issueDate}T09:00:00+03:00`)}</p>
              <p className="text-fg-muted">Sayfa {draft.page}/5 · {draft.rect.width * draft.rect.height} birim</p>
              <p className="border-t border-line pt-2 text-fg-subtle">Bloku sürükle veya ok tuşlarıyla birer birim taşı.</p>
            </Card>
            <Button type="button" tone="ghost" onClick={() => setStage('select')} className="w-full">
              <Icon name="arrowLeft" size={16} /> Alan seçimine dön
            </Button>
          </aside>
          <Card className="min-w-0 p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">2. Tasarla</h2><p className="text-sm text-fg-muted">{formatDate(`${draft.issueDate}T09:00:00+03:00`)} · Sayfa {draft.page} · {draft.rect.width * draft.rect.height} birim</p></div><Badge tone={dirty ? 'warning' : 'success'}>{dirty ? 'Kaydedilmemiş değişiklik' : 'Kaydedildi'}</Badge></div>
            <DesignCanvas
              draft={draft}
              blocks={blocks}
              selectedId={selectedBlockId}
              onSelect={setSelectedBlockId}
              onMove={(id, patch) => {
                setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
                setDirty(true);
              }}
            />
          </Card>
          <aside className="min-w-0 space-y-4">
            {outsideBlocks.length ? <p role="alert" className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger">{outsideBlocks.length} blok seçili alanın dışında. Kırmızı bloklar düzelmeden taslak kaydedilemez veya gönderilemez.</p> : null}
            {selectedBlock ? (
              <BlockInspector
                key={selectedBlock.id}
                block={selectedBlock}
                onUpdate={updateBlock}
                onDuplicate={duplicateSelectedBlock}
                onLayer={moveSelectedLayer}
                onRemove={removeSelectedBlock}
              />
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
        </section>
      </div>
    </div>
  );
}

function GuideTopic({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group rounded-2xl border border-line bg-bg-raised">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-black marker:hidden hover:bg-bg-hover">
        {title}
        <Icon name="chevronRight" size={18} className="transition-transform group-open:rotate-90" />
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-4 text-sm text-fg-muted">{children}</div>
    </details>
  );
}

function Guide() {
  const [example, setExample] = useState(
    '# Yeni nesil laboratuvar\n\n**Açık veri**, daha iyi deneme demek.\n\n- Ölçümü paylaş\n- Hatanı anlat\n- Kaynağa bağlantı ver',
  );
  const [copied, setCopied] = useState(false);

  function copyExample() {
    void globalThis.navigator?.clipboard?.writeText(example);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Uygulamalı kılavuz</p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">Yayın hazırlama rehberi</h2>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">Alan seçiminden erişilebilir Markdown yazımına, kaydetme ve ödeme çakışmasına kadar bütün akış.</p>
        </div>
        <Badge tone="accent">Europe/Istanbul · kapanış 20.00 · yayın 06.00</Badge>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <GuideTopic title="1. Sayı, sayfa ve alan seçimi" open>
            <p>Önizleme paneli sonraki yedi açık sayıyı gösterir. Her sayı en çok beş A4 sayfadır ve her sayfa 30×40 birime bölünür.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Mavi alan kesinleşmiş satın alımı, kesik camgöbeği alan niyet rezervasyonunu gösterir.</li>
              <li>Tuvalde sürükleyerek dörtgen seçebilir veya X, Y, genişlik ve yükseklik değerlerini girebilirsin.</li>
              <li>Rezervasyon zorunlu değildir; doğrudan tasarıma başlayabilirsin.</li>
            </ul>
          </GuideTopic>
          <GuideTopic title="2. Rezervasyon ve alan hakkı arasındaki fark">
            <p>Rezervasyon yalnızca “burada çalışıyorum” sinyalidir. Rezerve alanla çakışan başka bir kullanıcı ödeme yaparsa kesin hak ona geçer.</p>
            <p className="rounded-xl border border-warning/35 bg-warning-soft p-3 text-fg">Kesin alan hakkını yalnız başarılı ödeme oluşturur. Ödeme başlamadan hemen önce sunucu tarih, sayfa ve dörtgeni yeniden denetler; çakışma varsa para çekilmez.</p>
          </GuideTopic>
          <GuideTopic title="3. Tasarım tuvali ve bloklar">
            <p>Yazı, görsel ve grafik bloklarını seçili alanın içinde sürükleyebilirsin. Ok tuşları seçili bloku birer birim taşır.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>İçerik sekmesinde yazı tipi, boyut, kalınlık, italik, altı çizili, büyük harf ve renk seçeneklerini düzenle.</li>
              <li>Düzen sekmesinde konum, ölçü, yatay/dikey hizalama, harf ve satır aralığı, paragraf girintisi, iç boşluk, döndürme ve katman sırasını yönet.</li>
              <li>Stil sekmesinde arka plan, çerçeve, köşe, saydamlık ve gölge; görsellerde ayrıca kırpma, parlaklık, kontrast, doygunluk ve çevirme denetimleri bulunur.</li>
              <li>Alan dışına taşan blok kırmızı görünür; bu durumda kaydetme ve gönderme kapatılır.</li>
            </ul>
          </GuideTopic>
          <GuideTopic title="4. Markdown: başlık, vurgu, liste ve bağlantı">
            <div className="grid gap-3 sm:grid-cols-2">
              <pre className="overflow-auto rounded-xl bg-bg-sunken p-3 text-xs text-fg"># Ana başlık{`\n`}## Alt başlık{`\n\n`}**kalın** ve *italik*</pre>
              <pre className="overflow-auto rounded-xl bg-bg-sunken p-3 text-xs text-fg">- liste maddesi{`\n`}1. numaralı madde{`\n\n`}[Kaynak](https://ornek.org)</pre>
            </div>
            <p>Başlık hiyerarşisini sırayla kullan. Bağlantı metni “buraya tıkla” yerine hedefi anlatmalı; örneğin “Rüzgâr ölçer veri seti”.</p>
          </GuideTopic>
          <GuideTopic title="5. Alıntı, kod, tablo ve görsel açıklaması">
            <pre className="overflow-auto rounded-xl bg-bg-sunken p-3 text-xs text-fg">&gt; Kısa alıntı{`\n\n`}`ölçüm = hız / süre`{`\n\n`}| Deney | Sonuç |{`\n`}| --- | --- |{`\n`}| A | Başarılı |</pre>
            <p>Görsel eklerken alternatif metin, görselin işlevini ve önemli bilgisini anlatmalı. “Fotoğraf” yerine “Masanın üzerinde üç kanatlı mavi rüzgâr türbini prototipi” gibi yaz.</p>
          </GuideTopic>
          <GuideTopic title="6. Kaydetme, alan değiştirme ve arşiv">
            <p>Kaydet düğmesi çalışmanı taslak olarak saklar. “Gönder ve önizle” de önce otomatik kaydeder. Alan ölçüsünü değiştirirsen canlı bloklar bozulmadan tasarım arşivine taşınır.</p>
            <p>Başka biri alanı almışsa bu değişiklik açık oturumuna zorla uygulanmaz. Yenileme veya ödeme öncesi denetimde yeni alan seçmen istenir; arşivdeki blokları yeni alana geri kopyalayabilirsin.</p>
          </GuideTopic>
          <GuideTopic title="7. Klavye ve erişilebilir yayın kontrolü">
            <ul className="list-disc space-y-1 pl-5">
              <li>Bütün kontroller Tab ve Shift+Tab ile erişilebilir.</li>
              <li>Seçili bloku ok tuşlarıyla taşı; görsel için anlamlı alternatif metin yaz.</li>
              <li>Bilgiyi yalnız renkle aktarma; başlık, etiket ve açıklama kullan.</li>
              <li>Hareketli kaynaklar, azaltılmış hareket tercihinde statik görünür.</li>
            </ul>
          </GuideTopic>
        </div>

        <Card className="h-fit p-4 xl:sticky xl:top-20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-accent">Canlı alıştırma</p>
              <h3 className="text-lg font-black">Markdown deneme alanı</h3>
            </div>
            <Button type="button" tone="secondary" onClick={copyExample}>{copied ? 'Kopyalandı' : 'Kopyala'}</Button>
          </div>
          <label className="mt-4 block text-xs font-bold text-fg-muted">
            Markdown metni
            <textarea value={example} onChange={(event) => setExample(event.target.value)} rows={11} className="mt-1 w-full rounded-xl border border-line bg-bg-sunken p-3 font-mono text-xs text-fg" />
          </label>
          <div className="mt-3 min-h-52 rounded-xl border border-line bg-white p-4 text-sm text-slate-950">
            <p className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold text-slate-500">Önizleme</p>
            <MarkdownPreview value={example} />
          </div>
        </Card>
      </div>
    </div>
  );
}

const RESOURCE_ITEMS = [
  {
    id: 'dots',
    title: 'Nokta dokusu',
    access: 'Ücretsiz',
    kind: 'Statik arka plan',
    description: 'Hafif mavi nokta örgüsü; veri, araştırma ve teknoloji sayfalarında metni bastırmadan derinlik verir.',
    color: '#245C92',
    features: ['Renk değiştirilebilir', 'Baskıda güvenli', 'Saydamlık denetimli'],
  },
  {
    id: 'flow',
    title: 'Akış gradyanı',
    access: 'Abonelik',
    kind: 'Hareketli grafik',
    description: 'Camgöbeğinden kobalta kayan yumuşak vurgu. Azaltılmış hareket tercihinde statik kareye dönüşür.',
    color: '#3D78F2',
    features: ['6 saniyelik yavaş döngü', 'Statik yedek görünüm', 'Başlık arkası için uygun'],
  },
  {
    id: 'n-frame',
    title: 'N çerçevesi',
    access: 'Tek seferlik satın alma',
    kind: 'Grafik çerçeve',
    description: 'Marka geometrisini değiştirmeyen, görsel ve alıntıları çevreleyen ince mavi çerçeve.',
    color: '#496DF6',
    features: ['3:4 ve 1:1 oran', 'İnce/orta çizgi', 'Açık-koyu yüzey uyumu'],
  },
  {
    id: 'data-grid',
    title: 'Veri ızgarası',
    access: 'Ücretsiz',
    kind: 'Grafik zemin',
    description: 'Grafik, ölçüm ve deney sonuçlarını hizalamak için sakin 12 sütunlu kılavuz.',
    color: '#1E4A78',
    features: ['12 sütun', 'Açık-koyu çizgi', 'Grafiklerle uyumlu'],
  },
  {
    id: 'quote-band',
    title: 'Alıntı bandı',
    access: 'Ücretsiz',
    kind: 'Metin bileşeni',
    description: 'Kısa alıntı ve kaynak adını birlikte tutan, editoryal önceliği artıran bant.',
    color: '#2E6DB1',
    features: ['Kaynak satırı', 'İki yazı boyutu', 'Yüksek kontrast'],
  },
  {
    id: 'signal',
    title: 'Sinyal çizgileri',
    access: 'Abonelik',
    kind: 'Hareketli vurgu',
    description: 'Proje ve etkinlik başlıklarında kullanılabilen, yavaşça ilerleyen üç ince bağlantı çizgisi.',
    color: '#35A8D6',
    features: ['8 saniyelik döngü', 'Hareket azaltma desteği', 'Başlıkla çakışmayan maske'],
  },
] as const;

function ResourcePreview({ id }: { id: (typeof RESOURCE_ITEMS)[number]['id'] }) {
  if (id === 'dots') return <div className="h-28 rounded-2xl bg-[radial-gradient(circle,#3D9BFF_2px,transparent_3px)] [background-size:18px_18px]" />;
  if (id === 'flow') return <div className="h-28 rounded-2xl bg-[linear-gradient(120deg,#35C9E8,#3D9BFF,#3156F5)] bg-[length:180%_180%] motion-safe:animate-pulse" />;
  if (id === 'n-frame') return <div className="flex h-28 items-center justify-center rounded-2xl border-2 border-accent bg-accent-soft text-4xl font-black text-accent">N</div>;
  if (id === 'data-grid') return <div className="publication-grid h-28 rounded-2xl border border-accent/30 bg-bg-sunken" />;
  if (id === 'quote-band') return <div className="flex h-28 items-center rounded-2xl border-l-4 border-accent bg-accent-soft px-5 text-xl font-black">“Merak ölçülebilir.”</div>;
  return <div className="flex h-28 items-center justify-center gap-2 rounded-2xl bg-bg-sunken"><span className="h-1 w-16 rounded-full bg-cyan-400 motion-safe:animate-pulse" /><span className="h-1 w-12 rounded-full bg-accent motion-safe:animate-pulse" /><span className="h-1 w-8 rounded-full bg-blue-600 motion-safe:animate-pulse" /></div>;
}

function Resources({
  onOpenGuide,
  onUseResource,
}: {
  onOpenGuide: () => void;
  onUseResource: (label: string, color: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<(typeof RESOURCE_ITEMS)[number]['id'] | null>(null);
  const selected = RESOURCE_ITEMS.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Tasarım envanteri</p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">Kaynaklar</h2>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">Bir kaynağa basarak lisansını, özelliklerini ve tuvalde nasıl davranacağını incele.</p>
        </div>
        <button type="button" onClick={onOpenGuide} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-bold hover:bg-bg-hover">
          <Icon name="book" size={17} /> Markdown rehberini aç
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {RESOURCE_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selectedId === item.id}
            onClick={() => setSelectedId(item.id)}
            className={`card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent ${selectedId === item.id ? 'border-accent ring-1 ring-accent' : ''}`}
          >
            <ResourcePreview id={item.id} />
            <span className="mt-4 flex items-start justify-between gap-2">
              <span><span className="block font-black">{item.title}</span><span className="block text-sm text-fg-muted">{item.kind}</span></span>
              <Badge tone={item.access === 'Ücretsiz' ? 'success' : 'accent'}>{item.access}</Badge>
            </span>
          </button>
        ))}
      </div>

      {selected ? (
        <Card as="section" className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:items-center" id="resource-detail">
          <ResourcePreview id={selected.id} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-accent">{selected.access} · {selected.kind}</p>
            <h3 className="mt-1 text-xl font-black">{selected.title}</h3>
            <p className="mt-2 text-sm text-fg-muted">{selected.description}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {selected.features.map((feature) => <li key={feature} className="rounded-full bg-bg-sunken px-3 py-1 text-xs text-fg-muted ring-1 ring-[var(--border)]">{feature}</li>)}
            </ul>
          </div>
          <Button type="button" tone="gradient" onClick={() => onUseResource(selected.title, selected.color)}>
            <Icon name="plus" size={17} /> Tasarımda kullan
          </Button>
        </Card>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-fg-muted">Ayrıntılarını görmek için bir kaynak seç.</p>
      )}
    </div>
  );
}
