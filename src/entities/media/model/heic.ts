const HEIC_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const HEIC_EXTENSION = /\.(heic|heif)$/i;

export function looksLikeHeic(file: Pick<File, 'name' | 'type'>): boolean {
  return (
    HEIC_TYPES.has(file.type.toLowerCase()) || HEIC_EXTENSION.test(file.name)
  );
}

export const HEIC_JPEG_QUALITY = 0.92;

export async function convertHeicToJpeg(file: Blob): Promise<Blob> {
  const { heicTo } = await import('heic-to');
  return heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: HEIC_JPEG_QUALITY,
  });
}
