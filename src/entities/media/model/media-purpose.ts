export const MEDIA_PURPOSES = ['avatar', 'exercise_photo'] as const;
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export interface CompressionLimits {
  maxSide: number;
  targetBytes: number;
}

export const COMPRESSION: Readonly<Record<MediaPurpose, CompressionLimits>> = {
  avatar: { maxSide: 512, targetBytes: 150_000 },
  exercise_photo: { maxSide: 1280, targetBytes: 250_000 },
};
