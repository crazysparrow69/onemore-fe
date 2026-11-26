import { describe, expect, it, vi } from 'vitest';
import type { ImageCodec } from '@/entities/media/model/compress-image';
import { looksLikeHeic } from '@/entities/media/model/heic';
import { prepareImage } from '@/entities/media/model/prepare-image';

function codecThatDecodes(decodable: (file: Blob) => boolean) {
  const release = vi.fn();
  const codec: ImageCodec = {
    decode: (file) =>
      decodable(file)
        ? Promise.resolve({ width: 10, height: 10, release })
        : Promise.reject(new Error('cannot decode')),
    encode: () => Promise.resolve(new Blob()),
  };
  return { codec, release };
}

describe('prepareImage', () => {
  it('keeps a file the browser can already decode', async () => {
    const { codec, release } = codecThatDecodes(() => true);
    const convert = vi.fn();
    const file = new File(['x'], 'IMG_1.heic', { type: 'image/heic' });

    await expect(prepareImage(file, codec, convert)).resolves.toBe(file);
    expect(convert).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledOnce();
  });

  it('converts a HEIC file the browser cannot decode into a JPEG', async () => {
    const { codec } = codecThatDecodes(() => false);
    const convert = vi.fn().mockResolvedValue(new Blob(['jpeg']));
    const file = new File(['x'], 'IMG_1.HEIC', { type: '' });

    const result = await prepareImage(file, codec, convert);

    expect(convert).toHaveBeenCalledWith(file);
    expect(result.name).toBe('IMG_1.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  it('rejects a file that is neither decodable nor HEIC', async () => {
    const { codec } = codecThatDecodes(() => false);
    const convert = vi.fn();
    const file = new File(['x'], 'scan.pdf', { type: 'application/pdf' });

    await expect(prepareImage(file, codec, convert)).rejects.toMatchObject({
      failure: 'unsupported',
    });
    expect(convert).not.toHaveBeenCalled();
  });

  it('rejects a HEIC file that cannot be converted', async () => {
    const { codec } = codecThatDecodes(() => false);
    const convert = vi.fn().mockRejectedValue(new Error('bad heic'));
    const file = new File(['x'], 'IMG_1.heic', { type: 'image/heic' });

    await expect(prepareImage(file, codec, convert)).rejects.toMatchObject({
      failure: 'unsupported',
    });
  });
});

describe('looksLikeHeic', () => {
  it('recognises HEIC and HEIF by type or extension', () => {
    expect(looksLikeHeic({ name: 'a.jpg', type: 'image/heif' })).toBe(true);
    expect(looksLikeHeic({ name: 'a.HEIC', type: '' })).toBe(true);
    expect(
      looksLikeHeic({ name: 'a.heif', type: 'application/octet-stream' }),
    ).toBe(true);
    expect(looksLikeHeic({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false);
  });
});
