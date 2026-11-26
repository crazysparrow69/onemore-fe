import type {
  DecodedImage,
  ImageCodec,
  Rect,
} from '@/entities/media/model/compress-image';
import type { Size } from '@/entities/media/model/fit-within';
import { MediaUploadError } from '@/entities/media/model/media-error';

interface BitmapImage extends DecodedImage {
  bitmap: ImageBitmap;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new MediaUploadError('failed'));
        }
      },
      'image/jpeg',
      quality,
    );
  });
}

export const browserCodec: ImageCodec<BitmapImage> = {
  async decode(source) {
    const bitmap = await createImageBitmap(source, {
      imageOrientation: 'from-image',
    });
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => {
        bitmap.close();
      },
    };
  },
  async encode(image, area: Rect, size: Size, quality) {
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new MediaUploadError('failed');
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(
      image.bitmap,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      size.width,
      size.height,
    );
    return toBlob(canvas, quality);
  },
};
