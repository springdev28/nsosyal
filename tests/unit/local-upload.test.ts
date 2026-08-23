import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { commitLocalUploadBatch } from '@/lib/media/local-upload';

let testDirectory: string;

beforeEach(async () => {
  testDirectory = await mkdtemp(join(tmpdir(), 'nsosyal-upload-'));
});

afterEach(async () => {
  await rm(testDirectory, { recursive: true, force: true });
});

describe('commitLocalUploadBatch', () => {
  it('writes a complete batch and exposes an idempotent rollback', async () => {
    const firstPath = join(testDirectory, 'nested', 'first.bin');
    const secondPath = join(testDirectory, 'second.bin');
    const commit = await commitLocalUploadBatch([
      { absolutePath: firstPath, bytes: Buffer.from('first') },
      { absolutePath: secondPath, bytes: Buffer.from('second') },
    ]);

    await expect(readFile(firstPath, 'utf8')).resolves.toBe('first');
    await expect(readFile(secondPath, 'utf8')).resolves.toBe('second');

    await commit.rollback();
    await commit.rollback();
    await expect(access(firstPath)).rejects.toThrow();
    await expect(access(secondPath)).rejects.toThrow();
  });

  it('removes earlier files when a later write fails', async () => {
    const firstPath = join(testDirectory, 'first.bin');
    const existingPath = join(testDirectory, 'existing.bin');
    await writeFile(existingPath, 'keep me');

    await expect(commitLocalUploadBatch([
      { absolutePath: firstPath, bytes: Buffer.from('temporary') },
      { absolutePath: existingPath, bytes: Buffer.from('must not replace') },
    ])).rejects.toThrow();

    await expect(access(firstPath)).rejects.toThrow();
    await expect(readFile(existingPath, 'utf8')).resolves.toBe('keep me');
  });
});
