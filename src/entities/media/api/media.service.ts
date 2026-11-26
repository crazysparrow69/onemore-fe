import { z } from 'zod';
import { api } from '@/entities/user/api/http';
import {
  MEDIA_PURPOSES,
  type MediaPurpose,
} from '@/entities/media/model/media-purpose';
import { MediaUploadError } from '@/entities/media/model/media-error';
import type { ApiClient } from '@/shared/api/client';
import { parseResponse, resourcePath } from '@/shared/api/parse';

const ticketSchema = z.object({
  id: z.string(),
  purpose: z.enum(MEDIA_PURPOSES),
  upload: z.object({
    url: z.string(),
    fields: z.record(z.string(), z.string()),
  }),
});

const assetSchema = z.object({
  id: z.string(),
  purpose: z.enum(MEDIA_PURPOSES),
  key: z.string(),
});

const receiptSchema = z.object({
  version: z.number().int(),
  signature: z.string(),
});

export type UploadTicket = z.infer<typeof ticketSchema>;
export type MediaAsset = z.infer<typeof assetSchema>;
export type UploadReceipt = z.infer<typeof receiptSchema>;

export async function createUpload(
  purpose: MediaPurpose,
  client: ApiClient = api,
): Promise<UploadTicket> {
  return parseResponse(
    ticketSchema,
    await client.post('/media/uploads', { purpose }),
  );
}

export async function completeUpload(
  id: string,
  receipt: UploadReceipt,
  client: ApiClient = api,
): Promise<MediaAsset> {
  return parseResponse(
    assetSchema,
    await client.post(
      `${resourcePath('/media/uploads', id)}/complete`,
      receipt,
    ),
  );
}

export interface SendOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
  createRequest?: () => XMLHttpRequest;
}

export function sendToStorage(
  target: UploadTicket['upload'],
  file: Blob,
  options: SendOptions = {},
): Promise<UploadReceipt> {
  const {
    signal,
    onProgress,
    createRequest = () => new XMLHttpRequest(),
  } = options;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new MediaUploadError('aborted'));
      return;
    }
    const request = createRequest();
    const form = new FormData();
    for (const [name, value] of Object.entries(target.fields)) {
      form.append(name, value);
    }
    form.append('file', file, 'photo.jpg');

    const abort = () => {
      request.abort();
    };
    signal?.addEventListener('abort', abort, { once: true });
    const cleanup = () => {
      signal?.removeEventListener('abort', abort);
    };

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };
    request.onload = () => {
      cleanup();
      if (request.status < 200 || request.status >= 300) {
        reject(
          new MediaUploadError('failed', `status ${String(request.status)}`),
        );
        return;
      }
      try {
        const parsed = receiptSchema.safeParse(
          JSON.parse(request.responseText) as unknown,
        );
        if (parsed.success) {
          resolve(parsed.data);
          return;
        }
      } catch {
        reject(new MediaUploadError('failed'));
        return;
      }
      reject(new MediaUploadError('failed'));
    };
    request.onerror = () => {
      cleanup();
      reject(new MediaUploadError('failed'));
    };
    request.ontimeout = request.onerror;
    request.onabort = () => {
      cleanup();
      reject(new MediaUploadError('aborted'));
    };
    request.open('POST', target.url);
    request.send(form);
  });
}
