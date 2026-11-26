import { cloudinaryCloudName } from '@/shared/lib/client-env';

export type MediaVariant =
  'avatar_sm' | 'avatar_lg' | 'exercise_thumb' | 'exercise_photo';

const STATIC_PREFIX = 'exercises/';

export function mediaUrl(key: string, variant: MediaVariant): string {
  if (key.startsWith(STATIC_PREFIX)) {
    return `/${key}`;
  }
  return `https://res.cloudinary.com/${cloudinaryCloudName()}/image/upload/t_${variant}/${key}`;
}
