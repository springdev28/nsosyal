/**
 * Video kapsayici suresi.
 *
 * Burada codec cozme veya kare tarama yapilmaz. MP4 ve WebM'nin sureyi tasiyan
 * standart kapsayici alanlari okunur; alan yoksa dosya guvenli tarafta kalmak
 * icin reddedilir. Ayrisitirici salt-okunur ve 50 MB yukleme sinirinin icinde
 * calistigi icin harici ffprobe surecine ihtiyac duymaz.
 */

const MP4_CONTAINER_TYPES = new Set(['moov']);
const EBML_HEADER_ID = 0x1a45dfa3;
const WEBM_SEGMENT_ID = 0x18538067;
const WEBM_INFO_ID = 0x1549a966;
const WEBM_TIMECODE_SCALE_ID = 0x2ad7b1;
const WEBM_DURATION_ID = 0x4489;

interface Mp4Box {
  type: string;
  payloadStart: number;
  end: number;
}

interface EbmlVint {
  length: number;
  value: number | null;
}

interface EbmlElement {
  id: number;
  payloadStart: number;
  end: number;
  unknownSize: boolean;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/** Bozuk boyut alaninin sonraki kutulara tasmasina izin vermez. */
function readMp4Box(bytes: Uint8Array, start: number, parentEnd: number): Mp4Box | null {
  if (start + 8 > parentEnd) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const compactSize = view.getUint32(start);
  const type = ascii(bytes, start + 4, 4);
  let headerSize = 8;
  let size = compactSize;

  if (compactSize === 1) {
    if (start + 16 > parentEnd) return null;
    const high = view.getUint32(start + 8);
    const low = view.getUint32(start + 12);
    size = high * 2 ** 32 + low;
    headerSize = 16;
    if (!Number.isSafeInteger(size)) return null;
  } else if (compactSize === 0) {
    size = parentEnd - start;
  }

  if (size < headerSize || start + size > parentEnd) return null;
  return { type, payloadStart: start + headerSize, end: start + size };
}

function readUint64(view: DataView, offset: number): number | null {
  const value = view.getUint32(offset) * 2 ** 32 + view.getUint32(offset + 4);
  return Number.isSafeInteger(value) ? value : null;
}

/** `mvhd`, tum MP4 sunumunun zaman olcegini ve toplam suresini tasir. */
function readMvhdDuration(bytes: Uint8Array, box: Mp4Box): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = bytes[box.payloadStart];
  const timescaleOffset = box.payloadStart + (version === 1 ? 20 : 12);
  const durationOffset = timescaleOffset + 4;
  const durationBytes = version === 1 ? 8 : 4;
  if ((version !== 0 && version !== 1) || durationOffset + durationBytes > box.end) return null;

