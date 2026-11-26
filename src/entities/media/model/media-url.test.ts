import { afterEach, describe, expect, it, vi } from 'vitest';
import { mediaUrl } from '@/entities/media/model/media-url';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('mediaUrl', () => {
  it('serves catalog photos from the app itself', () => {
    expect(mediaUrl('exercises/bench/0.webp', 'exercise_thumb')).toBe(
      '/exercises/bench/0.webp',
    );
  });

  it('builds a named-transformation Cloudinary URL for user files', () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    expect(mediaUrl('onemore-dev/u/user-1/avatar/a1', 'avatar_lg')).toBe(
      'https://res.cloudinary.com/demo-cloud/image/upload/t_avatar_lg/onemore-dev/u/user-1/avatar/a1',
    );
    expect(mediaUrl('f/u/x/exercise_photo/e1', 'exercise_thumb')).toContain(
      '/t_exercise_thumb/f/u/x/exercise_photo/e1',
    );
  });

  it('fails loudly when the cloud name is missing', () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', '');
    expect(() => mediaUrl('f/u/x/avatar/a', 'avatar_sm')).toThrow(
      /VITE_CLOUDINARY_CLOUD_NAME/,
    );
  });
});
