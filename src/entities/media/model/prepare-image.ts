import { browserCodec } from '@/entities/media/model/browser-codec';
import type { ImageCodec } from '@/entities/media/model/compress-image';
import { convertHeicToJpeg, looksLikeHeic } from '@/entities/media/model/heic';
import { MediaUploadError } from '@/entities/media/model/media-error';

export type HeicConverter = (file: Blob) => Promise<Blob>;

function jpegNameOf(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '');
  return `${base || 'photo'}.jpg`;
}

export async function prepareImage(
  file: File,
  codec: Pick<ImageCodec, 'decode'> = browserCodec,
  convert: HeicConverter = convertHeicToJpeg,
): Promise<File> {
  try {
    const image = await codec.decode(file);
    image.release();
    return file;
  } catch {
    if (!looksLikeHeic(file)) {
      throw new MediaUploadError('unsupported');
    }
  }
  try {
    const jpeg = await convert(file);
    return new File([jpeg], jpegNameOf(file.name), { type: 'image/jpeg' });
  } catch {
    throw new MediaUploadError('unsupported');
  }
}
