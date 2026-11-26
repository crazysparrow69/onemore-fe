declare global {
  interface ImportMetaEnv {
    readonly VITE_NEON_AUTH_URL: string;
    readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  }
}

export function neonAuthUrl(): string {
  const value: unknown = import.meta.env.VITE_NEON_AUTH_URL;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Invalid environment: VITE_NEON_AUTH_URL: is required');
  }
  return value;
}

export function cloudinaryCloudName(): string {
  const value: unknown = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      'Invalid environment: VITE_CLOUDINARY_CLOUD_NAME: is required',
    );
  }
  return value;
}
