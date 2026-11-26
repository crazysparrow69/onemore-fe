import { describe, expect, it, vi } from 'vitest';
import {
  completeUpload,
  createUpload,
  sendToStorage,
} from '@/entities/media/api/media.service';
import type { ApiClient } from '@/shared/api/client';

function clientWith(overrides: Partial<ApiClient>): ApiClient {
  return {
    get: vi.fn(() => Promise.reject(new Error('unexpected GET'))),
    post: vi.fn(() => Promise.reject(new Error('unexpected POST'))),
    put: vi.fn(() => Promise.reject(new Error('unexpected PUT'))),
    patch: vi.fn(() => Promise.reject(new Error('unexpected PATCH'))),
    delete: vi.fn(() => Promise.reject(new Error('unexpected DELETE'))),
    ...overrides,
  };
}

const ticket = {
  id: 'm1',
  purpose: 'avatar',
  upload: {
    url: 'https://api.cloudinary.com/v1_1/c/image/upload',
    fields: { api_key: '1', signature: 's' },
  },
};

describe('createUpload and completeUpload', () => {
  it('asks for a ticket for the purpose', async () => {
    const post = vi.fn().mockResolvedValue(ticket);
    await expect(createUpload('avatar', clientWith({ post }))).resolves.toEqual(
      ticket,
    );
    expect(post).toHaveBeenCalledWith('/media/uploads', { purpose: 'avatar' });
  });

  it('confirms the upload with the version and signature from the storage', async () => {
    const post = vi.fn().mockResolvedValue({
      id: 'm1',
      purpose: 'avatar',
      key: 'f/u/x/avatar/m1',
    });
    const asset = await completeUpload(
      'm1',
      { version: 7, signature: 'sig' },
      clientWith({ post }),
    );
    expect(asset.key).toBe('f/u/x/avatar/m1');
    expect(post).toHaveBeenCalledWith('/media/uploads/m1/complete', {
      version: 7,
      signature: 'sig',
    });
  });

  it('rejects an answer in an unexpected shape', async () => {
    const post = vi.fn().mockResolvedValue({ id: 'm1' });
    await expect(
      createUpload('avatar', clientWith({ post })),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});

class FakeRequest {
  status = 200;
  responseText = '';
  upload: { onprogress: ((event: Partial<ProgressEvent>) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  method = '';
  url = '';
  body: FormData | null = null;
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: FormData) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
}

function send(
  request: FakeRequest,
  extra: { signal?: AbortSignal; onProgress?: (fraction: number) => void } = {},
) {
  return sendToStorage(ticket.upload, new Blob(['jpeg']), {
    ...extra,
    createRequest: () => request as unknown as XMLHttpRequest,
  });
}

describe('sendToStorage', () => {
  it('posts the signed fields and the file to the storage URL', async () => {
    const request = new FakeRequest();
    request.responseText = JSON.stringify({
      version: 1_700_000_001,
      signature: 'abc',
      public_id: 'x',
    });
    const pending = send(request);
    request.onload?.();

    await expect(pending).resolves.toEqual({
      version: 1_700_000_001,
      signature: 'abc',
    });
    expect(request.method).toBe('POST');
    expect(request.url).toBe(ticket.upload.url);
    expect(request.body?.get('api_key')).toBe('1');
    expect(request.body?.get('signature')).toBe('s');
    expect(request.body?.get('file')).toBeInstanceOf(Blob);
  });

  it('reports the progress as a fraction', async () => {
    const request = new FakeRequest();
    const onProgress = vi.fn();
    const pending = send(request, { onProgress });
    request.upload.onprogress?.({
      lengthComputable: true,
      loaded: 25,
      total: 100,
    });
    request.upload.onprogress?.({
      lengthComputable: false,
      loaded: 1,
      total: 0,
    });
    request.responseText = JSON.stringify({ version: 1, signature: 'a' });
    request.onload?.();
    await pending;

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(0.25);
  });

  it.each([
    [
      'an HTTP error',
      (request: FakeRequest) => {
        request.status = 400;
        request.onload?.();
      },
    ],
    [
      'a broken answer',
      (request: FakeRequest) => {
        request.responseText = 'not json';
        request.onload?.();
      },
    ],
    [
      'an answer without a signature',
      (request: FakeRequest) => {
        request.responseText = '{"version":1}';
        request.onload?.();
      },
    ],
    [
      'a network error',
      (request: FakeRequest) => {
        request.onerror?.();
      },
    ],
  ])('fails on %s', async (_label, trigger) => {
    const request = new FakeRequest();
    const pending = send(request);
    trigger(request);
    await expect(pending).rejects.toMatchObject({ failure: 'failed' });
  });

  it('aborts the request when the signal fires', async () => {
    const request = new FakeRequest();
    const controller = new AbortController();
    const pending = send(request, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ failure: 'aborted' });
  });

  it('does not start when the signal is already aborted', async () => {
    const request = new FakeRequest();
    const controller = new AbortController();
    controller.abort();
    await expect(
      send(request, { signal: controller.signal }),
    ).rejects.toMatchObject({ failure: 'aborted' });
    expect(request.body).toBeNull();
  });
});
