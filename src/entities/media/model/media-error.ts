import { isApiError } from '@/shared/api/error';

export type MediaFailure = 'unsupported' | 'failed' | 'aborted';

export class MediaUploadError extends Error {
  readonly failure: MediaFailure;

  constructor(failure: MediaFailure, message: string = failure) {
    super(message);
    this.name = 'MediaUploadError';
    this.failure = failure;
  }
}

export function isAborted(error: unknown): boolean {
  return error instanceof MediaUploadError && error.failure === 'aborted';
}

export type MediaErrorKey =
  | 'media.errors.unsupported'
  | 'media.errors.limit'
  | 'media.errors.profileRequired'
  | 'media.errors.failed';

const API_ERROR_KEYS: Readonly<Record<string, MediaErrorKey>> = {
  MEDIA_UPLOAD_LIMIT: 'media.errors.limit',
  PROFILE_REQUIRED: 'media.errors.profileRequired',
};

export function mediaErrorKey(error: unknown): MediaErrorKey {
  if (error instanceof MediaUploadError && error.failure === 'unsupported') {
    return 'media.errors.unsupported';
  }
  if (isApiError(error)) {
    return API_ERROR_KEYS[error.code] ?? 'media.errors.failed';
  }
  return 'media.errors.failed';
}
