import { fitWithin, type Size } from '@/entities/media/model/fit-within';
import { MediaUploadError } from '@/entities/media/model/media-error';
import type { CompressionLimits } from '@/entities/media/model/media-purpose';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DecodedImage {
  width: number;
  height: number;
  release: () => void;
}

export interface ImageCodec<Image extends DecodedImage = DecodedImage> {
  decode: (source: Blob) => Promise<Image>;
  encode: (
    image: Image,
    area: Rect,
    size: Size,
    quality: number,
  ) => Promise<Blob>;
}

export const QUALITY_STEPS = [0.85, 0.8, 0.75, 0.7, 0.65, 0.6] as const;

export async function compressImage<Image extends DecodedImage>(
  source: Blob,
  options: CompressionLimits & { crop?: Rect },
  codec: ImageCodec<Image>,
): Promise<Blob> {
  let image: Image;
  try {
    image = await codec.decode(source);
  } catch {
    throw new MediaUploadError('unsupported');
  }
  try {
    const area = options.crop ?? {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    };
    const size = fitWithin(area.width, area.height, options.maxSide);
    let result: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      result = await codec.encode(image, area, size, quality);
      if (result.size <= options.targetBytes) {
        break;
      }
    }
    if (!result) {
      throw new MediaUploadError('failed');
    }
    return result;
  } finally {
    image.release();
  }
}
