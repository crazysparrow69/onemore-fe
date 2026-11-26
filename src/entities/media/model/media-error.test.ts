import { describe, expect, it } from 'vitest';
import {
  isAborted,
  mediaErrorKey,
  MediaUploadError,
} from '@/entities/media/model/media-error';
import { ApiError } from '@/shared/api/error';

describe('mediaErrorKey', () => {
  it('maps known failures to their own message', () => {
    expect(mediaErrorKey(new MediaUploadError('unsupported'))).toBe(
      'media.errors.unsupported',
    );
    expect(mediaErrorKey(new ApiError(429, 'MEDIA_UPLOAD_LIMIT', 'x'))).toBe(
      'media.errors.limit',
    );
    expect(mediaErrorKey(new ApiError(409, 'PROFILE_REQUIRED', 'x'))).toBe(
      'media.errors.profileRequired',
    );
  });

  it('falls back to the generic message', () => {
    expect(mediaErrorKey(new MediaUploadError('failed'))).toBe(
      'media.errors.failed',
    );
    expect(mediaErrorKey(new ApiError(500, 'INTERNAL_ERROR', 'x'))).toBe(
      'media.errors.failed',
    );
    expect(mediaErrorKey(new Error('boom'))).toBe('media.errors.failed');
  });

  it('recognises an aborted upload', () => {
    expect(isAborted(new MediaUploadError('aborted'))).toBe(true);
    expect(isAborted(new MediaUploadError('failed'))).toBe(false);
  });
});
