import { useCallback, useEffect, useRef, useState } from 'react';
import {
  completeUpload,
  createUpload,
  sendToStorage,
} from '@/entities/media/api/media.service';
import { browserCodec } from '@/entities/media/model/browser-codec';
import {
  compressImage,
  type Rect,
} from '@/entities/media/model/compress-image';
import { MediaUploadError } from '@/entities/media/model/media-error';
import {
  COMPRESSION,
  type MediaPurpose,
} from '@/entities/media/model/media-purpose';

export interface UploadedMedia {
  id: string;
  key: string;
  previewUrl: string;
}

export interface MediaUploader {
  uploading: boolean;
  progress: number;
  start: (file: Blob, options?: { crop?: Rect }) => Promise<UploadedMedia>;
  cancel: () => void;
}

export function useMediaUpload(purpose: MediaPurpose): MediaUploader {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const previews = useRef<string[]>([]);

  useEffect(
    () => () => {
      controller.current?.abort();
      for (const url of previews.current) {
        URL.revokeObjectURL(url);
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    controller.current?.abort();
  }, []);

  const start = useCallback(
    async (file: Blob, options: { crop?: Rect } = {}) => {
      controller.current?.abort();
      const own = new AbortController();
      controller.current = own;
      setUploading(true);
      setProgress(0);
      try {
        const compressed = await compressImage(
          file,
          { ...COMPRESSION[purpose], ...options },
          browserCodec,
        );
        if (own.signal.aborted) {
          throw new MediaUploadError('aborted');
        }
        const ticket = await createUpload(purpose);
        const receipt = await sendToStorage(ticket.upload, compressed, {
          signal: own.signal,
          onProgress: setProgress,
        });
        const asset = await completeUpload(ticket.id, receipt);
        const previewUrl = URL.createObjectURL(compressed);
        previews.current.push(previewUrl);
        return { id: asset.id, key: asset.key, previewUrl };
      } finally {
        if (controller.current === own) {
          controller.current = null;
          setUploading(false);
        }
      }
    },
    [purpose],
  );

  return { uploading, progress, start, cancel };
}
