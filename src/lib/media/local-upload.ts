import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface PreparedLocalUpload {
  absolutePath: string;
  bytes: Uint8Array;
}

export interface LocalUploadCommit {
  rollback: () => Promise<void>;
}

async function removeFiles(paths: readonly string[]): Promise<void> {
  await Promise.allSettled(paths.map((path) => rm(path, { force: true })));
}

/**
 * Writes one validated upload batch and remembers every file it created.
 *
 * Server Actions prepare the bytes first, then call this function immediately
 * before their DemoStore mutation. A write failure removes earlier files from
 * the same batch. The returned rollback connects this filesystem step to the
 * data cleanup performed by the calling action.
 */
export async function commitLocalUploadBatch(
  uploads: readonly PreparedLocalUpload[],
): Promise<LocalUploadCommit> {
  const writtenPaths: string[] = [];

  try {
    for (const upload of uploads) {
      await mkdir(dirname(upload.absolutePath), { recursive: true });
      await writeFile(upload.absolutePath, upload.bytes, { flag: 'wx' });
      writtenPaths.push(upload.absolutePath);
    }
  } catch (error) {
    await removeFiles(writtenPaths);
    throw error;
  }

  return {
    rollback: () => removeFiles(writtenPaths),
  };
}
