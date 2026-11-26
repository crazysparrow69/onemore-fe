import { describe, expect, it, vi } from 'vitest';
import {
  compressImage,
  QUALITY_STEPS,
  type DecodedImage,
  type ImageCodec,
} from '@/entities/media/model/compress-image';
import { MediaUploadError } from '@/entities/media/model/media-error';

function codec(
  sizes: readonly number[],
  image = { width: 4000, height: 3000 },
) {
  const release = vi.fn();
  const encode = vi.fn(
    (_image: DecodedImage, _area, _size, quality: number) => {
      const index = QUALITY_STEPS.indexOf(
        quality as (typeof QUALITY_STEPS)[number],
      );
      return Promise.resolve(new Blob([new Uint8Array(sizes[index] ?? 0)]));
    },
  );
  const value: ImageCodec = {
    decode: () => Promise.resolve({ ...image, release }),
    encode,
  };
  return { value, encode, release };
}

const limits = { maxSide: 1000, targetBytes: 1000 };

describe('compressImage', () => {
  it('stops at the first quality that fits the target size', async () => {
    const { value, encode } = codec([5000, 3000, 900, 100]);
    const result = await compressImage(new Blob(['x']), limits, value);

    expect(result.size).toBe(900);
    expect(encode.mock.calls.map((call) => call[3])).toEqual([0.85, 0.8, 0.75]);
  });

  it('scales the whole image to the maximum side', async () => {
    const { value, encode } = codec([100]);
    await compressImage(new Blob(['x']), limits, value);

    expect(encode.mock.calls[0]?.[1]).toEqual({
      x: 0,
      y: 0,
      width: 4000,
      height: 3000,
    });
    expect(encode.mock.calls[0]?.[2]).toEqual({ width: 1000, height: 750 });
  });

  it('uses the crop area as the source', async () => {
    const { value, encode } = codec([100]);
    const crop = { x: 100, y: 50, width: 2000, height: 2000 };
    await compressImage(new Blob(['x']), { ...limits, crop }, value);

    expect(encode.mock.calls[0]?.[1]).toEqual(crop);
    expect(encode.mock.calls[0]?.[2]).toEqual({ width: 1000, height: 1000 });
  });

  it('returns the smallest attempt when nothing fits, and releases the image', async () => {
    const { value, encode, release } = codec([
      9000, 8000, 7000, 6000, 5000, 4000,
    ]);
    const result = await compressImage(new Blob(['x']), limits, value);

    expect(result.size).toBe(4000);
    expect(encode).toHaveBeenCalledTimes(QUALITY_STEPS.length);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('reports an unreadable file as unsupported', async () => {
    const broken: ImageCodec = {
      decode: () => Promise.reject(new Error('bad image')),
      encode: () => Promise.reject(new Error('unreachable')),
    };
    await expect(
      compressImage(new Blob(['x']), limits, broken),
    ).rejects.toMatchObject({
      failure: 'unsupported',
    });
    await expect(
      compressImage(new Blob(['x']), limits, broken),
    ).rejects.toBeInstanceOf(MediaUploadError);
  });
});