  const timescale = view.getUint32(timescaleOffset);
  const duration = version === 1
    ? readUint64(view, durationOffset)
    : view.getUint32(durationOffset);
  if (!timescale || !duration) return null;
  const seconds = duration / timescale;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function scanMp4Boxes(bytes: Uint8Array, start: number, end: number): number | null {
  let cursor = start;
  while (cursor + 8 <= end) {
    const box = readMp4Box(bytes, cursor, end);
    if (!box) return null;
    if (box.type === 'mvhd') return readMvhdDuration(bytes, box);
    if (MP4_CONTAINER_TYPES.has(box.type)) {
      const nested = scanMp4Boxes(bytes, box.payloadStart, box.end);
      if (nested !== null) return nested;
    }
    cursor = box.end;
  }
  return null;
}

function readMp4Duration(bytes: Uint8Array): number | null {
  if (bytes.byteLength < 16) return null;
  const first = readMp4Box(bytes, 0, bytes.byteLength);
  // MIME tek basina dosya turu kaniti degildir; MP4 marka kutusu da aranir.
  if (!first || first.type !== 'ftyp') return null;
  return scanMp4Boxes(bytes, first.end, bytes.byteLength);
}

/**
 * EBML degisken tamsayisi. Kimlikte isaret biti korunur, boyutta kaldirilir.
 * Tum deger bitlerinin 1 olmasi Segment icin "dosya sonuna kadar" demektir.
 */
function readEbmlVint(bytes: Uint8Array, offset: number, keepMarker: boolean): EbmlVint | null {
  const first = bytes[offset];
  if (first === undefined || first === 0) return null;
  let marker = 0x80;
  let length = 1;
  while ((first & marker) === 0 && length <= 8) {
    marker >>= 1;
    length += 1;
  }
  if (length > 8 || offset + length > bytes.byteLength) return null;

  let value = BigInt(keepMarker ? first : first & (marker - 1));
  for (let index = 1; index < length; index += 1) {
    value = (value << 8n) | BigInt(bytes[offset + index]);
  }
  if (!keepMarker && value === (1n << BigInt(7 * length)) - 1n) {
    return { length, value: null };
  }
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return { length, value: Number(value) };
}

function readEbmlElement(bytes: Uint8Array, start: number, parentEnd: number): EbmlElement | null {
  const id = readEbmlVint(bytes, start, true);
  if (!id || id.value === null) return null;
  const size = readEbmlVint(bytes, start + id.length, false);
  if (!size) return null;
  const payloadStart = start + id.length + size.length;
  const end = size.value === null ? parentEnd : payloadStart + size.value;
  if (payloadStart > parentEnd || end > parentEnd) return null;
  return { id: id.value, payloadStart, end, unknownSize: size.value === null };
}

function readUnsigned(bytes: Uint8Array, start: number, end: number): number | null {
  const length = end - start;
  if (length < 1 || length > 6) return null;
  let value = 0;
  for (let cursor = start; cursor < end; cursor += 1) value = value * 256 + bytes[cursor];
  return Number.isSafeInteger(value) ? value : null;
}

function readEbmlFloat(bytes: Uint8Array, start: number, end: number): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const length = end - start;
  const value = length === 4
    ? view.getFloat32(start)
    : length === 8
      ? view.getFloat64(start)
      : Number.NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readWebmInfoDuration(bytes: Uint8Array, start: number, end: number): number | null {
  let timecodeScale = 1_000_000;
  let durationUnits: number | null = null;
  let cursor = start;
  while (cursor < end) {
    const element = readEbmlElement(bytes, cursor, end);
    if (!element || element.unknownSize) return null;
    if (element.id === WEBM_TIMECODE_SCALE_ID) {
      timecodeScale = readUnsigned(bytes, element.payloadStart, element.end) ?? timecodeScale;
    } else if (element.id === WEBM_DURATION_ID) {
      durationUnits = readEbmlFloat(bytes, element.payloadStart, element.end);
    }
    cursor = element.end;
  }
  if (!durationUnits || !timecodeScale) return null;
  const seconds = (durationUnits * timecodeScale) / 1_000_000_000;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function readWebmDuration(bytes: Uint8Array): number | null {
  const header = readEbmlElement(bytes, 0, bytes.byteLength);
  if (!header || header.id !== EBML_HEADER_ID || header.unknownSize) return null;

  let cursor = header.end;
  while (cursor < bytes.byteLength) {
    const element = readEbmlElement(bytes, cursor, bytes.byteLength);
    if (!element) return null;
    if (element.id === WEBM_SEGMENT_ID) {
      let childCursor = element.payloadStart;
      while (childCursor < element.end) {
        const child = readEbmlElement(bytes, childCursor, element.end);
        if (!child) return null;
        if (child.id === WEBM_INFO_ID) {
          return readWebmInfoDuration(bytes, child.payloadStart, child.end);
        }
        // Info normalde Cluster'dan once gelir; bilinmeyen boyutlu bir Cluster
        // sonrasinda guvenli bir sekilde atlanamayacagi icin dosya reddedilir.
        if (child.unknownSize) return null;
        childCursor = child.end;
      }
      return null;
    }
    if (element.unknownSize) return null;
    cursor = element.end;
  }
  return null;
}

/** Desteklenen MIME icin kapsayicidan saniye cinsinden sure okur. */
export function readVideoDurationSeconds(bytes: Uint8Array, mimeType: string): number | null {
  if (mimeType === 'video/mp4') return readMp4Duration(bytes);
  if (mimeType === 'video/webm') return readWebmDuration(bytes);
  return null;
}
