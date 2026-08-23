import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const UPLOAD_NAME = /^[0-9a-f-]+\.(?:jpe?g|png|webp|mp4|webm)$/i;

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

/**
 * Serves files created after `next build` has finished.
 *
 * Project and post actions write validated files to `public/uploads`. Next.js
 * only indexes ordinary public assets during the build, so a newly uploaded
 * file needs this route before VideoPlayer or an image card can request it.
 * The strict UUID-style filename check prevents this route from reading any
 * other server file.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!UPLOAD_NAME.test(filename)) return new Response('Not found', { status: 404 });

  try {
    const bytes = await readFile(join(process.cwd(), 'public', 'uploads', filename));
    const extension = filename.split('.').at(-1)?.toLowerCase() ?? '';
    return new Response(bytes, {
      headers: {
        'content-type': CONTENT_TYPES[extension] ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
